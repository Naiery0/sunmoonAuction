import { Modal, View, StyleSheet } from 'react-native';
import Chatroom from '../screens/Chatroom';

const ChatRoomModal = ({ isVisible, onClose, roomId, userNickname, partnerNickname }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalView}>
        <Chatroom 
          roomId={roomId} 
          user={userNickname} 
          partner={partnerNickname} 
          trigger={onClose}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalView: {
    flex: 1,
    marginTop: 50,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  }
});

export default ChatRoomModal;