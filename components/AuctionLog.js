import { TouchableOpacity, View, StyleSheet, TouchableWithoutFeedback, FlatList, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react'; // useState 추가
import ImageButton from './ImageButton';
import { db } from '../firebaseConfig.js'; // Firebase 설정 파일을 불러옵니다.
import { formatToCurrency } from './Utils';

const AuctionLog = (props) => {
  const trigger = props.trigger;
  const itemId = props.itemId;
  const [participantsData, setParticipantsData] = useState([]); // participantsData 상태 변수 추가

  useEffect(() => {
    // Firebase에서 participants 컬렉션 데이터 가져오기
    const fetchData = async () => {
      try {
        const participantsCollectionRef = db.collection('AuctionItems').doc(itemId).collection('participants'); // 경매 아이템의 문서 ID를 사용합니다.
        const snapshot = await participantsCollectionRef.get(); // 컬렉션 데이터를 가져옵니다.
        const data = []; // 데이터를 저장할 빈 배열 생성

        snapshot.forEach((doc) => {
          // 각 문서의 데이터를 가져와 배열에 추가합니다.

          if (doc.id !== "Index") {
            data.push({ id: doc.id, ...doc.data() });
          }
        });

        // 데이터를 상태 변수에 저장합니다.
        setParticipantsData(data);
      } catch (error) {
        console.error('Error fetching participants data: ', error);
      }
    };

    fetchData(); // 데이터를 가져오는 함수 호출
  }, [itemId]); // itemId를 의존성 배열에 추가

  const calculateTimeDifference = (timestamp) => {

    if (!timestamp) return '작성 시간 정보 없음';

    const currentTime = new Date();
    const postTime = timestamp.toDate();
    const timeDifference = currentTime - postTime;
    const minutesDifference = Math.floor(timeDifference / (1000 * 60));

    if (minutesDifference < 5) {
      return '방금 전';
    } else if (minutesDifference < 60) {
      return `${minutesDifference}분 전`;
    } else if (minutesDifference < 1440) {
      const hoursDifference = Math.floor(minutesDifference / 60);
      return `${hoursDifference}시간 전`;
    } else {
      const daysDifference = Math.floor(minutesDifference / 1440);
      return `${daysDifference}일 전`;
    }
  };

  const sortedParticipantsData = [...participantsData].sort((a, b) => {
    // bidAmount를 비교하여 정렬
    return b.bidAmount - a.bidAmount;
  });

  return (
    <TouchableWithoutFeedback>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <TouchableOpacity
          style={styles.container}
          onPress={trigger}
        >
        </TouchableOpacity>

        <View style={styles.box}>

          <View style={styles.header}>
            <View style={{ width: "100%", alignItems: "center", flex: 1, justifyContent:"center"}}>
              <Text style={styles.logo}>입찰내역</Text>
            </View>

            <View style={{ position:"absolute", width: "30%", alignItems: "flex-end", justifyContent:"center",right:0,top:5 }}>
              <ImageButton
                imgSource={require("../assets/thinclose.png")}
                imgFunction={trigger}
                imgColor={"rgb(67,67,67)"}
              />
            </View>
          </View>

          <View style={styles.section}>
            <ScrollView style={{flex:1}}>
              <FlatList
                data={sortedParticipantsData} // 정렬된 배열을 사용
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={{ marginBottom: 15 }}>
                    <Text style={{ fontSize: 18, color: "rgb(67,67,67)" }}>{calculateTimeDifference(item.timestamp)} </Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 20, color: "rgb(67,67,67)", fontWeight: "bold" }}>{formatToCurrency(item.bidAmount) + "원"} </Text>
                      <Text style={{ fontSize: 20, color: "rgb(67,67,67)" }}>{item.user}</Text>
                    </View>
                  </View>
                )}
              />
            </ScrollView>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback >
  );
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
    width: "80%",
    height: "50%",
    backgroundColor: "white",
    alignItems:"center"
  },
  header: {
    flex: 1,
    flexDirection: "row",
    width: "80%",
    borderBottomWidth: 1,
    borderColor: "rgb(67,67,67)",
    justifyContent:"center",
  },
  section: {
    flex: 6,
    width: "80%",
    paddingTop: 15
  },
  logo : {
    fontSize: 22, 
    fontWeight: "bold",
    color: "rgb(67,67,67)"
  }
})

export default AuctionLog;