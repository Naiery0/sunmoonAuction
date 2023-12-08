import { Text, View, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig.js';
import ImageButton from '../components/ImageButton';
import ImageSlider from '../components/ImageSlider';
import ChatRoomModal from '../components/ChatRoomModal'
import { createOrJoinChatRoom, formatToCurrency, handleDelete, fetchUserLikeList, isLiked, handleToggleLike } from '../components/Utils';
import UserInfoModal from '../components/UserInfoModal';
import OptionModal from '../components/OptionModal';
import ReportModal from '../components/ReportModal';

const MarketDetail = (props) => {

  const [modalVisible, setModalVisible] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const itemName = props.itemName;
  const itemPrice = props.itemPrice;
  const imageUrl = props.imageUrl;
  const itemDate = props.itemDate;
  const itemDetail = props.itemDetail;
  const trigger = props.trigger;
  const writer = props.writer ? props.writer : "작성자";
  const user = props.user;
  const itemId = props.itemId;
  const dealMode = props.dealMode;
  const reserve = props.reserve;
  const done = props.done;

  const [userLikeList, setUserLikeList] = useState([]);
  const [userInfoVisible, setUserInfoVisible] = useState(false);
  const openUserInfoModal = () => {
    setUserInfoVisible(true);
  };
  const [writerPosts, setWriterPosts] = useState([]); // 일반 판매글
  const [writerAuctionPosts, setWriterAuctionPosts] = useState([]); // 경매 판매글
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  //user likelist 관리
  useEffect(() => {
    fetchUserLikeList(user, setUserLikeList);
  }, [user]);

  isLiked(itemId, userLikeList);

  useEffect(() => {
    const fetchWriterPosts = async () => {
      const postsSnapshot = await db.collection('posts')
        .where('writer', '==', writer)
        .get();
      const auctionItemsSnapshot = await db.collection('AuctionItems')
        .where('writer', '==', writer)
        .get();

      setWriterPosts(postsSnapshot.docs.map(doc => ({ ...doc.data(), type: 'post' })));
      setWriterAuctionPosts(auctionItemsSnapshot.docs.map(doc => ({ ...doc.data(), type: 'auction' })));
    };

    fetchWriterPosts();
  }, [writer]);
  const handleChat = async () => {
    await createOrJoinChatRoom(db, user, writer, setRoomId, setModalVisible);
  };

  const handleOptionSelect = (option) => {
    setOptionModalVisible(false);
    Alert.alert(
      "작업 확인", // Alert 제목
      `정말로 '${option}' 작업을 수행하시겠습니까?`, // Alert 메시지
      [
        {
          text: "취소",
          onPress: () => console.log("작업 취소됨"),
          style: "cancel"
        },
        { text: "확인", onPress: () => performAction(option) }
      ],
      { cancelable: false }
    );
  };

  const performAction = async (option) => {
    try {
      const updates = {};
      if (option === '예약하기') {
        updates.reserve = true;
        alert('거래 예약이 처리되었습니다.');
      } else if (option === '예약 취소') {
        updates.reserve = false;
        alert('예약이 취소되었습니다.');
      } else if (option === '거래완료') {
        updates.done = true;
        alert('거래 완료가 처리되었습니다.');
      } else if (option === '거래 재개') {
        updates.reserve = false;
        updates.done = false;
        alert('거래가 재개되었습니다.');
      } else if (option === '끌어올리기') {
        bumpPost();
        alert('게시물이 끌어올려졌습니다.');
      } else if (option === '삭제') {
        // handleDelete 함수는 해당 옵션에서 처리
        handleDelete(user, writer, itemId, "market");
        return;
      }

      // Firestore 문서 업데이트
      if (option !== '삭제') {
        await db.collection('posts').doc(itemId).update(updates);
      }
    } catch (error) {
      alert('작업 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error("Error updating document: ", error);
    }
  };


  const bumpPost = async () => {
    try {
      // 게시물의 생성 시간을 가져옵니다.
      const postRef = db.collection('posts').doc(itemId);
      const postDoc = await postRef.get();
      const createdAt = postDoc.data().createdAt;

      // 현재 시간과 게시물의 생성 시간 비교
      const now = firebase.firestore.FieldValue.serverTimestamp();
      const postDate = createdAt.toDate();
      const timeDiff = now - postDate; // 밀리초 단위 차이
      const hoursDiff = timeDiff / (1000 * 60 * 60); // 시간 단위로 변환

      if (hoursDiff < 24) {
        alert('끌어올리기는 게시 후 24시간이 지난 후에 가능합니다.');
        return;
      }

      // Firestore 문서 업데이트
      await postRef.update({
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert('게시물이 끌어올려졌습니다.');
    } catch (error) {
      alert('끌어올리기에 실패했습니다. 다시 시도해주세요.');
      console.error("Error updating document: ", error);
    }
  };

  const closeChat = () => {
    setModalVisible(false)
  }
    // 신고 모달을 여는 함수
  const openReportModal = () => {
    setReportModalVisible(true);
  };

  // 신고 모달을 닫는 함수
  const closeReportModal = () => {
    setReportModalVisible(false);
  };
 
  return (
    <View style={styles.container}>
      <OptionModal
        isVisible={optionModalVisible}
        onClose={() => setOptionModalVisible(false)}
        onOptionSelect={handleOptionSelect}
        reserve={reserve} // reserve 상태 전달
        done={done} // done 상태 전달
        animationType="none" // 애니메이션 제거
      />
      <ChatRoomModal
        isVisible={modalVisible}
        onClose={() => closeChat()}
        roomId={roomId}
        userNickname={user} // 현재 사용자 닉네임
        partnerNickname={writer} // 상대방 닉네임
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={userInfoVisible}
        onRequestClose={() => setUserInfoVisible(false)}
      >
        <View style={{ flex: 1 }}>
          <UserInfoModal
            onClose={() => setUserInfoVisible(false)}
            writer={writer}
            itemsForSale={writerPosts} // 일반 판매글
            auctionItems={writerAuctionPosts} // 경매 판매글
            visible={userInfoVisible}
          />
        </View>
      </Modal>

      <ScrollView style={{ flex: 1 }}>
        {/* 상단 부분 */}
        <View style={styles.header}>
          <View style={{ position: "absolute", zIndex: 5, top: 10 }}>
            <ImageButton
              imgSource={require("../assets/left.png")}
              imgFunction={trigger}
              imgColor={"lightgray"}
            />
          </View>
          <View style={{ position: "absolute", zIndex: 5, right: 5, top: 10 }}>
            {user === writer ? (
              <ImageButton
                imgSource={require("../assets/vertidot.png")}
                imgFunction={() => setOptionModalVisible(true)}
                imgColor={"lightgray"}
              />
            ) : (
              <ImageButton
                imgSource={require("../assets/report.png")} // 'report' 이미지 경로를 적절히 설정하세요
                imgFunction={openReportModal} // 신고 처리 함수 
                imgColor={"lightgray"}
              />
            )} 
          </View>

          <View style={{ flex: 1 }}>
            <ImageSlider source={imageUrl} />
          </View>
        </View>

        {/* 중앙 부분 */}
        <View style={styles.section}>
          <View style={styles.titleWrap}>
            <View style={{ width: "80%", justifyContent: "flex-start" }}>
              <Text style={styles.itemTitle}>{itemName}</Text>
              <Text style={styles.itemTitle}>{formatToCurrency(itemPrice) + " 원"}</Text>
              <Text style={styles.itemSub} onPress={openUserInfoModal}>{writer} ㆍ {itemDate}</Text>
            </View>
          </View>

          <View style={styles.contentWrap}>
            <Text style={styles.itemType}>{"■ " + dealMode + " 희망"}</Text>
            <Text style={styles.itemDetail}>{itemDetail}</Text>
          </View>

        </View>
      </ScrollView>

      {/* 하단 부분 */}
      <View style={styles.footer}>
        <ReportModal
          isVisible={reportModalVisible}
          onClose={closeReportModal}
          reporter={user}
          reportedUser={writer}
          roomName={itemId}
        />
        {userLikeList && (
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => handleToggleLike(user, itemId, "posts", userLikeList, setUserLikeList)}
          >
            <Image
              source={require("../assets/fullheart.png")}
              style={{ width: 30, height: 30, tintColor: isLiked(itemId, userLikeList) ? "rgb(211,25,69)" : "darkgray" }}
            />
          </TouchableOpacity>
        )}

        {
          done ? (
            <View style={styles.banner}>
              <Text style={{ fontSize: 25, color: "white" }}>거래 완료</Text>
            </View>
          ) : reserve ? (
            <View style={styles.reserve}>
              <Text style={{ fontSize: 25, color: "white" }}>예약</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={handleChat}
            >
              <Text style={{ fontSize: 25, color: "white" }}>채팅</Text>
            </TouchableOpacity>
          )
        }

      </View>
    </View>

  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "white"
  },
  header: {
    width: "100%",
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  section: {
    backgroundColor: "rgb(244,244,244)"
  },
  footer: {
    flexDirection: "row",
    height: "10%",
    backgroundColor: "rgb(244,244,244)",
    padding: 10
  },
  titleWrap: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: "lightgray",
    backgroundColor: "rgb(244,244,244)",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  contentWrap: {
    padding: 15,
    backgroundColor: "white"
  },
  itemTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 2,
    width: "90%"
  },
  itemType: {
    fontSize: 16,
    color: "darkgray",
    marginBottom: 5
  },
  itemDetail: {
    lineHeight: 22,
    fontSize: 16
  },
  itemSub: {
    marginTop: 2,
    color: "darkgray"
  },
  likeBtn: {
    width: "20%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(211,211,211)",
    marginLeft: "3.3%",
    borderRadius: 10
  },
  chatBtn: {
    width: "70%",
    marginLeft: "3.3%",
    marginRight: "3.3%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(0,106,121)",
    borderRadius: 10
  },
  reserve: {
    width: "70%",
    marginLeft: "3.3%",
    marginRight: "3.3%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(135,214,141)",
    borderRadius: 10
  },
  banner: {
    width: "70%",
    marginLeft: "3.3%",
    marginRight: "3.3%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(184,184,184)",
    borderRadius: 10
  },
})

export default MarketDetail;