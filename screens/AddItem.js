import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Image, Modal, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { firebase, db } from '../firebaseConfig';
import ImageButton from '../components/ImageButton';
import * as ImagePicker from 'expo-image-picker';
import { CheckBox } from 'react-native-elements';

{/* 중고, 경매 글을 추가하기 위한 스크린 */ }
const AddItem = (props, { existingPost, onPostSubmit }) => {

  const [title, setTitle] = useState(existingPost ? existingPost.title : '');
  const [description, setDescription] = useState(existingPost ? existingPost.description : '');
  const [images, setImages] = useState(existingPost ? existingPost.images : []);
  const [price, setPrice] = useState(existingPost ? existingPost.price.toString() : ''); // 가격 추가
  const trigger = props.trigger;
  const user = props.user;
  const [mode, setMode] = useState(props.mode);
  const [dealMode, setDealMode] = useState("");
  const [buyMode1, setBuyMode1] = useState(false);
  const [buyMode2, setBuyMode2] = useState(false);
  const [dealMode1, setDealMode1] = useState(false);
  const [dealMode2, setDealMode2] = useState(false);

  const defaultImageUrl = 'https://firebasestorage.googleapis.com/v0/b/community-33d06.appspot.com/o/images%2F%EB%B0%A9%EA%B8%8B%EB%A1%9C%EC%95%84%EC%BD%98.jpeg?alt=media&token=1992df51-6a7a-48ea-afcb-0d714bc838d1';

  useEffect(() => {

    console.log("mode : " + mode)
    if (mode == "market") {
      setBuyMode1(true);
    }
    else if (mode == "auction") {
      setBuyMode2(true);
    }
  }, []);

  const handleDeleteImage = (index) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };
  const handleChoosePhoto = async () => {

    if (images.length >= 5) {
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.cancelled) {
      setImages([...images, result.uri]);
    }
    else {
      console.log("이미지 업로드 실패");
    }
  };

  const uploadImage = async () => {
    if (images.length === 0) {
      return [defaultImageUrl];
    }

    const downloadURLs = await Promise.all(
      images.map(async (imageUri) => {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storageRef = firebase.storage().ref().child('images/' + new Date().toISOString());
        const uploadTask = storageRef.put(blob);

        return new Promise((resolve, reject) => {
          uploadTask.on(
            firebase.storage.TaskEvent.STATE_CHANGED,
            snapshot => { },
            error => reject(error),
            () => {
              uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                resolve(downloadURL);
              });
            }
          );
        });
      })
    );

    return downloadURLs;
  };

  const handleSubmit = async () => {
    try {
      if (title != "" && description != "" && price != "" && dealMode != "") {
        const imageUrls = await uploadImage();
        const now = new Date();
        // 24시간 (하루)을 현재 시간에 더합니다.
        const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        let postToAdd;
        if (mode == "market") {
          postToAdd = {
            title,
            description,
            writer: user,
            images: imageUrls,
            price: parseFloat(price), // 가격 추가
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            dealMode: dealMode, // 거래 방식 추가 ( 직거래 / 택배 거래 )
            category: selectedCategory,
            likeCount: 0,
            reserve: false,
            done: false,
            likeList: [],
          }
        }
        else if (mode == "auction") {
          postToAdd = {
            title,
            description,
            writer: user,
            images: imageUrls,
            price: parseFloat(price), // 가격 추가
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            endDate: oneDayLater, // 24시간 뒤의 시간을 endDate로 설정
            bestUser: null,
            dealMode: dealMode, // 거래 방식 추가 ( 직거래 / 택배 거래 )
            category: selectedCategory,
            likeCount: 0,
            done: false,
            likeList: [],
          }
        }

        let docRef;
        if (mode == "market") {
          if (existingPost) {
            // Update existing post
            await db.collection('posts').doc(existingPost.id).update(postToAdd);
          } else {
            // Create a new post
            await db.collection('posts').add(postToAdd);
          }
        }
        else if (mode == "auction") {
          if (existingPost) {
            // Update existing post
            docRef = db.collection('AuctionItems').doc(existingPost.id);
            await db.collection('AuctionItems').doc(existingPost.id).update(postToAdd);
          } else {
            // Create a new post
            docRef = await db.collection('AuctionItems').add(postToAdd);
          }

          // 참여자 정보를 추가
          const participantsCollectionRef = docRef.collection('participants');
          await participantsCollectionRef.doc('Index').set({}); // Index 문서 생성

          // createdAt 시간을 가져와서 endDate 계산
          const docSnapshot = await docRef.get();
          const createdAt = docSnapshot.data().createdAt;
          const endDate = new Date(createdAt.seconds * 1000 + 24 * 60 * 60 * 1000);
          await docRef.update({ endDate });
        }

        // onPostSubmit(); // Callback to inform the parent component about post submission
        setTitle('');
        setDescription('');
        setImages([]);
        setPrice(''); // 가격 초기화
        console.log("user : " + user);
        trigger();
      }
      else {
        alert("누락된 내용이 있습니다");
      }

    } catch (error) {
      console.error("Error adding/updating document: ", error);
      console.log("================  입력 내용 확인  ================");
      console.log("title : " + title + " / description : " + description);
      console.log("images : " + images + " / price : " + price);
      console.log("user : " + user);
      console.log("createdAt : " + createdAt);
      console.log("=================================================");
    }
  };

  const checkBoxClick = (val) => {

    if (val < 3) {
      if (val == 1) {
        setBuyMode1(true);
        setBuyMode2(false);
        setMode("market");
      }
      else if (val == 2) {
        setBuyMode1(false);
        setBuyMode2(true);
        setMode("auction");
      }
    }

    else if (val > 2) {
      if (val == 3) {
        setDealMode1(true);
        setDealMode2(false);
        setDealMode("직거래");
      }
      else if (val == 4) {
        setDealMode1(false);
        setDealMode2(true);
        setDealMode("택배 거래");
      }
    }
  }

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

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

  const selectCategory = (category) => {
    setSelectedCategory(category);
    setCategoryModalVisible(false);
  };

  return (
    <View style={{ height: "100%" }}>

      {/* 상단 헤더 */}
      <View style={styles.header}>
        <ImageButton
          imgSource={require("../assets/left.png")}
          imgFunction={trigger}
          imgColor={"gray"}
        />

        <View>
          <Text style={styles.headerTitle}>글 추가</Text>
        </View>
      </View>
      {/*수평 스크롤 가능하게 넣어둔거임 */}
      <ScrollView style={styles.section}>
        <View>
          {/* 카테고리 선택 버튼 */}
          <TouchableOpacity
            onPress={() => setCategoryModalVisible(true)}
            style={styles.categoryButton}
          >
            <Text style={styles.categoryButtonText}>카테고리 선택</Text>
          </TouchableOpacity>

          {/* 카테고리 선택 모달 */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={categoryModalVisible}
            onRequestClose={() => setCategoryModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text>카테고리 선택</Text>
                <View style={{ position: "absolute", right: 5, top: 5 }}>
                  <ImageButton
                    imgSource={require("../assets/close.png")}
                    imgFunction={() => { setCategoryModalVisible(false) }}
                    imgColor={"gray"}
                  />
                </View>

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

        <View style={{ paddingLeft: 15, marginBottom: 10 }}>
          <Text style={{ fontSize: 16, color: "gray", marginBottom: 10 }}>■ 구매 방식 선택</Text>
          <CheckBox
            title='중고 거래 마켓'
            checkedIcon='dot-circle-o'
            uncheckedIcon='circle-o'
            checked={buyMode1}
            onPress={() => checkBoxClick(1)}
            containerStyle={{ backgroundColor: 'transparent', borderWidth: 0, padding: 0, margin: 0, marginBottom: 5 }}
            textStyle={{ fontSize: 16, color: 'black' }}
          />
          <CheckBox
            title='경매'
            checkedIcon='dot-circle-o'
            uncheckedIcon='circle-o'
            checked={buyMode2}
            onPress={() => checkBoxClick(2)}
            containerStyle={{ backgroundColor: 'transparent', borderWidth: 0, padding: 0, margin: 0, marginBottom: 5 }}
            textStyle={{ fontSize: 16, color: 'black' }}
          />
        </View>

        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={styles.addImage}
            onPress={handleChoosePhoto}
          >
            <Image source={require("../assets/camera.png")} style={{ marginTop: 5, width: 25, height: 25, tintColor: "lightgray" }} />
          </TouchableOpacity>

          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ flexDirection: "row", marginLeft: 15 }}>
            {images.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={styles.imagePreviewContainer}
                onPress={() => handleDeleteImage(index)}
              >
                <Image source={{ uri: image }} style={{ width: 45, height: 45, marginTop: 5 }} />
                <Image
                  source={require("../assets/close.png")} // 삭제 버튼 이미지를 추가하세요.
                  style={{ width: 15, height: 15, position: 'absolute', top: 0, right: 0, tintColor: "red" }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <TextInput
          placeholder="제목"
          placeholderTextColor="lightgray"
          style={styles.inputTitle}
          value={title}
          onChangeText={(text) => setTitle(text)}
        />

        {mode == "market" && (
          <TextInput
            placeholder="￦ 가격을 입력해주세요"
            placeholderTextColor="lightgray"
            style={styles.inputPrice}
            value={price}
            onChangeText={(text) => setPrice(text)}
            keyboardType="numeric" // 숫자 키패드를 사용하도록 설정
          />
        )}
        {mode == "auction" && (
          <TextInput
            placeholder="￦ 경매 시작 가격을 입력해주세요"
            placeholderTextColor="lightgray"
            style={styles.inputPrice}
            value={price}
            onChangeText={(text) => setPrice(text)}
            keyboardType="numeric" // 숫자 키패드를 사용하도록 설정
          />
        )}

        <TextInput
          placeholder="안전하고 신뢰할 수 있는 거래를 위해 자세한 설명을 입력하세요"
          placeholderTextColor="lightgray"
          style={styles.inputContent}
          multiline={true}
          value={description}
          onChangeText={(text) => setDescription(text)}
        />
        <TextInput />

        <View style={{ paddingLeft: 15, marginBottom: 10 }}>
          <Text style={{ fontSize: 16, color: "gray", marginBottom: 10 }}>■ 거래 방식 선택</Text>
          <CheckBox
            title='직거래'
            checkedIcon='dot-circle-o'
            uncheckedIcon='circle-o'
            checked={dealMode1}
            onPress={() => checkBoxClick(3)}
            containerStyle={{ backgroundColor: 'transparent', borderWidth: 0, padding: 0, margin: 0, marginBottom: 5 }}
            textStyle={{ fontSize: 16, color: 'black' }}
          />
          <CheckBox
            title='택배 거래'
            checkedIcon='dot-circle-o'
            uncheckedIcon='circle-o'
            checked={dealMode2}
            onPress={() => checkBoxClick(4)}
            containerStyle={{ backgroundColor: 'transparent', borderWidth: 0, padding: 0, margin: 0, marginBottom: 5 }}
            textStyle={{ fontSize: 16, color: 'black' }}
          />
        </View>
      </ScrollView>

      <View style={{ backgroundColor: "white", height: "10%" }}>
        <TouchableOpacity
          style={styles.footer}
          onPress={handleSubmit}
        >
          <Text style={{ fontSize: 25, color: "white" }}>{existingPost ? "수정 완료" : "작성 완료"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    height: "10%",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: "white"
  },
  headerTitle: {
    color: "gray",
    fontWeight: "bold",
    fontSize: 20,
    paddingTop: 4,
    width: 180
  },
  section: {
    paddingTop: 15,
    height: "80%",
    backgroundColor: "white"
  },
  addImage: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "lightgray",
    paddingBottom: 5,
    paddingRight: 0,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
    marginBottom: 15
  },
  imagePreviewContainer: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "lightgray",
    paddingBottom: 5,
    paddingRight: 0,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  inputTitle: {
    fontSize: 17,
    marginLeft: 15,
    marginBottom: 10,
    paddingLeft: 10,
    paddingBottom: 10,
    width: "90%",
    borderBottomWidth: 1,
    borderColor: "lightgray"
  },
  inputPrice: {
    fontSize: 17,
    marginLeft: 15,
    padding: 10,
    width: "90%",
    height: 40,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "lightgray",
    marginBottom: 10
  },
  inputContent: {
    fontSize: 17,
    marginLeft: 15,
    padding: 10,
    width: "90%",
    height: 300,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "lightgray"
  },
  footer: {
    height: "95%",
    borderRadius: 15,
    width: "95%",
    marginLeft: "2.5%",
    backgroundColor: "rgb(0,106,121)",
    justifyContent: "center",
    alignItems: "center",
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
  categoryButton: {
    backgroundColor: 'rgb(0,106,121)',
    padding: 10,
    borderRadius: 5,
    margin: 10,
    alignItems: 'center',
  },
  categoryButtonText: {
    color: 'white',
    fontSize: 18,
  },
  categoryStyles: {
    fontSize: 17,
    marginRight: 20,
    marginVertical: 4
  }


})
export default AddItem;