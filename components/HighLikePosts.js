import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { db } from '../firebaseConfig'
import ItemList from '../components/ItemList'


const HighLikePosts = (props) => {
  const user = props.user;
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Firebase에서 데이터 가져오기
    const fetchData = async () => {
     try {
        const response = await db.collection('posts').limit(10).get();
        const postsArray = response.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(item => !item.done) 
          .sort((a, b) => b.likeCount - a.likeCount);
        setPosts(postsArray);
        console.log('Firebase 데이터 가져오기 성공:', postsArray);
      } catch (error) {
        console.error('Firebase 데이터 가져오기 에러:', error);
      }
    };

    fetchData();
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘의 주목상품</Text>
        <ScrollView style={styles.section}>
        {posts.map((item) => (
          <View key={item.id}>
            <ItemList
              itemName={item.title}
              itemDate={item.createdAt}
              itemPrice={item.price}
              itemDetail={item.description}
              imageUrl={item.images && item.images.length > 0 ? item.images : "noImage"}
              writer={item.writer}
              user={user}
              mode={"market"}
              itemId={item.id}
              likeCount={item.likeCount}
              dealMode={item.dealMode}
              reserve={item.reserve}
              done={item.done}
              likeList={item.likeList}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color:"rgb(0,106,121)"
  },
  
});

export default HighLikePosts;