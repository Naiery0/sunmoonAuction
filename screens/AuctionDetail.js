import { Text, View, StyleSheet, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { firebase, db } from '../firebaseConfig.js';
import ImageButton from '../components/ImageButton';
import ImageSlider from '../components/ImageSlider';
import ChatRoomModal from '../components/ChatRoomModal'
import { createOrJoinChatRoom, formatToCurrency, handleDelete, fetchUserLikeList, isLiked, handleToggleLike } from '../components/Utils';
import AuctionModal from '../components/AuctionModal';
import AuctionLog from '../components/AuctionLog';
import UserInfoModal from '../components/UserInfoModal';
import ReportModal from '../components/ReportModal';
const AuctionDetail = (props) => {
 
  const [modalVisible, setModalVisible] = useState(false);
  const [listVisible, setListVisible] = useState(false);
  const [auctionVisible, setAuctionVisible] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const itemId = props.itemId;
  const itemName = props.itemName;
  const itemPrice = props.itemPrice;
  const imageUrl = props.imageUrl;
  const itemDate = props.itemDate;
  const itemDetail = props.itemDetail;
  const trigger = props.trigger;
  const writer = props.writer;
  const bestUser = props.bestUser;
  const user = props.user;
  const dealMode = props.dealMode;
  const [writerPosts, setWriterPosts] = useState([]); // 일반 판매글
  const [auctionUserPosts, setAuctionUserPosts] = useState([]); // 경매 판매글
  const [flag, setFlag] = useState(0);
  const [userLikeList, setUserLikeList] = useState([]);
  const [likeList, setLikeList] = useState();
  const [enjoyPeople, setEnjoyPeople] = useState([]);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  //user likelist 관리
  useEffect(() => {
    fetchUserLikeList(user, setUserLikeList);
  }, [user]);

  isLiked(itemId, userLikeList);

  useEffect(() => {
    const fetchPosts = async () => {
      // 일반 판매글 가져오기
      const postsSnapshot = await db.collection('posts')
        .where('writer', '==', writer)
        .get();
      setWriterPosts(postsSnapshot.docs.map(doc => doc.data()));

      // 경매 판매글 가져오기
      const auctionSnapshot = await db.collection('AuctionItems')
        .where('writer', '==', writer)
        .get();
      setAuctionUserPosts(auctionSnapshot.docs.map(doc => doc.data()));
    };

    fetchPosts();
  }, [writer]);

  useEffect(() => {
    const auctionItemRef = db.collection('AuctionItems').doc(itemId);
    const participantsCollectionRef = auctionItemRef.collection('participants');

    // 실시간 리스너 설정
    const unsubscribe = participantsCollectionRef.onSnapshot(snapshot => {
      const participants = new Set();

      snapshot.forEach(doc => {
        participants.add(doc.data().user);
      });

      // 유니크한 참여자 수 계산
      setEnjoyPeople(participants.size - 1);
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, [itemId]);

  const [money, setMoney] = useState(null);

  useEffect(() => {
    if (user) {
      console.log("user : " + user);
      // Firestore에서 Users 컬렉션에서 userName이 user와 일치하는 문서를 찾습니다.
      const userRef = db.collection('Users').where('UserName', '==', user);

      // 이 코드는 userName이 유일한 경우에만 작동합니다. 
      // 만약 userName이 중복될 수 있다면 여러 개의 문서가 반환될 수 있으므로 주의해야 합니다.

      userRef.get()
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            // userName이 일치하는 사용자 문서를 가져옵니다.
            const userData = querySnapshot.docs[0].data();
            const userMoney = userData.money;
            setMoney(userMoney);
          } else {
            console.log('사용자를 찾을 수 없습니다.');
            setMoney(null); // 사용자를 찾을 수 없을 경우 null로 설정
          }
        })
        .catch((error) => {
          console.error('Firestore에서 데이터 가져오기 실패:', error);
          setMoney(null); // 데이터 가져오기 실패 시 null로 설정
        });
    }
  }, [user]);

  const [currentBid, setCurrentBid] = useState(itemPrice);
  const [remainingTime, setRemainingTime] = useState('');
  const [endDate, setEndDate] = useState(props.endDate);

  const [userInfoVisible, setUserInfoVisible] = useState(false);
  const openUserInfoModal = () => {
    setUserInfoVisible(true);
  };

  useEffect(() => {
    // Firestore에서 경매 품목 문서 가져오기
    const auctionItemRef = db.collection('AuctionItems').doc(props.itemId);

    // Firestore 실시간 업데이트 설정
    const unsubscribe = auctionItemRef.onSnapshot((doc) => {
      const data = doc.data();
      const newBid = data.price;

      setCurrentBid(newBid);

      const newEndDate = data.endDate;
      setEndDate(newEndDate);

      console.log("test");
      console.log("endDate: " + endDate);
    });

    return () => {
      // 컴포넌트 언마운트 시 Firestore 구독 해제
      unsubscribe();
    };
  }, [props.itemId]);

  // 입찰 버튼 누를 때 Firestore 업데이트
  const handleBid = async () => {
    try {
      console.log("클라이언트 사용자가 입찰");

      // Firestore에서 경매 품목 문서 가져오기
      const auctionItemRef = db.collection('AuctionItems').doc(props.itemId);
      const auctionItemSnapshot = await auctionItemRef.get();
      const auctionItemData = auctionItemSnapshot.data();

      // 남은 시간을 밀리초로 계산
      const now = new Date();
      const countdown = endDate.toDate() - now;

      // 남은 시간이 0 이하인 경우 입찰을 막음
      if (countdown <= 0) {
        alert("종료된 경매입니다");
        console.log("경매 시간이 종료되었습니다. 입찰이 불가능합니다.");
        return;
      }
      // 현재 유저가 글 작성자와 동일한 경우 입찰 허용 ㄴ
      else if (user === writer) {
        alert("글 작성자는 경매에 참여할 수 없습니다");
        return;
      }
      // 현재 유저가 최고 입찰자와 동일한 경우 입찰 허용하지 않음
      else if (auctionItemData.bestUser === user) {
        alert("이미 최고 입찰자입니다");
        console.log("이미 최고 입찰자입니다. 입찰이 불가능합니다.");
        return;
      }

      if (money < currentBid) {
        alert("옥션 머니가 부족합니다");
        return;
      }

      // 남은 시간이 5분 미만인 경우
      else if (countdown < 300000) {
        // 현재 EndDate 값 가져오기
        const currentEndDate = auctionItemData.endDate;

        // 현재 EndDate에 5분(300,000 밀리초) 추가
        const newEndDate = new firebase.firestore.Timestamp(
          currentEndDate.seconds + Math.floor((300000 - countdown) / 1000), // 초 단위로 계산
          currentEndDate.nanoseconds
        );

        // Firestore에 새로운 EndDate 값을 업데이트
        await auctionItemRef.update({
          endDate: newEndDate,
        });

        setEndDate(newEndDate);
      }

      const newBid = currentBid + Math.floor(currentBid*0.05); // 입찰 가격 업데이트 로직

      // Firestore에 입찰 가격 업데이트
      await auctionItemRef.update({
        price: newBid,
        bestUser: user, // 최고 입찰자 변경
      });

      // 컬렉션 AuctionItems의 하위 컬렉션 participants에 bidAmount, timestamp, user 저장
      const participantsCollectionRef = auctionItemRef.collection('participants');
      await participantsCollectionRef.add({
        bidAmount: newBid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        user: user,
      });
    } catch (error) {
      console.error("Error handling bid: ", error);
    }
  };

  useEffect(() => {
    updateRemainingTime();
    const timer = setInterval(updateRemainingTime, 1000);

    // 컴포넌트 언마운트 시 타이머 해제
    return () => clearInterval(timer);
  }, [endDate]);

  const [remainingTimeStyle, setRemainingTimeStyle] = useState({});

  // remainingTime 상태를 업데이트하는 함수
  const updateRemainingTime = () => {

    if (flag == 0) {
      const now = new Date();
      const countdown = endDate.toDate() - now;

      // 남은 시간을 표시 형식으로 변환 (예: '01:23:45' 형태)
      const hours = String(Math.floor((countdown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
      const minutes = String(Math.floor((countdown % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
      const seconds = String(Math.floor((countdown % (1000 * 60)) / 1000)).padStart(2, '0');

      const formattedTime = `${hours}:${minutes}:${seconds}`;
      setRemainingTime(formattedTime);

      // 남은 시간이 1시간 미만인 경우 빨간색으로 표시
      if (countdown < 60 * 60 * 1000) {
        setRemainingTimeStyle({ color: 'rgb(211,25,69)' });
      } else {
        setRemainingTimeStyle({}); // 빨간색 스타일 초기화
      }

      if (countdown <= 0) {
        setFlag(1);
        setRemainingTime(`00:00:00`);
      }
    }
  };

  //이거 선언하면 됨 onPress={handleChat}
  const handleChat = async () => {
    await createOrJoinChatRoom(db, user, writer, setRoomId, setModalVisible);
  };

  const handleDeleteTrigger = () => {
    //console.log("check");
    handleDelete(user, writer, itemId, "auction");
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

      <ChatRoomModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        roomId={roomId}
        userNickname={user} // 현재 사용자 닉네임
        partnerNickname={writer} // 상대방 닉네임
      />

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
                imgSource={require("../assets/thinclose.png")}
                imgFunction={handleDeleteTrigger}
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

          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingRight: 10, paddingVertical: 10 }}>
            <View style={{ paddingLeft: 10 }}>

              {flag == 0 ?
                (
                  <View>
                    <Text style={styles.auctionInfo}>최소 입찰가</Text>
                    <Text style={{ ...styles.auctionInfo, fontWeight: "none" }}>{formatToCurrency(currentBid + Math.floor(currentBid * 0.05)) + "원"}</Text>
                  </View>
                ) :
                (
                  <View>
                    <Text style={styles.auctionInfo}>최종 낙찰가</Text>
                    <Text style={styles.auctionInfo}>{formatToCurrency(currentBid) + "원"}</Text>
                  </View>
                )
              }
            </View>

            <View style={{ justifyContent: "center", alignItems: "flex-end", paddingLeft: 0, width: "35%" }}>
              <Text style={{ ...styles.timePrint, ...remainingTimeStyle }}>남은 시간</Text>
              <Text style={{ ...styles.timePrint, ...remainingTimeStyle }}>{remainingTime}</Text>
            </View>
          </View>

          <View style={styles.titleWrap}>
            <View style={{ width: "80%", justifyContent: "flex-start" }}>
              <Text style={styles.itemTitle}>{itemName}</Text>
              <Text style={{ ...styles.itemTitle, fontWeight: "none" }}>{formatToCurrency(itemPrice) + " 원"}</Text>
              <Text style={styles.itemSub} onPress={openUserInfoModal}>{writer} ㆍ {itemDate}</Text>
            </View>


            <View style={{ width: "20%", justifyContent: "flex-start" }}>
              <TouchableOpacity
                style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}
                onPress={() => setListVisible(true)}
              >
                <Image source={require("../assets/people.png")} style={{ width: 30, height: 30, tintColor: "darkgray", marginRight: 5 }} />
                <Text style={{ fontWeight: "bold", fontSize: 18, color: "darkgray" }}>{enjoyPeople}</Text>
              </TouchableOpacity>
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
        {userLikeList && (
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => handleToggleLike(user, itemId, "AuctionItems", userLikeList, setUserLikeList)}
          > 
            {isLiked(itemId, userLikeList) ? (
              <Image
                source={require("../assets/fullheart.png")}
                style={{ width: 30, height: 30, tintColor: "rgb(211,25,69)" }}
              />)
              : (<Image
                source={require("../assets/heart.png")}
                style={{ width: 30, height: 30, tintColor: "darkgray" }}
              />)
            }
          </TouchableOpacity>
        )}

        {flag == 0 && (
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => setAuctionVisible(true)}
          >
            <Text style={{ fontSize: 25, color: "white" }}>입찰</Text>
          </TouchableOpacity>
        )}

        {flag == 1 && (
          <View
            style={styles.buyBtnDone}
          >
            <Text style={{ fontSize: 25 }}>마감</Text>
          </View>
        )}
      </View>

      <ReportModal
        isVisible={reportModalVisible}
        onClose={closeReportModal}
        reporter={user} // 현재 로그인한 사용자
        reportedUser={writer} // 신고 대상
        roomName={itemId} // 문서 ID 또는 방 이름
      />
      <Modal
        animationType="fade"
        transparent={true}
        visible={auctionVisible}
        onRequestClose={() => setAuctionVisible(false)}
      >
        <AuctionModal trigger={() => setAuctionVisible(false)} price={currentBid} handle={handleBid} bestUser={bestUser} user={user} money={money} />
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={listVisible}
        onRequestClose={() => setListVisible(false)}
      >
        <AuctionLog trigger={() => setListVisible(false)} itemId={itemId} />
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={userInfoVisible}
        onRequestClose={() => setUserInfoVisible(false)}
      >
        <View style={{ flex: 1 }}>
          <UserInfoModal
            onClose={() => setUserInfoVisible(false)}
            writer={writer}
            itemsForSale={writerPosts} // 일반 판매글
            auctionItems={auctionUserPosts} // 경매 판매글
            visible={userInfoVisible}
          />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "white",
  },
  header: {
    width: "100%",
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  section: {
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
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
  itemDetail: {
    lineHeight: 22,
    fontSize: 16
  },
  itemType: {
    fontSize: 16,
    color: "darkgray",
    marginBottom: 5
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
  buyBtn: {
    width: "70%",
    marginLeft: "3.3%",
    marginRight: "3.3%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(211,25,69)",
    borderRadius: 10
  },
  buyBtnDone: {
    width: "70%",
    marginLeft: "3.3%",
    marginRight: "3.3%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "lightgray",
    borderRadius: 10
  },
  auctionInfo: {
    fontWeight: "bold",
    fontSize: 20,
    color: "rgb(211,25,69)"
  },
  timePrint: {
    fontSize: 20
  }
})

export default AuctionDetail;