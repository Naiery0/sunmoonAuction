import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, ScrollView, Image } from 'react-native';
import ImageButton from './ImageButton';
import { formatToCurrency } from './Utils';

const UserInfoModal = ({ onClose, writer, itemsForSale, auctionItems, visible }) => {
  // 판매 물건 목록을 렌더링하는 함수
  const renderAuctionItems = () => {
    return auctionItems.map((item, index) => (
      <View key={index} style={styles.itemContainer}>
        {item.images && item.images.length > 0 && (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.itemImage}
          />
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemPrice}>최고 입찰가: {formatToCurrency(item.price)}원</Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.itemDetail}>{item.description}</Text>
        </View>
      </View>
    ));
  };
  const renderItemsForSale = () => {
    const validItems = Array.isArray(itemsForSale) ? itemsForSale : [];
    return validItems.map((item, index) => (
      <View key={index} style={styles.itemContainer}>
        {item.images && item.images.length > 0 && (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.itemImage}
          />
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemPrice}>{formatToCurrency(item.price)}원</Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.itemDetail}>{item.description}</Text>
        </View>
      </View>
    ));
  };

  return (
    <TouchableWithoutFeedback>
      <View style={styles.container}>
        <TouchableOpacity
          style={{ flex:1, width: "100%", height: "100%" }}
          onPress={onClose}
        >
        </TouchableOpacity>

        <View style={styles.box}>
          <ScrollView 
            style={styles.modalContainer} contentContainerStyle={styles.contentContainer}
          >
            <View style={styles.closeButtonContainer}>
              <ImageButton
                imgSource={require("../assets/close.png")}
                imgFunction={onClose}
                imgColor={"black"}
              />
            </View>

            <Text style={styles.userInfoTitle}>작성자 정보</Text>
            <Text style={styles.userInfo}>{writer}</Text>
            {/* 추가적인 사용자 정보 표시 가능 */}
            <View style={styles.userInfoSection}>
              <Text style={styles.sectionTitle}>거래 성사 횟수</Text>
              {/* 거래 성사 횟수 표시 */}

            </View>
            <View style={styles.userInfoSection}>
              <Text style={styles.sectionTitle}>평가</Text>
            </View>
            <View style={styles.userInfoSection}>
              <Text style={styles.sectionTitle}>일반판매 물건</Text>
              {/* 판매 물건 목록 표시 */}
              {renderItemsForSale()}
            </View>
            {auctionItems && auctionItems.length > 0 && (
              <View style={styles.userInfoSection}>
                <Text style={styles.sectionTitle}>경매 판매목록</Text>
                {renderAuctionItems()}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  box: {
    flex: 1,
    width: "90%",
    height: "70%",
    position: "absolute",
    borderRadius: 10
  },
  contentContainer: {
    flexGrow: 1,
  },
  modalContainer: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: "white",
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 15,
    right: 10,
  },
  userInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 10,
  },
  userInfoSection: {
    marginTop: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    paddingBottom: 20,
    width: "100%"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: 'lightgray',
    width: "100%"
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-around',
  },
  itemTitle: {
    fontWeight: 'bold',
  },
  itemPrice: {
    color: 'green',
  },
  itemDetail: {
    color: 'gray',
  },
});

export default UserInfoModal;
