import { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Image, Dimensions, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import ImageButton from './ImageButton';

const screenWidth = Dimensions.get('window').width;

const ImageSlider = (props) => {
  const sources = props.source;
  const [imageSources, setImageSources] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef();
  const modalScrollViewRef = useRef(); //모달 스크롤뷰적용
  const [modalVisible, setModalVisible] = useState(false);// 모달 상태

  useEffect(() => {
    let loadedImages = [];
    if (sources && sources.length > 0) {
      loadedImages = sources.map(source => ({
        uri: source + '?random=' + new Date().getTime()
      }));
    }
    setImageSources(loadedImages);
  }, [sources]);

  /*
 if (source && source.length > 0) {
   for (let i = 0; i < source.length; i++) {
     // Firebase Storage에서 이미지 다운로드 후 URL 사용
     const storageRef = storage().ref(source[i]);
     storageRef
       .getDownloadURL()
       .then((url) => {
         imageSources[i] = { uri: url };
       })
       .catch((error) => {
         console.error('이미지 다운로드 오류:', error);
       });
   }
 }
 */

  const totalImages = imageSources.length;

  const updateIndex = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / screenWidth);
    setCurrentImageIndex(newIndex);
  };
  // 이미지 클릭 이벤트부분 / 터치부분 리턴에 오퍼서티로 처리함
  const onImagePress = (index) => {
    setCurrentImageIndex(index);
    setModalVisible(true);
  };
  //모달 스크롤뷰한는법 github에서 가져옴
  useEffect(() => {
    if (modalVisible) {
      modalScrollViewRef.current.scrollTo({
        x: screenWidth * currentImageIndex,
        animated: false
      });
    }
  }, [modalVisible, currentImageIndex]);

  return (
    <View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={updateIndex}
        style={{ width: screenWidth }}
      >
        {imageSources.map((source, index) => (
          <TouchableOpacity key={index} onPress={() => onImagePress(index)}>
            <Image
              source={source}
              style={{ width: screenWidth, height: 325, resizeMode: 'cover' }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View
        style={{
          backgroundColor: "white",
          width: 50,
          height: 25,
          borderRadius: 8,
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          right: 10,
          bottom: 10
        }}
      >
        <Text>{currentImageIndex + 1} / {totalImages}</Text>
      </View>

      {/* 이미지 전체화면 모달 */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <ScrollView
            ref={modalScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.modalScrollView}
          >
            {imageSources.map((source, index) => (
              <Image
                key={index}
                source={source}
                style={styles.modalImage}
              />
            ))}
          </ScrollView>

          <View style={styles.closeButton}>
            <ImageButton
              imgSource={require("../assets/thinclose.png")}
              imgFunction={() => { setModalVisible(false) }}
              imgColor={"white"}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({

  modalView: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
  },
  modalScrollView: {
    width: screenWidth,
    height: screenWidth,
    alignItems: 'center',
  },
  modalImage: {
    width: screenWidth,
    height: screenWidth,
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 10,
    borderRadius: 25,
    padding: 10,
  },
});

export default ImageSlider;