// ReportModal.js
import { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

import firebase from 'firebase'
import { db } from '../firebaseConfig'; // Firebase 설정 가져오기

const ReportModal = ({ isVisible, onClose, reporter, reportedUser, roomName }) => {
  const [reportReason, setReportReason] = useState("");

  const handleSubmit = async () => {
    const reportData = {
      reporter, // 신고한 사람
      reportedUser, // 신고 당한 사람
      reason: reportReason, // 신고 사유
      roomName, // 신고가 일어난 방 이름
      timestamp: firebase.firestore.FieldValue.serverTimestamp(), // 신고 시간
      sanction: false, // 제재 여부(운영자 직접관리)
    };

    try {
      await db.collection('reports').add(reportData);
      console.log('신고가 접수되었습니다.');
    } catch (error) {
      console.error('신고 접수 중 오류 발생:', error);
    }

    onClose(); // 모달 닫기 및 신고 사유 초기화
    setReportReason("");
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TextInput
            style={styles.textInput}
            placeholder="신고 사유를 적어주세요."
            placeholderTextColor="darkgray" // 플레이스홀더 텍스트 색상을 변경
            value={reportReason}
            onChangeText={setReportReason}
            multiline
          />
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: 'rgb( 211,25,69)' }]} // 취소 버튼 스타일 변경
              onPress={onClose}
            >
              <Text style={{color:"white"}}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: 'rgb(0,106,121)' }]} // 제출 버튼 스타일 변경
              onPress={handleSubmit}
            >
              <Text style={{ color: 'white' }}>제출</Text>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 5,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  textInput: {
    width: '80%',
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
    textAlignVertical: 'top',
    height: 100,
  },  
  button: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    flex: 1, // 각 버튼이 동일한 비율로 확장되도록 변경
    marginHorizontal: 10, // 버튼 사이의 마진 추가
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%', // 버튼 그룹의 너비를 조정
    paddingHorizontal: 20, // 좌우 패딩 추가
  },  
  
}); 

export default ReportModal;