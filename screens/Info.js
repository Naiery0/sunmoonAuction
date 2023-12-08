import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Image } from 'react-native';
import { db } from '../firebaseConfig';
import ImageButton from '../components/ImageButton';
import MyPostModal from '../components/MyPostModal';
import { useNavigation } from '@react-navigation/native';
import { formatToCurrency } from '../components/Utils';
import Slider from '@react-native-community/slider'; // 슬라이더 라이브러리 추가

const Info = ({ route }) => {

  const navigation = useNavigation();

  const { userId, user } = route.params;
  const [myAuctionPosts, setMyAuctionPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [myFavourites, setMyFavourites] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [userMoney, setUserMoney] = useState(0);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (myAuctionPosts.length === 0 && myPosts.length === 0 && myFavourites.length === 0) {
        // 사용자가 작성한 경매글 가져오기
        console.log("Info Screen");
        const auctionQuery = db.collection('AuctionItems').where('writer', '==', user);
        //console.log("user:" + user)

        const auctionSnapshot = await auctionQuery.get();
        setMyAuctionPosts(auctionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        //console.log("옥션:", myAuctionPosts);

        // 사용자가 작성한 일반 판매글 가져오기
        const postsQuery = db.collection('posts').where('writer', '==', user);

        const postsSnapshot = await postsQuery.get();
        setMyPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        //console.log("myPosts:", myPosts);

        // 사용자가 '찜'한 아이템 가져오기
        try {
          const userDoc = await db.collection('Users').doc(userId).get();

          //console.log("check userId : " + user + "," + userId);
          //console.log("check : " + userDoc.data());

          // imageUrl={Array.isArray(item.images) && item.images.length > 0 ? item.images : ["noImage"]}
          const userLikelist = userDoc.data()?.LikeList || [];

          //console.log("check : " + userLikelist);

          // 'LikeList'에 있는 각 postId에 대한 데이터를 가져옵니다.
          const postsLikelistPromises = userLikelist.map(postId =>
            db.collection('posts').doc(postId).get()
          );

          const auctionLikelistPromises = userLikelist.map(postId =>
            db.collection('AuctionItems').doc(postId).get()
          );

          const [postsLikelistDocs, auctionLikelistDocs] = await Promise.all([
            Promise.all(postsLikelistPromises),
            Promise.all(auctionLikelistPromises),
          ]);

          const likelistData = [
            ...postsLikelistDocs.filter(doc => doc.exists).map(doc => ({ id: doc.id, ...doc.data(), source: 'posts' })),
            ...auctionLikelistDocs.filter(doc => doc.exists).map(doc => ({ id: doc.id, ...doc.data(), source: 'auction' })),
          ];

          setMyFavourites(likelistData);
          //console.log("찜:", myFavourites);

        } catch (error) {
          console.error('잘못됨:', error);
        }

        // 추가: 사용자의 Money를 가져오기
        const userDoc = await db.collection('Users').doc(userId).get();
        const userData = userDoc.data();
        if (userData && userData.money !== undefined) {
          setUserMoney(userData.money);
        }
      }
    };

    fetchData();
  }, [user, userId]);

  useEffect(() => {
    const unsubscribe = db.collection('Users').doc(userId)
      .onSnapshot(doc => {
        const userData = doc.data();
        if (userData && userData.money !== undefined) {
          setUserMoney(userData.money);
        }
      });

    // 컴포넌트가 언마운트될 때 리스너를 정리합니다.
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const unsubscribePosts = db.collection('posts')
      .where('writer', '==', user)
      .onSnapshot(snapshot => {
        const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyPosts(postsData);
      });

    const unsubscribeAuctionItems = db.collection('AuctionItems')
      .where('writer', '==', user)
      .onSnapshot(snapshot => {
        const auctionItemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyAuctionPosts(auctionItemsData);
      });

    // 컴포넌트가 언마운트될 때 리스너를 정리합니다.
    return () => {
      unsubscribePosts();
      unsubscribeAuctionItems();
    };
  }, [user]);

  useEffect(() => {
    const unsubscribe = db.collection('Users').doc(userId)
      .onSnapshot(async doc => {
        const userData = doc.data();
        if (userData && userData.LikeList) {
          const userLikelist = userData.LikeList;

          // 'LikeList'에 있는 각 postId에 대한 데이터를 가져옵니다.
          const postsLikelistPromises = userLikelist.map(postId =>
            db.collection('posts').doc(postId).get()
          );

          const auctionLikelistPromises = userLikelist.map(postId =>
            db.collection('AuctionItems').doc(postId).get()
          );

          const [postsLikelistDocs, auctionLikelistDocs] = await Promise.all([
            Promise.all(postsLikelistPromises),
            Promise.all(auctionLikelistPromises),
          ]);

          const likelistData = [
            ...postsLikelistDocs.map(doc => ({ id: doc.id, ...doc.data(), source: 'posts' })),
            ...auctionLikelistDocs.map(doc => ({ id: doc.id, ...doc.data(), source: 'auction' })),
          ];

          setMyFavourites(likelistData);
        }
      });

    // 컴포넌트가 언마운트될 때 리스너를 정리합니다.
    return () => unsubscribe();
  }, []);

  const handleItemListPress = (items) => {
    setSelectedItems(items);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedItems([]);
    setModalVisible(false);
  };


  // 추가: 충전 버튼을 눌렀을 때 호출되는 함수
  const openRechargeModal = () => {
    setRechargeModalVisible(true);
  };

  // 추가: 충전 모달에서 충전 버튼을 눌렀을 때 호출되는 함수
  const handleRecharge = async () => {
    try {
      // 금액 유효성 검사
      const parsedAmount = parseFloat(rechargeAmount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        // 파이어베이스 업데이트
        await db.collection("Users").doc(userId).update({
          money: userMoney + parsedAmount,
        });

        // 금액 업데이트 후 모달 닫기
        setRechargeModalVisible(false);

        // 금액 업데이트 후 사용자의 Money를 다시 가져옵니다.
        const userDoc = await db.collection("Users").doc(userId).get();
        const userData = userDoc.data();
        if (userData && userData.money !== undefined) {
          setUserMoney(userData.money);
        }
      } else {
        alert("유효한 금액을 입력하세요.");
      }
    } catch (error) {
      console.error("충전 중 오류 발생:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ImageButton
          imgSource={require("../assets/left.png")}
          imgFunction={() => { navigation.navigate("Home") }}
          imgColor={"white"}
        />

        <View>
          <Text style={styles.headerTitle}>내 정보</Text>
        </View>
      </View>

      <ScrollView style={styles.section}>

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
          <View style={{ backgroundColor: "lightgray", borderRadius: 50, width: 35, height: 35, justifyContent: "center", alignItems: "center", marginRight: 15 }}>
            <Image source={require("../assets/user.png")} style={{ width: 25, height: 25, tintColor: "darkgray" }} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{user}</Text>
        </View>

        {/* 추가: Money와 충전 버튼 */}
        <View style={styles.infoComponent}>

          <Text style={styles.componentText}>옥션 머니 </Text>

          <View style={{ flexDirection: "row" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{formatToCurrency(userMoney) + "원"}</Text>
            <TouchableOpacity onPress={openRechargeModal}>
              <Text style={styles.rechargeButton}>충전</Text>
            </TouchableOpacity>
          </View>

        </View>

        <TouchableOpacity
          style={styles.infoComponent}
          onPress={() => handleItemListPress(myAuctionPosts)}
        >
          <Text style={styles.sectionTitle}>내 경매 판매글</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoComponent}
          onPress={() => handleItemListPress(myPosts.map(item => ({
            id: item.id,
            title: item.title,
            createdAt: item.createdAt,
            price: item.price,
            description: item.description,
            images: item.images && item.images.length > 0 ? item.images : ["noImage"],
            endDate: item.endDate,
            writer: item.writer,
            bestUser: item.bestUser,
            user: user,
            source: 'posts',
            likeCount: item.likeCount,
            dealMode: item.dealMode,
            reserve: item.reserve,
            done: item.done,
          })))}
        >
          <Text style={styles.sectionTitle}>내 일반 판매글</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoComponent}
          onPress={() => handleItemListPress(myFavourites.map(item => ({
            id: item.id,
            title: item.title,
            createdAt: item.createdAt,
            price: item.price,
            description: item.description,
            images: item.images && item.images.length > 0 ? item.images : ["noImage"],
            endDate: item.endDate,
            writer: item.writer,
            bestUser: item.bestUser,
            user: user,
            source: 'posts',
            likeCount: item.likeCount,
            dealMode: item.dealMode,
            reserve: item.reserve,
            done: item.done,
          })))}
        >
          <Text style={styles.sectionTitle}>찜한 물품</Text>
        </TouchableOpacity>

        {/* 모달 */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <MyPostModal trigger={closeModal} items={selectedItems} user={user} />
        </Modal>

        {/* 추가: 충전 모달 */}
        <Modal
          animationType="fade"
          transparent={false}
          visible={rechargeModalVisible}
          onRequestClose={() => setRechargeModalVisible(false)}
        >
          <View style={styles.rechargeContainer}>
            <TouchableOpacity
              style={{ width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)" }}
              onPress={() => setRechargeModalVisible(false)}
            >
            </TouchableOpacity>

            <View style={styles.rechargeBox}>
              <Text style={styles.rechargeTitle}>옥션 금액 충전</Text>
              <TextInput
                style={styles.rechargeInput}
                placeholder="금액을 입력하세요"
                placeholderTextColor="darkgray"
                keyboardType="numeric"
                onChangeText={(text) => {
                  const numericValue = parseFloat(text.replace(/[^0-9]/g, ''));
                  setRechargeAmount(numericValue);
                }}
              />

              <View style={{ width: "80%", justifyContent: "center", alignItems: "center", marginVertical: 10 }}>
                <Text style={{ fontSize: 20 }}>충전 예상 금액</Text>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "rgb(0,106,121)" }}>{formatToCurrency(rechargeAmount) + "원"}</Text>
              </View>
              <View style={{ width: "90%", height: 50 }}>
                <Slider
                  style={{ width: '90%', height: 40, marginLeft: "5%", marginBottom: 10 }}
                  minimumValue={0}
                  maximumValue={100000}
                  value={rechargeAmount} // 이 부분을 수정
                  step={5}
                  minimumTrackTintColor="rgb(0,106,121)"
                  maximumTrackTintColor="lightgray"
                  thumbTintColor="rgb(0,106,121)"
                  onValueChange={(value) => setRechargeAmount(value)}
                />
              </View>

              <View style={{ flexDirection: "row", width: "100%", height: "15%" }}>
                <TouchableOpacity
                  style={{ justifyContent: "center", alignItems: "center", backgroundColor: "rgb(211,25,69)", width: "35%", marginLeft: "10%", marginRight: "10%", borderRadius: 5 }}
                  onPress={() => setRechargeModalVisible(false)}
                >
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ justifyContent: "center", alignItems: "center", backgroundColor: "rgb(0,106,121)", width: "35%", marginRight: "10%", borderRadius: 5 }}
                  onPress={handleRecharge}
                >
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>충전</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  section: {
    flex: 1,
    padding: 10,
  },
  header: {
    height: 80,
    backgroundColor: "rgb(165,174,180)",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    padding: 10,
  },
  headerTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
    paddingTop: 3,
    width: 180,
    marginLeft: 14
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 5,
    flex: 1,
  },
  infoComponent: {
    fleX: 1,
    padding: 10,
    backgroundColor: "white",
    borderColor: "lightgray",
    borderBottomWidth: 1,
  },
  rechargeButton: {
    fontSize: 16,
    fontWeight: "bold",
    color: "rgb(0,106,121)",
    paddingHorizontal: 5,
    marginLeft: 5
  },
  componentText: {
    fontSize: 18,
  },
  rechargeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rechargeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10
  },
  rechargeInput: {
    fontSize: 17,
    width: "60%",
    textAlign: "center",
    marginBottom: 10
  },
  rechargeBox: {
    position: "absolute",
    borderRadius: 5,
    width: "90%",
    height: "50%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white"
  }
});

export default Info;