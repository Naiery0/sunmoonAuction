import { Alert } from 'react-native';
import firebase from 'firebase';
import { db } from '../firebaseConfig';

//사진 고유 키 부여
export const generateUniqueId = () => {
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
};

//이미지 업로드
export const uploadImage = async (uri) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = firebase.storage().ref().child("images/" + generateUniqueId());
  const snapshot = await storageRef.put(blob);
  const downloadURL = await snapshot.ref.getDownloadURL();

  return downloadURL;
};

// chatUtils.js
// 새 채팅방 생성 함수
export const createChatRoom = async (db, user, writer) => {
  if (writer.trim() !== '') {
    const newRoom = await db.collection('chatRooms').add({
      title: user + ' to ' + writer,
      participants: [user, writer],
      lastMessage: '',
      lastMessageTime: '',
    });
    return newRoom.id; // 새로 생성된 채팅방의 ID 반환
  }
  return null; // 채팅방 생성 실패 시 null 반환
};

// 채팅방 생성 또는 참여 함수
export const createOrJoinChatRoom2 = async (db, user, writer, needsNavigate = true) => {
  let roomId = null;

  if (user === writer) {
    alert("글 작성자 본인은 채팅을 사용할 수 없습니다");
    return null;
  }

  const existingRoom = await checkIfChatRoomExists(db, user, writer);

  if (existingRoom) {
    roomId = existingRoom.id;
  } else {
    roomId = await createChatRoom(db, user, writer);
  }

  // needsNavigate가 true일 경우에만 navigateToChatRoom 호출
  if (roomId && needsNavigate) {
    navigateToChatRoom(roomId);
  }

  return roomId;
};

// 채팅방 생성 또는 참여 함수
export const createOrJoinChatRoom = async (db, user, writer, setRoomId, setModalVisible) => {
  let roomId = null;

  if (user === writer) {
    alert("글 작성자 본인은 채팅을 사용할 수 없습니다");
    return;
  }

  // 채팅방이 이미 존재하는지 확인
  const existingRoom = await checkIfChatRoomExists(db, user, writer);

  if (existingRoom) {
    roomId = existingRoom.id; // 이미 존재하는 채팅방 ID 사용
  } else {
    roomId = await createChatRoom(db, user, writer); // 새 채팅방 생성 및 ID 반환
  }

  if (roomId) {
    navigateToChatRoom(roomId, setRoomId, setModalVisible); // 채팅방으로 이동
  } else {
    console.error("채팅방 생성 실패");
  }
};

// 채팅방 존재 유무 체크 함수
export const checkIfChatRoomExists = async (db, user1, user2) => {
  const querySnapshot = await db.collection('chatRooms')
    .where('participants', 'array-contains', user1)
    .get();

  let existingRoom = null;
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.participants.includes(user2)) {
      existingRoom = { id: doc.id, ...data };
    }
  });

  return existingRoom;
};

// 채팅방으로 이동하는 함수
export const navigateToChatRoom = (roomId, setRoomId, setModalVisible) => {
  console.log('채팅방 이동');
  setRoomId(roomId);
  setModalVisible(true);
};

export const calculate24HoursLater = (timestamp) => {
  const twentyFourHoursInMilliseconds = 24 * 60 * 60 * 1000; // 24시간을 밀리초로 변환
  const timestampDate = timestamp.toDate(); // Firestore timestamp를 JavaScript Date로 변환
  const twentyFourHoursLater = new Date(timestampDate.getTime() + twentyFourHoursInMilliseconds);
  return twentyFourHoursLater;
};

export const formatToCurrency = (numberString) => {
  const number = parseInt(numberString, 10);
  return new Intl.NumberFormat('ko-KR', { style: 'decimal', currency: 'KRW' }).format(number);
};

export const handleDelete = (user, writer, itemId, mode) => {
  // 현재 사용자가 글 작성자인지 확인

  console.log("handleDelete");
  if (user === writer) {
    Alert.alert('글 삭제', '이 글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', onPress: () => deletePost(itemId, mode) },
    ]);
  } else {
    Alert.alert('오류', '글을 삭제할 권한이 없습니다.');
  }
};


const deletePost = async (itemId, mode) => {
  try {
    // 게시글 문서 참조
    const postRef = db.collection(mode === "market" ? 'posts' : 'AuctionItems').doc(itemId);

    // 게시글의 likeList 가져오기
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      console.log('No such document!');
      return;
    }
    const likeList = postDoc.data().likeList || [];
    console.log("라리"+likeList);

    // 각 사용자의 LikeList에서 게시글 ID 제거
    for (const userId of likeList) {
      const userRef = db.collection('Users').doc(userId);
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          console.log(`No document for user ID ${userId}`);
          return;
        }
        let userLikeList = userDoc.data().LikeList || [];
        userLikeList = userLikeList.filter(id => id !== itemId);
        transaction.update(userRef, { LikeList: userLikeList });
      });
    }

    // 게시글 삭제
    await postRef.delete();
    console.log('Post successfully deleted');
  } catch (error) {
    console.error('Error removing document: ', error);
  }
};

// 'Users' 컬렉션에서 'UserName'을 기반으로 사용자 ID 찾기
export const findUserIdByUserName = async (userName) => {
  const usersSnapshot = await db.collection('Users').where('UserName', '==', userName).get();
  if (!usersSnapshot.empty) {
    return usersSnapshot.docs[0].id; // 첫 번째 문서의 ID 반환
  } else {
    throw new Error('User not found');
  }
};

//찜 기능
export const toggleLike = async (userName, postId, collectionName, callback) => {
  try {
    // 'UserName'을 기반으로 사용자 ID 찾기
    const userId = await findUserIdByUserName(userName);
    const userRef = db.collection('Users').doc(userId);
    const postRef = db.collection(collectionName).doc(postId);

    // Firestore 트랜잭션 시작 
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const postDoc = await transaction.get(postRef);

      if (!userDoc.exists) throw new Error('User document does not exist');
      if (!postDoc.exists) throw new Error('Post document does not exist');

      let newLikeList = userDoc.data().LikeList || [];
      let newPostLikeList = postDoc.data().likeList || [];
      let newLikeCount = postDoc.data().likeCount || 0;

      // 찜 목록에 이미 게시글 ID가 있으면 제거, 없으면 추가
      if (newLikeList.includes(postId)) {
        newLikeList = newLikeList.filter(id => id !== postId);
        newPostLikeList = newPostLikeList.filter(id => id !== userId); // 게시글의 likeList에서 userId 제거
        newLikeCount = Math.max(newLikeCount - 1, 0);
      } else {
        newLikeList = [...newLikeList, postId];
        newPostLikeList = [...newPostLikeList, userId]; // 게시글의 likeList에 userId 추가
        newLikeCount += 1;
      }

      transaction.update(userRef, { LikeList: newLikeList });
      transaction.update(postRef, { likeCount: newLikeCount, likeList: newPostLikeList });
    });

    console.log("Transaction successfully committed!");
    if (callback) callback();
  } catch (e) {
    console.error("Transaction failed: ", e.message);
  }
};

export const fetchUserLikeList = async (user, setUserLikeList) => {
  try {
    const usersRef = db.collection('Users').where('UserName', '==', user);
    const querySnapshot = await usersRef.get();
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      setUserLikeList(userDoc.data().LikeList || []);
    }
  } catch (error) {
    console.error("Error fetching user like list: ", error);
  }
};

export const isLiked = (itemId, userLikeList) => {
  return userLikeList?.includes(itemId);
};

export const handleToggleLike = (user, itemId, collectionName, userLikeList, setUserLikeList) => {
  toggleLike(user, itemId, collectionName, () => {
    setUserLikeList((prevList) => {
      if (prevList.includes(itemId)) {
        return prevList.filter(id => id !== itemId);
      } else {
        return [...prevList, itemId];
      }
    });
  });
};