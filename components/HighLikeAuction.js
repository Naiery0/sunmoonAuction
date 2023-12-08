import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { db } from '../firebaseConfig';
import { formatToCurrency } from './Utils';
import AuctionDetail from '../screens/AuctionDetail';

const screenWidth = Dimensions.get('window').width;

const HighLikeAuction = (props) => {

  const [posts, setPosts] = useState([]);
  const [imageSources, setImageSources] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef();
  const [modalVisible, setModalVisible] = useState(false);
  const user = props.user;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await db.collection('AuctionItems')
          .orderBy('likeCount', 'desc')
          .limit(3)
          .get();

        const postsArray = response.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(item => item.done !== true);

        setPosts(postsArray);

        const firstImages = postsArray.map(item =>
          (item.images && item.images.length > 0) ? item.images[0] : "noImage"
        );

        setImageSources(firstImages.map(source => ({ uri: source })));
      } catch (error) {
        console.error('Firebase 데이터 가져오기 에러:', error);
      }
    };

    fetchData();
  }, []);

  const updateIndex = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / screenWidth);
    setCurrentImageIndex(newIndex);
  };

  const trigger = () => {
    setModalVisible(false);
  }

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return '날짜 정보 없음';
    }
    const date = timestamp.toDate();
    return date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HOT 경매</Text>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={updateIndex}
        style={{ width: screenWidth }}
      >
        {posts.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              setCurrentImageIndex(index); // 현재 인덱스 설정
              setModalVisible(true);
            }}
            style={styles.imageWrapper}
          >
            <Image
              source={imageSources[index]}
              style={styles.image}
            />
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{formatToCurrency(item.price)}원</Text>
            </View>

            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={{ flex: 1 }}>
                <AuctionDetail
                  trigger={trigger}
                  itemId={posts[currentImageIndex].id}
                  itemName={posts[currentImageIndex].title}
                  itemDate={formatDate(posts[currentImageIndex].createdAt)}
                  itemPrice={posts[currentImageIndex].price}
                  itemDetail={posts[currentImageIndex].description}
                  imageUrl={Array.isArray(posts[currentImageIndex].images) && posts[currentImageIndex].images.length > 0 ? posts[currentImageIndex].images : ["noImage"]}
                  endDate={posts[currentImageIndex].endDate}
                  writer={posts[currentImageIndex].writer}
                  bestUser={posts[currentImageIndex].bestUser}
                  user={user}
                  dealMode={posts[currentImageIndex].dealMode}
                  likeList={posts[currentImageIndex].likeList}
                  done={posts[currentImageIndex].done ? posts[currentImageIndex].done : false}
                />
              </View>
            </Modal>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 15,
    paddingLeft: 15,
    paddingTop: 20,
    color: "rgb(211,25,69)"
  },
  imageWrapper: {
    width: screenWidth,
    height: 200,
    position: 'relative',
  },
  image: {
    marginLeft: "3.5%",
    width: '93%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 5
  },
  priceTag: {
    position: 'absolute',
    bottom: 10,
    right: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 6,
  },
  priceText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HighLikeAuction;