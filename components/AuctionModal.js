import { View, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, TextInput } from 'react-native';
import { useState } from 'react';
import ImageButton from './ImageButton';
import Slider from '@react-native-community/slider'; // 슬라이더 라이브러리 추가
import { formatToCurrency } from './Utils';

const AuctionModal = (props) => {

  const trigger = props.trigger;
  const price = props.price;
  const handle = props.handle;
  const bestUser = props.bestUser;
  const user = props.user;
  const money = props.money;

  const [bidAmount, setBidAmount] = useState((price + Math.floor(price * 0.05)));

  return (
    <TouchableWithoutFeedback
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <TouchableOpacity
          style={styles.container}
          onPress={trigger}
        >
        </TouchableOpacity>

        <View style={styles.box}>
          <View style={{ width: "100%", alignItems: "flex-end", paddingTop: 15, paddingRight: 15 }}>
            <ImageButton
              imgSource={require("../assets/thinclose.png")}
              imgFunction={trigger}
              imgColor={"gray"}
            />
          </View>

          <View style={styles.section}>
            <View style={{ justifyContent: "center", marginBottom: 30 }}>
              <Text style={{ ...styles.bidText, fontWeight: "bold", marginBottom: 3, fontSize: 22 }}>최고입찰자</Text>
              <Text style={{ ...styles.bidText, fontSize: 16 }}> {bestUser ? bestUser : "없음"}</Text>
            </View>

            <View style={styles.bidComponent}>
              <Text style={styles.bidText}>현재 최고가</Text>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "rgb(67,67,67)" }}>{formatToCurrency(price) + "원"}</Text>
            </View>

            <View style={styles.bidComponent}>
              <Text style={styles.bidText}>최소 입찰가</Text>
              <Text style={{ fontSize: 20, fontWeight: "bold", backgroundColor: "rgb(211,25,69)", color: "white", width: "52%", textAlign: "right", justifyContent: "center" }}>{formatToCurrency(price + Math.floor(price * 0.05)) + "원"}</Text>
            </View>

            <View style={{ ...styles.inputBid, ...styles.bidComponent, marginBottom: 10 }}>
              <Text style={{ ...styles.bidText, width: "50%", textAlign: "left" }}>입찰가</Text>

              <View style={{ width: "50%", flexDirection: "row", justifyContent: "flex-end",alignItems:"flex-end" }}>
                <TextInput
                  placeholder={`${formatToCurrency(bidAmount)}`}
                  value={formatToCurrency(bidAmount)}
                  onChangeText={(text) => {
                    // 입력된 값에서 "원"을 제거하고 숫자만 추출하여 저장합니다.
                    const numericValue = parseFloat(text.replace(/[^0-9]/g, ''));
                    setBidAmount(numericValue);
                  }}
                  style={styles.inputBid}
                />
                <Text style={{ ...styles.bidText, fontWeight: "bold" }}>원</Text> 
              </View>
            </View>

            {/* 슬라이더 추가 */}
            <View style={{ height: 50 }}>
              <Slider
                style={{ width: '90%', height: 40, marginLeft: "5%", marginBottom: 10 }}
                minimumValue={price + Math.floor(price * 0.05)}
                maximumValue={price + (10 * Math.floor(price * 0.05))}
                value={bidAmount}
                step={5}
                minimumTrackTintColor="rgb(0,106,121)" // 최소 값 부분의 색상
                maximumTrackTintColor="lightgray"   // 최대 값 부분의 색상
                thumbTintColor="rgb(0,106,121)"        // 슬라이더 버튼의 색상
                onValueChange={(value) => setBidAmount(value)}
              />
            </View>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => {
                handle();
                trigger();
              }}
            >
              <Text style={{ ...styles.bidText, color: "white" }}>입찰</Text>
            </TouchableOpacity>

            <View style={{ ...styles.bidComponent, marginTop: 10 }}>
              <Text style={styles.bidText}>소유 금액</Text>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "rgb(67,67,67)" }}>{formatToCurrency(money) + "원"}</Text>
            </View>

          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  box: {
    position: "absolute",
    borderRadius: 5,
    zIndex: 5,
    width: "90%",
    height: "52%",
    backgroundColor: "white"
  },
  section: {
    flex: 1,
    width: "90%",
    marginLeft: "5%",
    justifyContent: "center"
  },
  btn: {
    width: "40%",
    height: 35,
    marginLeft: "30%",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(211,25,69)",
  },
  bidComponent: {
    width: "90%",
    marginLeft: "5%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30
  },
  inputBid: {
    fontSize: 19,
    color: "rgb(67,67,67)",
    textAlign: "right",
    fontWeight: "bold",
  },
  bidText: {
    fontSize: 19,
    color: "rgb(67,67,67)",
    textAlign: "center"
  }
})

export default AuctionModal;