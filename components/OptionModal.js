import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const OptionModal = ({ isVisible, onClose, onOptionSelect, reserve, done }) => {
  // 옵션 목록 동적 생성
  let options = ['삭제'];

  if (!done) {
    options.unshift('거래완료');
    if (!reserve) {
      options.unshift('예약하기');
    } else {
      options.unshift('예약 취소');
    }
  } else {
    options.unshift('거래 재개');
  }

  if (!done && !reserve) {
    options.unshift('끌어올리기');
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => onOptionSelect(option)}>
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionButton: {
    width: '100%',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    width: '100%',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#1a1a1a',
    textAlign: 'center',
  },
});

export default OptionModal;