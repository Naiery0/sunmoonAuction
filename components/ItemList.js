import { Text, View, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import ImageButton from './ImageButton';
import MarketDetail from '../screens/MarketDetail';
import AuctionDetail from '../screens/AuctionDetail';
import firebase from 'firebase';
import { db } from '../firebaseConfig';
import { fetchUserLikeList, isLiked, handleToggleLike, createOrJoinChatRoom2, generateUniqueId, findUserIdByUserName } from './Utils';

const ItemList = (props) => {

  const navigation = useNavigation();

  const itemId = props.itemId;//게시글 아이디
  const itemName = props.itemName;
  const itemPrice = props.itemPrice;
  //const itemDetail = props.itemDetail;
  const imageUrl = props.imageUrl ? props.imageUrl : "noImage";
  const itemDate = props.itemDate; // Firestore Timestamp로 받아온 createdAt
  const itemDetail = props.itemDetail;
  const endDate = props.endDate;
  const writer = props.writer; //게시자
  const bestUser = props.bestUser;
  const user = props.user; //보는사람
  const mode = props.mode;
  const likeCount = props.likeCount;
  const dealMode = props.dealMode;
  const reserve = props.reserve;
  const done = props.done;
  const likeList = props.likeList;

  const [marketVisible, setMarketVisible] = useState(false);
  const [auctionVisible, setAuctionVisible] = useState(false);
  const [userLikeList, setUserLikeList] = useState([]);

  //렌더링 시 LikeList랑 itemid 대조
  useEffect(() => {
    console.log("User : " + props.user + ", Print Done : " + done);
    fetchUserLikeList(props.user, setUserLikeList);
  }, [props.user]);

  isLiked(itemId, userLikeList);
  const handleLikeToggle = () => {
    handleToggleLike(user, itemId, mode === "market" ? "posts" : "AuctionItems", userLikeList, setUserLikeList);
  };
  const prevDoneRef = useRef();
  useEffect(() => {
    prevDoneRef.current = done;
  }, []);

  useEffect(() => {
    // 게시글의 만료 여부를 체크하고 `done` 상태를 업데이트하는 함수
    const checkAndUpdateExpiredPost = async () => {
      const now = firebase.firestore.Timestamp.fromDate(new Date());

      if (endDate < now && !done) {
        await db.collection(mode === "market" ? "posts" : "AuctionItems").doc(itemId).update({
          done: true
        });
        console.log("Post marked as done");
      }
    };

    checkAndUpdateExpiredPost();
  }, [itemId, endDate, done, mode]);

  useEffect(() => {
    if (!prevDoneRef.current && done && bestUser) {
      console.log("송금 로직 시작");
      processAuctionCompletion();
    }

    // 현재 `done` 상태를 이전 `done` 상태로 저장
    prevDoneRef.current = done;
  }, [done, bestUser, itemPrice, writer, itemId]);


  // ItemList에서는 needsNavigate를 false로 설정하여 호출
  const processAuctionCompletion = async () => {
    console.log("송금시작");
    const roomId = await createOrJoinChatRoom2(db, bestUser, writer, false);

    if (!roomId) {
      console.error("채팅방 생성 또는 참여 실패");
      return;
    }
    const transferAmount = itemPrice;
    const success = await transferFunds(bestUser, writer, transferAmount);
    if (success) {
      console.log("송금 완료, 메시지 전송 시작");
      await sendChatMessage(roomId, bestUser, writer, `${bestUser}님이 ${writer}님에게 ${formatToCurrency(itemPrice)}원을 송금했습니다.`);
    }
  };


  const transferFunds = async (fromUser, toUser, amount) => {
    try {
      console.log("송금진짜시작");
      const fromUserId = await findUserIdByUserName(fromUser);
      const toUserId = await findUserIdByUserName(toUser);

      const fromUserRef = db.collection('Users').doc(fromUserId);
      const toUserRef = db.collection('Users').doc(toUserId);

      await db.runTransaction(async (transaction) => {
        const fromUserDoc = await transaction.get(fromUserRef);
        const toUserDoc = await transaction.get(toUserRef);

        if (!fromUserDoc.exists || !toUserDoc.exists) {
          throw new Error("User documents do not exist");
        }

        const fromUserBalance = fromUserDoc.data().money;
        const toUserBalance = toUserDoc.data().money;

        if (amount > fromUserBalance) {
          throw new Error("Insufficient funds");
        }

        const newFromUserBalance = fromUserBalance - amount;
        const newToUserBalance = toUserBalance + amount;

        transaction.update(fromUserRef, { money: newFromUserBalance });
        transaction.update(toUserRef, { money: newToUserBalance });
      });

      console.log("Transfer successful");
      return true;
    } catch (error) {
      console.error("Transfer failed: ", error);
      return false;
    }
  };

  const sendChatMessage = async (roomId, fromUser, toUser, message) => {
    try {
      const newMessageId = generateUniqueId();
      await db.collection('chatRooms').doc(roomId).collection('messages').add({
        _id: newMessageId,
        text: itemName+' 낙찰가 송금 완료',
        message: message,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        user: {
          _id: fromUser,
          // 기타 필요한 사용자 정보 (예: 이름, 프로필 이미지 등)
        },
        type: 'transfer',
      });
      console.log("던 송금");
    } catch (error) {
      console.error('채팅 메시지 전송 중 오류 발생: ', error);
    }
    await db.collection('chatRooms').doc(roomId).update({
      lastMessage: message,
      lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
    });
  };


  const closeMarket = () => {
    setMarketVisible(false);
    fetchUserLikeList(props.user, setUserLikeList);
  }
  const closeAuction = () => {
    setAuctionVisible(false);
    fetchUserLikeList(props.user, setUserLikeList);
  }

  return (
    <View
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          if (mode == "market") {
            setMarketVisible(true);
          }
          else if (mode == "auction") {
            setAuctionVisible(true);
          }

        }}
      >
        {/* 거래가 완료된 상품인 경우 위에 덮음 */}
        {done && (mode === "market" ? (
          <View style={styles.done}>
            <Text style={styles.doneText}>거래 완료</Text>
          </View>
        ) : (
          <View style={styles.done}>
            <Text style={styles.doneText}>경매 종료</Text>
          </View>
        ))}

        {/* 물품 이미지 */}{/*이미지가 url이 있을때만 표시하기 */}
        <View style={styles.imgBox}>
          {imageUrl && (
            <Image source={{ uri: imageUrl[0] }} style={{ width: 100, height: 100, borderRadius: 15 }} />
          )}
        </View>

        {/* 물품 정보 */}
        <View style={styles.itemInfo}>
          <Text
            style={styles.itemName}
            numberOfLines={1} ellipsizeMode="tail"
          >
            {itemName}
          </Text>
          <Text style={styles.itemDetail}>{writer} · {calculateTimeDifference(itemDate)}</Text>
          <Text
            style={styles.itemPrice}
          >
            {formatToCurrency(itemPrice)} 원
          </Text>
        </View>

        {/* 찜 버튼 */}
        <View style={styles.heart}>
          <ImageButton
            imgSource={require("../assets/fullheart.png")}
            imgFunction={handleLikeToggle}
            imgColor={isLiked(itemId, userLikeList) ? "rgb(211,25,69)" : "lightgray"}
          />
          <Text>{likeCount}</Text>
        </View>
      </TouchableOpacity>

      {/* 마켓 아이템 자세히보기 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={marketVisible}
        onRequestClose={() => setMarketVisible(false)}
      >
        <View style={{ width: "100%", height: "100%" }}>
          <MarketDetail
            trigger={closeMarket}
            itemName={itemName}
            itemPrice={itemPrice}
            imageUrl={imageUrl}
            itemDate={calculateTimeDifference(itemDate)}
            itemDetail={itemDetail}
            writer={writer}
            user={user}
            itemId={itemId}
            dealMode={dealMode}
            reserve={reserve}
            done={done}
            likeList={likeList}
          />
        </View>
      </Modal>

      {/* 옥션 아이템 자세히보기 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={auctionVisible}
        onRequestClose={() => setAuctionVisible(false)}
      >
        <View style={{ width: "100%", height: "100%" }}>
          <AuctionDetail
            trigger={closeAuction}
            itemId={itemId}
            itemName={itemName}
            itemPrice={itemPrice}
            imageUrl={imageUrl}
            itemDate={calculateTimeDifference(itemDate)}
            itemTimeStamp={itemDate}
            itemDetail={itemDetail}
            endDate={endDate}
            bestUser={bestUser}
            writer={writer}
            user={user}
            dealMode={dealMode}
            likeList={likeList}
          />
        </View>
      </Modal>
    </View>
  )
}

const calculateTimeDifference = (timestamp) => {

  if (!timestamp) return '작성 시간 정보 없음';

  const currentTime = new Date();
  const postTime = timestamp.toDate();
  const timeDifference = currentTime - postTime;
  const minutesDifference = Math.floor(timeDifference / (1000 * 60));

  if (minutesDifference < 5) {
    return '방금 전';
  } else if (minutesDifference < 60) {
    return `${minutesDifference}분 전`;
  } else if (minutesDifference < 1440) {
    const hoursDifference = Math.floor(minutesDifference / 60);
    return `${hoursDifference}시간 전`;
  } else {
    const daysDifference = Math.floor(minutesDifference / 1440);
    return `${daysDifference}일 전`;
  }
};

const formatToCurrency = (numberString) => {
  const number = parseInt(numberString, 10);
  return new Intl.NumberFormat('ko-KR', { style: 'decimal', currency: 'KRW' }).format(number);
};

const styles = StyleSheet.create({
  container: {
    marginTop: 5
  },
  itemContainer: {
    height: 150,
    backgroundColor: "white",
    flexDirection: "row"
  },
  imgBox: {
    backgroundColor: "lightgray",
    width: 100,
    height: 100,
    marginTop: 25,
    marginLeft: 15,
    marginRight: 10,
    borderRadius: 15
  },
  itemInfo: {
    width: "50%",
    height: 120,
    marginTop: 15,
    paddingLeft: 10,
    justifyContent: "center",
    alignItems: "flex-start",
    backgroundColor: "white"
  },
  itemName: {
    fontSize: 20,
    width: "100%",
    paddingLeft: 0,
    backgroundColor: "white",
    justifyContent: "flex-start"
  },
  itemDetail: {
    fontSize: 13,
    width: "100%",
    color: "darkgray",
    paddingLeft: 2,
    backgroundColor: "white",
    justifyContent: "flex-start"
  },
  itemPrice: {
    width: "100%",
    fontSize: 23,
    fontWeight: "bold",
    paddingLeft: 2,
    flexWrap: "nowrap",
    backgroundColor: "white"
  },
  heart: {
    flexDirection: "row",
    width: 50,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 20,
    bottom: 15
  },
  done: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "gray",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.5,
    zIndex: 5
  },
  doneText: {
    fontSize: 30,
    color: "white",
  }
})
export default ItemList;