import { View, StyleSheet, ScrollView } from 'react-native';
import Category from '../components/Category';
import HighLikePosts from '../components/HighLikePosts';
import HighLikeAuction from '../components/HighLikeAuction';

const Home = (props) => {

  const params = props.route.params;
  const user = params ? params.user : null;
  
  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1, width:"100%", height:"100%" }}>

        <View style={styles.header}>
          <HighLikeAuction user={user}/>
        {/*}
          <ImageSlider trigger={true} />

        {*/}
        </View>

        <View style={styles.section}>
          <Category/>
        </View>

        <View style={styles.footer}>
          <HighLikePosts user={user}/>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width:"100%",
    height:"100%"
  },
  header: {
    backgroundColor: "white",
    paddingBottom: 10
  },
  section: {
    backgroundColor: "white"
  },
  footer: {
    backgroundColor:"white"
  }

})

export default Home;