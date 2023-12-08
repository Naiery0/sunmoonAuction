import { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import ImageButton from './ImageButton';
import { formatToCurrency } from './Utils';

const TransferMoneyModal = ({ isVisible, onClose, onTransfer }) => {
  const [amount, setAmount] = useState(0);

  const handleTransfer = () => {
    // 금액이 유효한지 확인하고 송금 처리
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      onTransfer(parsedAmount);
      onClose(); // 모달 닫기
    } else {
      alert('유효한 금액을 입력해주세요.');
    }
  };

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>송금</Text>

          <View style={{ position: "absolute", top: 5, right: 5 }}>
            <ImageButton
              imgSource={require("../assets/thinclose.png")}
              imgFunction={onClose}
              imgColor={"#0D1F1D"}
            />
          </View>
          <Text>금액을 입력해주세요</Text>
          <TextInput
              style={[styles.input, styles.inputUnderline]} // 추가된 스타일 적용
              keyboardType='numeric'
              value={amount === 0 ? '' : formatToCurrency(amount)}
              onChangeText={(text) =>{
              // 입력된 값에서 "원"을 제거하고 숫자만 추출하여 저장합니다.
              const cleanedText = text.replace(/[^0-9]/g, ''); // 숫자가 아닌 문자를 제거합니다.
              if (cleanedText === '') {
                setAmount(0); // 입력 값이 공백이면 amount를 0으로 설정합니다.
              } else {
                const numericValue = parseFloat(cleanedText);
                setAmount(numericValue || 0); // 입력 값이 숫자가 아니면 0으로 설정합니다.
              }
            }}
          />

          <View style={{ flexDirection: "row", width: "100%", justifyContent: "center", alignItems: "center" }}>

            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>닫기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ ...styles.button }}
              onPress={handleTransfer}
            >
              <Text style={styles.buttonText}>송금하기</Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalText: {
    marginBottom: 15,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: 'center'
  },
  input: {
    width: 200,
    padding: 10,
    marginBottom: 20,
    textAlign: "center"
  },
  button: {
    borderRadius: 5,
    width: "40%",
    padding: 10,
    elevation: 2,
    backgroundColor: '#ff3333',
    marginLeft: "5%"
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  buttonClose: {
    backgroundColor: '#acacac',
    marginLeft: "0%",
    marginRight: "5%"
  },
  input: {
    width: 200,
    padding: 10,
    marginBottom: 20,
    textAlign: "center",
    // 기존 스타일 정의...
  },
  inputUnderline: {
    borderBottomWidth: 1, // 밑줄 두께 설정
    borderBottomColor: 'grey', // 밑줄 색상 설정
  },
});

export default TransferMoneyModal;