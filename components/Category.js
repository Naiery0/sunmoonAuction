import { View, Text, StyleSheet } from 'react-native'
import CategoryButton from './CategoryButton';
import {useNavigation} from '@react-navigation/native';

const Category = () => {
  const navigation = useNavigation();

  const handleCategoryPress = (category) => {
    //console.log("전달카테고리",category)
    navigation.navigate('Market', { selectedCategory: category });
  };

  return (
    <View style={styles.container}>

      <Text style={{fontSize:20,fontWeight:"bold",width:"100%",paddingLeft:15,color:"rgb(13,31,29)",marginBottom:10}}>카테고리</Text>
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <CategoryButton title = {"남성패션"} trigger = {()=>{handleCategoryPress("남성패션")}} img = {require("../assets/man.png")}/>
        <CategoryButton title = {"여성패션"} trigger = {()=>{handleCategoryPress("여성패션")}} img = {require("../assets/woman.png")}/>
        <CategoryButton title = {"잡화"} trigger = {()=>{handleCategoryPress("잡화")}} img = {require("../assets/things.png")}/>
        <CategoryButton title = {"가공식품"} trigger = {()=>{handleCategoryPress("가공식품")}} img = {require("../assets/food.png")}/>
        <CategoryButton title = {"생활용품"} trigger = {()=>{handleCategoryPress("생활용품")}} img = {require("../assets/pot.png")}/>
      </View>

      <View style={{ flexDirection: "row" }}>
        <CategoryButton title = {"가전제품"} trigger = {()=>{handleCategoryPress("가전제품")}} img = {require("../assets/electric-appliance.png")}/>
        <CategoryButton title = {"스포츠용품"} trigger = {()=>{handleCategoryPress("스포츠용품")}} img = {require("../assets/sports.png")}/>
        <CategoryButton title = {"취미/게임"} trigger = {()=>{handleCategoryPress("취미/게임")}} img = {require("../assets/game-console.png")}/>
        <CategoryButton title = {"미용"} trigger = {()=>{handleCategoryPress("미용")}} img = {require("../assets/makeup.png")}/>
        <CategoryButton title = {"도서"} trigger = {()=>{handleCategoryPress("도서")}} img = {require("../assets/books.png")}/>
      </View>
      
    </View>
  )
}

const styles = StyleSheet.create({
  container : {
    width: "100%",
    height: 250,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center"
  },
})

export default Category;
