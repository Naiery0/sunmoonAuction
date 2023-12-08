import { useState } from 'react';
import { db } from '../firebaseConfig'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';

const Login = ({ navigation }) => {

  const [inputId, setInputId] = useState('');
  const [inputPw, setInputPw] = useState('');
  let nickname;
const loginUser = async (id, pw) => {
  try {
    const userRef = db.collection('Users');
    const userDocSnapshot = await userRef.where('UserId', '==', id).get();

    if (userDocSnapshot.empty) {
      alert("아이디 혹은 비밀번호가 일치하지 않습니다");
      throw new Error('해당 아이디를 가진 사용자가 없습니다.');
    }

    const userDoc = userDocSnapshot.docs[0];
    const userId = userDoc.id; // 사용자 문서의 ID 가져오기

    // 'ben' 컬렉션에서 사용자 문서 ID 검색
    const benRef = db.collection('ben');
    const benSnapshot = await benRef.where('userId', 'array-contains', userId).get();

    if (!benSnapshot.empty) {
      // 사용자가 'ben' 컬렉션에 존재할 경우 로그인 차단
      alert("귀하는 신고 확인에 따른 제재로 인해 로그인할 수 없습니다.");
      return null; // 로그인 차단
    }

    const userData = userDoc.data();
    if (userData.UserPw === pw) {
      // 비밀번호가 일치하면 로그인 성공
      nickname = userData.UserName;
      return { id: userId, ...userData }; // userId와 다른 사용자 데이터를 함께 반환
    } else {
      alert("아이디 혹은 비밀번호가 일치하지 않습니다");
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
  } catch (error) {
    console.error('Error logging in: ', error);
    throw error;
  }
};

  // 로그인 버튼 클릭 시 호출될 함수
  const handleLogin = async () => {
    try {
      const user = await loginUser(inputId, inputPw);
      if (user) {
        console.log("로그인 성공");

        //console.log("현재 위치 : Login / 유저 이름 : "+nickname)
        console.log("userDocId : " + user.id);
        navigation.navigate('Main', { user: nickname, userId: user.id });

        //console.log("이동");

        // 로그인 성공
        // 여기서 user 정보를 상태나 AsyncStorage 등을 사용하여 저장할 수 있습니다.
        // 예: setUser(user);
      } else {
        // 로그인 실패
        alert("로그인에 실패했습니다")
      }
    } catch (error) {
      console.error('Error handling login: ', error);
    }
  };

  return (
    <View style={styles.container}>
    
      <Image source={require("../assets/sunmoon.png")} style={{marginBottom:80}}/>

      <TextInput
        style={styles.input}
        placeholder="아이디를 입력하세요"
        placeholderTextColor="darkgray"
        value={inputId}
        onChangeText={setInputId}
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호를 입력하세요"
        placeholderTextColor="darkgray"
        secureTextEntry={true}
        value={inputPw}
        onChangeText={setInputPw}
      />
      <TouchableOpacity
        style={styles.btn}
        onPress={handleLogin}
      >
        <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ width: "30%", marginTop: 20, justifyContent: "center", alignItems: "center" }}
        onPress={() => navigation.navigate("Join")}
      >
        <Text style={{ color: "darkgray", fontSize: 15 }}>회원가입</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  input: {
    borderColor: "white",
    width: "100%",
    textAlign: "center",
    fontSize: 15,
    marginBottom: 10,
  },
  btn: {
    marginTop: 30,
    borderRadius: 10,
    width: "40%",
    height: 40,
    backgroundColor: "rgb(0,106,121)",
    justifyContent: "center",
    alignItems: "center"
  }
})
export default Login;