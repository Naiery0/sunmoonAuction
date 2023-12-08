import { TouchableOpacity, Image, Modal, View } from 'react-native';
import { useState } from 'react';

import AddItem from '../screens/AddItem';
const AddPost = (props) => {

  const [modalVisible,setModalVisible] = useState(false);
  const user = props.user;
  const mode = props.mode;

  const closeModal = () => {
    setModalVisible(false);
  }

  return (
    <>
      <TouchableOpacity
        style={{
          width: 62,
          height: 62,
          borderRadius: 20,
        }}
        onPress = {()=>setModalVisible(true)}
      >
        <Image source={require('../assets/plus.png')} style={{ width: 60, height: 60, tintColor: "rgb(165,174,180)" }} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View>
          <AddItem trigger = {closeModal} user={user} mode = {mode}/>
        </View>
      </Modal>
    </>
  )
}

export default AddPost;