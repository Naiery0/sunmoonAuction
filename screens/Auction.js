import { Text, View, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig.js';
import ImageButton from '../components/ImageButton';
import ItemList from '../components/ItemList';
import AddPost from '../components/AddPost';
import { useNavigation } from '@react-navigation/native';

const Auction = (props) => {

  const navigation = useNavigation();

  const [posts, setPosts] = useState([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const params = props.route.params;
  const user = params ? params.user : null;

  useEffect(() => {
    const unsubscribe = db.collection('AuctionItems').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(newPosts);
    });

    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter(post =>
    (selectedCategory === '' || post.category === selectedCategory) &&
    post.title.toLowerCase().includes(searchInput.toLowerCase())
  );

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const categories = [
    '가구',
    '남성패션',
    '여성패션',
    '잡화',
    '가공식품',
    '생활용품',
    '가전제품',
    '스포츠용품',
    '취미/게임',
    '미용',
    '도서',
    '기타',
  ];

  const categoryStyles = {
    fontSize: 17,
    marginRight: 20,
    lineHeight: '30px',
  };

  const selectCategory = (category) => {
    setSelectedCategory(category);
    setCategoryModalVisible(false);
  };
  const resetFilter = () => {
    setSelectedCategory('');
  };

  return (
    <View style={styles.container}>

      {/* 상단 부분 */}
      <View style={styles.header}>

        <View style={{width:"80%", flexDirection:"row"}}>
          <ImageButton
            imgSource={require("../assets/left.png")}
            imgFunction={() => { navigation.navigate("Home") }}
            imgColor={"white"}
          />

          <View>
            <Text style={styles.headerTitle}>경매</Text>
          </View>
        </View>

        <View style={{width:"20%"}}>
          <View style={{ flexDirection: "row" }}>
            <ImageButton
              imgSource={require("../assets/search.png")}
              imgFunction={toggleSearch}
              imgColor={"white"}
            />
            <ImageButton
              imgSource={require("../assets/filter.png")}
              imgFunction={() => setCategoryModalVisible(true)}
              imgColor={"white"}
            />
          </View>
        </View>
      </View>

      {/* 필터 제거 버튼 */}
      {selectedCategory !== '' && (
        <TouchableOpacity
          onPress={resetFilter}
          style={styles.filterBtn}
        >
          <Text style={styles.filterText}>필터 : {selectedCategory}   </Text>
          <Image source={require("../assets/close.png")} style={{ width: 10, height: 10, tintColor: "lightgray" }} />
        </TouchableOpacity>
      )}
      
      {/* 검색창 */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="검색어를 입력하세요"
            placeholderTextColor="lightgray"
            onChangeText={text => setSearchInput(text)}
            value={searchInput}
          />
        </View>
      )}

      {/* 검색 결과 */}
      <ScrollView style={styles.section}>
        {filteredPosts.map((item) => (
          <View key={item.id}>
            <ItemList
              itemId={item.id}
              itemName={item.title}
              itemDate={item.createdAt}
              itemPrice={item.price}
              itemDetail={item.description}
              imageUrl={Array.isArray(item.images) && item.images.length > 0 ? item.images : ["noImage"]}
              endDate={item.endDate}
              writer={item.writer}
              bestUser={item.bestUser}
              user={user}
              mode={"auction"}
              likeCount={item.likeCount}
              dealMode={item.dealMode}
              likeList={item.likeList}
              done={item.done}
            />
          </View>
        ))}
      </ScrollView>

      <View style={{ position: "absolute", right: 20, bottom: 20 }}>
        <AddPost user={user} mode={"auction"} />
      </View>

      {/* 카테고리 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ position: "absolute", right: 10, top: 10 }}>
              <ImageButton
                imgSource={require("../assets/close.png")}
                imgFunction={() =>  setCategoryModalVisible(false) }
                imgColor={"black"}
              />
            </View>

            <Text style={{ marginBottom: 10 }}>카테고리 선택</Text>
            <FlatList
              data={categories}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => selectCategory(item)}
                >
                  <Text style={styles.categoryStyles}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 80,
    backgroundColor: "rgb(211,25,69)",
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
    width: 255,
    marginLeft: 14,
  },
  section: {
    flex: 13,
    backgroundColor: "rgb(244,244,244)"
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    height: '50%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  filterText: {
    color: 'white',
    fontSize: 16,
  },
  searchContainer: {
    marginTop: 5,
    marginBottom: 5,
    marginLeft: "5%",
    backgroundColor: "rgb(233,233,233)",
    width: "90%",
    paddingHorizontal: 10,
    borderRadius: 10
  },
  searchInput: {
    fontSize: 18,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  filterBtn: {
    marginTop: 5,
    marginBottom: 5,
    width: "90%",
    flexDirection: "row",
    backgroundColor: "darkgray",
    borderRadius: 10,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "5%"
  },
  categoryStyles: {
    fontSize: 17,
    marginRight: 20,
    marginVertical: 4
  }
})

export default Auction;
