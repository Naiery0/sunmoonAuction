// ChatListScreen.js
import { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Modal, Image } from 'react-native';
import ImageButton from '../components/ImageButton';
import { useNavigation } from '@react-navigation/native';

import Chatroom from './Chatroom';
import { db } from '../firebaseConfig';

const ChatList = ({ route }) => {

  const navigation = useNavigation();
  const [chatRooms, setChatRooms] = useState([]); // 채팅방 목록 상태 관리
  const [partnerNickname, setPartnerNickname] = useState(''); // 파트너 닉네임 상태 관리
  const userNickname = route.params?.user; // 현재 사용자의 닉네임 가져오기
  const [modalVisible, setModalVisible] = useState(false);
  const [roomId, setRoomId] = useState(null);

  const loadChatRooms = () => {
    const unsubscribe = db.collection('chatRooms')
      .where('participants', 'array-contains', userNickname)
      .orderBy('lastMessageTime', 'desc')
      .onSnapshot(async (snapshot) => {
        const rooms = await Promise.all(snapshot.docs.map(async (doc) => {
          const data = doc.data();

          // 마지막 메시지가 없는 채팅방은 제외
          if (!data.lastMessage) {
            return null;
          }

          const participants = data.participants;
          const lastMessageTime = data.lastMessageTime;
          const partnerNickname = participants.find(nickname => nickname !== userNickname);

          // 각 채팅방의 메시지 쿼리 
          const messagesQuery = await db.collection('chatRooms').doc(doc.id)
            .collection('messages').orderBy('createdAt', 'desc').get();

          let lastMessage = 'No messages';
          if (messagesQuery.docs.length > 0) {
            const lastMsgData = messagesQuery.docs[0].data();
            lastMessage = lastMsgData.text || (lastMsgData.image ? `${userNickname}님이 보낸 이미지` : 'No messages');
          }

          // 안 읽은 메시지 수 계산
          const unreadMessagesCount = messagesQuery.docs.filter(doc =>
            doc.data().user._id !== userNickname && !doc.data().isRead).length;

          return {
            id: doc.id,
            partnerNickname: partnerNickname,
            lastMessage: lastMessage,
            lastMessageTime: lastMessageTime,
            unreadMessagesCount: unreadMessagesCount,
            participants: participants,
          };
        }));

        // null 값(마지막 메시지가 없는 채팅방) 제거
        setChatRooms(rooms.filter(room => room !== null));
      });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = loadChatRooms(); // 컴포넌트가 마운트될 때 채팅방 목록을 불러옵니다.
    return () => unsubscribe(); // 컴포넌트가 언마운트될 때 구독 해제
  }, [userNickname]);

  // 특정 채팅방으로 네비게이트하는 함수 ( 모달 처리로 대체 함 )
  const navigateToChatRoom = (id, title, target) => {

    setPartnerNickname(target);
    setRoomId(id);
    setModalVisible(true);
    //navigation.navigate('ChatRoom', { id, title, userNickname });
  };

  const closeModal = () => {
    console.log("Modal closed!");
    setModalVisible(false);
    loadChatRooms();
  }

  const calculateTimeDifference = (timestamp) => {
    if (!timestamp) return '작성 시간 정보 없음';

    const currentTime = new Date();
    const postTime = timestamp.toDate();
    const timeDifference = currentTime - postTime;
    const minutesDifference = Math.floor(timeDifference / (1000 * 60));

    if(minutesDifference == 0){
      return `방금`;
    }
    else if (minutesDifference < 60) {
      return `${minutesDifference}분 전`;
    } else if (minutesDifference < 1440) {
      const hoursDifference = Math.floor(minutesDifference / 60);
      return `${hoursDifference}시간 전`;
    } else if (minutesDifference < 43200) { // 약 30일
      const daysDifference = Math.floor(minutesDifference / 1440);
      return `${daysDifference}일 전`;
    } else if (minutesDifference < 525600) { // 약 1년
      const monthsDifference = Math.floor(minutesDifference / 43200);
      return `${monthsDifference}달 전`;
    } else {
      const yearsDifference = Math.floor(minutesDifference / 525600);
      return `${yearsDifference}년 전`;
    }
  };

  return (
    <View style={styles.container}>

      {/* 상단 부분 */}
      <View style={styles.header}>
        <ImageButton
          imgSource={require("../assets/left.png")}
          imgFunction={() => { navigation.navigate("Home") }}
          imgColor={"white"}
        />

        <View>
          <Text style={styles.headerTitle}>채팅</Text>
        </View>
      </View>

      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigateToChatRoom(item.id, item.partnerNickname, item.partnerNickname)}
          >
            <View style={styles.roomItem}>

              <View style={{ width:"70%", flexDirection:"row", alignItems:"center"}}>
                <View style={{ backgroundColor: "lightgray", borderRadius: 50, width: 35, height: 35, justifyContent: "center", alignItems: "center", marginRight: 15 }}>
                  <Image source={require("../assets/user.png")} style={{ width: 25, height: 25, tintColor: "darkgray" }} />
                </View>

                <View style={{ width: "50%" }}>
                  <Text style={{ fontWeight: "bold", marginBottom: 1 }}>{item.partnerNickname == null ? '대화 종료된 채팅방' : item.partnerNickname}</Text>
                  <Text style={{ color: 'gray' }}>{item.lastMessage}</Text>
                </View>
              </View>

              <View style={{ width: "30%" }}>
                <View style={{flexDirection:"row",justifyContent:"flex-end"}}>
                  {item.unreadMessagesCount > 0 && (
                    <Text style={styles.notice}>{item.unreadMessagesCount}</Text> // 안 읽은 메시지 수 표시
                  )}
                  <Text style={{ color: "darkgray", textAlign: "right" }}>{calculateTimeDifference(item.lastMessageTime)}</Text>
                </View>
              </View>
            </View>

          </TouchableOpacity>
        )}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Chatroom
          roomId={roomId} user={userNickname}
          partner={partnerNickname} trigger={closeModal}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    height: 80,
    backgroundColor: "deepskyblue",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    padding: 10
  },
  headerTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
    paddingTop: 3,
    width: 180,
    marginLeft: 14
  },
  roomItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between"
  },
  notice: {
    backgroundColor: "rgb(211,25,69)",
    borderRadius: 30,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    textAlign:"center",
    color: 'white',
    marginRight: 10
  }
})

export default ChatList;