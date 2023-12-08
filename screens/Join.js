import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { db } from '../firebaseConfig.js'
import ImageButton from '../components/ImageButton'
import { useState } from 'react';

const Join = ({navigation}) => {

  const [id,setId] = useState('');
  const [pw,setPw] = useState('');
  const [checkPw, setCheckPw] = useState('');
  const [nickname,setNickname] = useState('');
  const [pos, setPos] = useState('');
  const [mail, setMail] = useState('');

  const createNewAccount = async () => {
    try {

      const isDuplicate = await checkDuplicateId(id);
      const isDuplicateName = await checkDuplicateName(nickname);

      if(id==""||pw==""||checkPw==""||nickname==""){
        alert("입력하지 않은 정보가 있습니다");
      }
      else if (isDuplicate) {
        alert("이미 사용 중인 아이디입니다");
      }
      else if(isDuplicateName){
        alert("이미 사용 중인 닉네임입니다")
      }
      else if(pw.length<8){
        alert("비밀번호는 8자리 이상으로 설정해주세요");
      }
      else if(pw != checkPw){
        alert("비밀번호가 일치하지 않습니다");
      }
      else {
        // Firestore 'Users' 컬렉션에 새 문서 추가
        await db.collection('Users').add({
          UserId: id,
          UserName: nickname,
          UserPw: pw,
          UserEmail: mail,
          LikeList: [],// 빈 배열로 초기화,
          money:0,
        });

        console.log('계정 생성 완료');
        // 성공 시 추가 로직 (예: 홈 화면으로 이동)
        navigation.navigate("Login");
      }
    } catch (error) {
      console.error('계정 생성 중 오류 발생: ', error);
      // 오류 처리 로직
    }
  };

  const checkDuplicateId = async (id) => {
    try {
      const userRef = db.collection('Users');
      const userDoc = await userRef.where('UserId', '==', id).get();

      return !userDoc.empty; // 만약 문서가 존재하면 true, 아니면 false 반환
    } catch (error) {
      console.error('Error checking duplicate id: ', error);
      throw error;
    }
  };

  const checkDuplicateName = async (nickname) => {
    try {
      const userRef = db.collection('Users');
      const userDoc = await userRef.where('UserName', '==', nickname).get();

      return !userDoc.empty; // 만약 문서가 존재하면 true, 아니면 false 반환
    } catch (error) {
      console.error('Error checking duplicate id: ', error);
      throw error;
    }
  };

  return(
    <View style={styles.container}>
      <View style={{width:"100%",alignItems:"flex-start",paddingLeft:10,marginBottom:20}}>
        <ImageButton
          imgSource={require("../assets/left.png")}
          imgFunction={() => { navigation.navigate("Login") }}
          imgColor={"lightgray"}
        />
      </View>

      <View style={styles.joinBox}>
        <Text>아이디</Text>
        <TextInput style={styles.input} value={id} onChangeText={(text)=>setId(text)} />

        <Text>비밀번호</Text>
        <TextInput style={styles.input} value={pw} onChangeText={(text)=>setPw(text)} secureTextEntry={true} />

        <Text>비밀번호 확인</Text>
        <TextInput style={styles.input} value={checkPw} onChangeText={(text)=>setCheckPw(text)} secureTextEntry={true} />

        <Text>닉네임</Text>
        <TextInput style={styles.input} value={nickname} onChangeText={(text)=>setNickname(text)} />

        <Text>이메일</Text>
        <TextInput style={styles.input} value={mail} onChangeText={(text)=>setMail(text)} />

        <TouchableOpacity
          style = {styles.btn}
          onPress = {createNewAccount}
        >
          <Text style={{color:"white",fontSize:25}}>가입하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles= StyleSheet.create({
    container : {
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      height: "100%"
    },
    joinBox : {
      width: "90%",
      height: "60%"
    },
    input : {
      width: "100%",
      height: 40,
      fontSize: 20,
      paddingLeft: 10,
      borderRadius: 5,
      backgroundColor: "#FAFAFA",
      marginTop: 5,
      marginBottom: 10
    },
    btn : {
      width: "100%",
      marginTop: 20,
      height: 50,
      backgroundColor: "rgb(0,106,121)",
      justifyContent: "center",
      alignItems: "center",
      borderRadius:5
    }
})
export default Join;