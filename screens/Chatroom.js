import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, TouchableOpacity, Alert } from 'react-native';
import { GiftedChat, Actions, Bubble, Time, InputToolbar, MessageText } from 'react-native-gifted-chat';
import * as ImagePicker from 'expo-image-picker';
import ImageButton from '../components/ImageButton';
import CustomReadIndicator from '../components/CustomReadIndicator';
import ReportModal from '../components/ReportModal';
import TransferMoneyModal from '../components/TransferMoneyModal';
import { db } from '../firebaseConfig';
import firebase from 'firebase';
import { uploadImage, generateUniqueId, findUserIdByUserName } from '../components/Utils'; // utils.js에서 필요한 함수 import

const Chatroom = (props) => {
  const id = props.roomId;
  const [messages, setMessages] = useState([]); // 메시지 상태 관리
  const userNickname = props.user ? props.user : null; // 로그인한 사용자의 닉네임 
  const partner = props.partner ? props.partner : "NULL";
  const trigger = props.trigger;
  const screenWidth = Dimensions.get('window').width;
  const messageMargin = screenWidth * 0.17; // 화면 너비의 10%를 마진으로 사용

  // Modal의 표시 상태 관리
  const [modalVisible, setModalVisible] = useState(false);

  const [isPartnerInRoom, setIsPartnerInRoom] = useState(true); // 상대방이 채팅방에 있는지 여부

  // 송금 모달의 상태 관리
  const [isTransferModalVisible, setTransferModalVisible] = useState(false);

  // 송금 모달을 여는 함수
  const openTransferModal = () => {
    setModalVisible(false);
    setTransferModalVisible(true);
  };

  // 송금 모달을 닫는 함수
  const closeTransferModal = () => {
    setTransferModalVisible(false);
  };

  const handleTransfer = async (amount) => {
    // 사용자에게 송금을 확인하는 대화 상자 표시
    Alert.alert(
      "송금 확인",
      `정말로 ${amount}원을 송금하시겠습니까?`,
      [
        {
          text: "취소",
          onPress: () => console.log("송금 취소"),
          style: "cancel"
        },
        { text: "송금", onPress: () => transferMoney(amount) }
      ],
      { cancelable: false }
    );
  };
  // 실제 송금을 처리하는 함수 (여기서는 예시로만 제공)
  const transferMoney = async (amount) => {
    console.log("실행");
    const userId = await findUserIdByUserName(userNickname);
    console.log("1: " + userId);
    const partnerId = await findUserIdByUserName(partner);
    console.log("2: " + partnerId);
    const userRef = db.collection('Users').doc(userId); // 송금하는 사용자 
    const partnerRef = db.collection('Users').doc(partnerId); // 수신자

    try {
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        throw "User does not exist!";
      }

      const currentUserBalance = userDoc.data().money;
      if (amount > currentUserBalance) {
        throw "잔액이 부족합니다!"; // 잔액 부족 경고
      }

      await db.runTransaction(async (transaction) => {
        const partnerDoc = await transaction.get(partnerRef);

        if (!partnerDoc.exists) {
          throw "Partner does not exist!";
        }

        const newUserBalance = currentUserBalance - amount;
        const newPartnerBalance = partnerDoc.data().money + amount;

        transaction.update(userRef, { money: newUserBalance });
        transaction.update(partnerRef, { money: newPartnerBalance });
      });

      alert("송금 완료!");
      // 송금 완료 메시지 생성
      const transferMessage = {
        _id: generateUniqueId(),
        text: '송금 완료',
        message: `${userNickname}님이 ${partner}님에게 ${amount}원을 송금했습니다.`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isRead: false,
        user: {
          _id: userNickname,
        },
        type: 'transfer', // 송금 메시지 타입
      };

      // DB에 송금 메시지 저장
      await db.collection('chatRooms').doc(id).collection('messages').add(transferMessage);

      // 로컬 상태에 송금 메시지 추가 (선택적)
      setMessages(previousMessages => GiftedChat.append(previousMessages, transferMessage));

      alert("송금 완료!");
    } catch (error) {
      console.error("Transfer failed: ", error);
      alert(error);
    }
  };
  const renderCustomView = (props) => {
    const { currentMessage } = props;
    if (currentMessage.type === 'transfer') {
      return (
        <View style={styles.transferMessageContainer}>
          <Text style={styles.transferMessageText}>{currentMessage.message}</Text>
        </View>
      );
    }

    return null;
  };

  useEffect(() => {
    // 채팅방 참가자 상태를 확인하는 함수
    const checkParticipants = async () => {
      const chatRoomRef = db.collection('chatRooms').doc(id);
      const chatRoomDoc = await chatRoomRef.get();

      if (chatRoomDoc.exists) {
        const { participants } = chatRoomDoc.data();
        setIsPartnerInRoom(participants.includes(partner));
      }
    };

    checkParticipants();
  }, [id, partner]);

  const renderTimeAndTicks = (props) => {
    const { currentMessage } = props;
    if (!currentMessage.createdAt) {
      return null;
    }

    const time = currentMessage.createdAt;
    let formattedTime = '';

    if (time instanceof Date) {
      formattedTime = time.toLocaleTimeString([], { timeStyle: 'short' });
    } else if (typeof time === 'string') {
      // 문자열인 경우 적절한 포맷으로 변경
      formattedTime = time;
    }

    // 가장 최근의 '읽음' 메시지 찾기
    const lastReadMessage = messages.find((msg) => msg.isRead && msg.user._id === userNickname);

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {lastReadMessage && lastReadMessage._id === currentMessage._id && <CustomReadIndicator />}
        <Time {...props} time={formattedTime} />
      </View>
    );
  };
  const leaveChat = async () => {
    try {
      // 채팅방 문서 참조 가져오기
      const chatRoomRef = db.collection('chatRooms').doc(id);

      // 채팅방 문서에서 현재 참가자 목록을 읽어옵니다.
      const chatRoomDoc = await chatRoomRef.get();
      if (!chatRoomDoc.exists) {
        console.log('채팅방이 존재하지 않습니다.');
        return;
      }
      const { participants } = chatRoomDoc.data();

      // 참가자 목록에서 현재 사용자를 제거합니다.
      const updatedParticipants = participants.filter(participant => participant !== userNickname);

      // 참가자 목록을 업데이트합니다.
      await chatRoomRef.update({ participants: updatedParticipants });
      console.log('채팅방을 나갔습니다.');

      // 채팅방 나간 후 모달 닫기
      props.trigger();
    } catch (error) {
      console.error('채팅방 나가기 오류:', error);
    }
  };

  //신고모달
  const [reportModalVisible, setReportModalVisible] = useState(false);
  // 신고하기 모달을 표시하는 함수,, 이 함수랑 리턴에 있는 신고모달 복붙해서 게시판에서도 가능해
  const showReportModal = () => {
    setModalVisible(false); // 기존 모달 닫기
    setReportModalVisible(true); // 신고 모달 열기
  };

  // 채팅방 메시지 불러오기
  useEffect(() => {
    const markMessagesAsRead = async () => {
      const querySnapshot = await db.collection('chatRooms').doc(id).collection('messages')
        .where('isRead', '==', false)
        .get();

      const batch = db.batch();

      querySnapshot.forEach(doc => {
        const data = doc.data();
        // 현재 사용자가 보낸 메시지가 아닌 경우에만 isRead를 true로 설정
        if (data.user._id !== userNickname) {
          batch.update(doc.ref, { isRead: true });
        }
      });

      await batch.commit();
    };

    // 채팅방에 들어갔을 때 실행
    markMessagesAsRead();

    const unsubscribe = db.collection('chatRooms').doc(id).collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          const data = change.doc.data();
          // 메시지 추가 시, 현재 사용자가 보낸 메시지가 아닌 경우에만 isRead를 true로 설정
          if (change.type === "added" && data.user._id !== userNickname) {
            db.collection('chatRooms').doc(id).collection('messages')
              .doc(change.doc.id)
              .update({ isRead: true });
          }
        });

        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            _id: doc.id,
            text: data.text,
            message: data.message,
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            user: data.user,
            isRead: data.isRead,
            type: data.type,
            ...(data.image && { image: data.image }),
          };
        });
        setMessages(messages);
      });
    return () => unsubscribe();
  }, [id, userNickname]);

  const onSend = async (newMessages = []) => {
    const messageToAdd = {
      text: newMessages[0].text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      user: {
        _id: userNickname,
      },
      isRead: false, // 초기값은 false
      type: null,
    };

    // 'message' 필드가 있는 경우에만 추가합니다.
    if (newMessages[0].message) {
      messageToAdd.message = newMessages[0].message;
    }

    await db.collection('chatRooms').doc(id).collection('messages').add(messageToAdd);

    // 채팅방의 lastMessage 필드 업데이트
    await db.collection('chatRooms').doc(id).update({
      lastMessage: newMessages[0].text,
      lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
    });
  };

  // 사진 선택 함수
  const selectPhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      const imageUrl = await uploadImage(result.uri);
      onSendImageMessage(imageUrl);
    }
  };

  const onSendImageMessage = async (imageUrl) => {
    const message = {
      _id: generateUniqueId(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      user: {
        _id: userNickname,
      },
      image: imageUrl, // 이미지 URL
      isRead: false // 초기값은 false
    };

    await db.collection('chatRooms').doc(id).collection('messages').add(message);

    // 채팅방의 lastMessage 필드 업데이트 (이미지 메시지의 경우)
    await db.collection('chatRooms').doc(id).update({
      lastMessage: `${userNickname}님이 보낸 이미지`, // 이미지 메시지 처리
    });
  };
  // 사진 촬영 함수
  const takePhoto = async () => {
    // 카메라 권한 요청
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    // 카메라 실행
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      const imageUrl = await uploadImage(result.uri);
      onSendImageMessage(imageUrl);
    }
  };

  // 추가 작업 아이콘 렌더링 함수
  const renderActions = (props) => {
    return (
      <Actions
        {...props}
        options={{
          '앨범 사진 선택': selectPhoto,
          '카메라 촬영': takePhoto,
          Cancel: () => { },
        }}
        icon={() => (
          <View style={{ /* 스타일링 */ }}>
            <Text>+</Text>
          </View>
        )}
      />
    );
  };
  // 메시지 텍스트 컴포넌트의 스타일을 커스터마이즈하는 함수
  const renderMessageText = (messageTextProps) => {
    return (
      <MessageText
        {...messageTextProps}
        textStyle={{
          right: {
            textAlign: 'right', // 우측 정렬
            color: 'white', // 사용자 메시지 텍스트 색상
          },
          left: {
            textAlign: 'left', // 상대방 메시지는 좌측 정렬
            color: 'black', // 상대방 메시지 텍스트 색상
          }
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <TransferMoneyModal
        isVisible={isTransferModalVisible}
        onClose={closeTransferModal}
        onTransfer={handleTransfer}
      />
      <ReportModal
        isVisible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        reporter={userNickname}
        reportedUser={partner}
        roomName={id}
      />
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {/* 모달 내부에 옵션 버튼 렌더링 */}
            <TouchableOpacity
              style={styles.button}
              onPress={openTransferModal}
            >
              <Text style={{ color: 'green' }}>송금하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={showReportModal}
            >
              <Text style={{ color: 'red', }}>신고하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={leaveChat}
            >
              <Text>채팅방 나가기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={{ color: '#00ccff', }}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.header}>
        <ImageButton
          imgSource={require("../assets/left.png")}
          imgFunction={trigger}
          imgColor={"black"}
        />

        <Text style={{ paddingLeft: 10, height: "50%", width: "80%", fontSize: 18, fontWeight: "bold", marginTop: 10, color: "black" }}>{partner}</Text>

        <ImageButton
          imgSource={require("../assets/vertidot.png")}
          imgFunction={() => setModalVisible(true)}
          imgColor={"black"}
        />
      </View>

      <View style={styles.section}>
        <GiftedChat
          messages={messages}
          onSend={(newMessages) => onSend(newMessages)}
          user={{ _id: userNickname }}
          renderCustomView={renderCustomView}
          renderMessageText={renderMessageText}
          renderActions={renderActions}
          renderInputToolbar={(props) => {
            // 상대방이 채팅방에 없는 경우, 커스텀 메시지를 표시
            if (!isPartnerInRoom) {
              return (
                <View style={styles.customMessage}>
                  <Text style={{ color: 'gray', }}>상대방이 채팅을 종료했습니다.</Text>
                </View>
              );
            }
            // 상대방이 채팅방에 있는 경우, 기본 입력 툴바를 렌더링
            return <InputToolbar {...props} />;
          }}

          renderBubble={(props) => {
            return (
              <Bubble
                {...props}
                wrapperStyle={{
                  left: {
                  },
                  right: {
                    backgroundColor: 'rgb(0,106,121)', // 오른쪽(나의 메시지) 말풍선 배경색
                  },
                }}
              />
            );
          }}
          renderTime={renderTimeAndTicks}


        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    borderBottomWidth: 1,
    borderColor: "lightgray",
    height: "8%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "white"
  },
  section: {
    height: "92%",
    backgroundColor: "white"
  },
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  button: {
    marginBottom: 10,
    padding: 10,
  },
  customMessage: {
    alignItems: 'center',
  },
  transferMessageContainer: {
    padding: 10,
    backgroundColor: '#e1f5fe', // 예시 색상
    borderRadius: 10,
    margin: 5,
    alignSelf: 'center',
  },
  transferMessageText: {
    fontWeight: 'bold',
    color: '#0277bd', // 예시 색상
  },
});

export default Chatroom;