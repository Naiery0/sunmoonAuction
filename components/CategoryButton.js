import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'

const CategoryButton = (props) => {

  return (
    <TouchableOpacity
      style={styles.categoryContainer}
      onPress = {props.trigger}
    >
      <View style={styles.categoryBox}>
        <Image source = {props.img} style={{width:40,height:40}}/>
      </View>
      <Text style={{ width: "100%", textAlign: "center", fontSize:12, color:"black" }}>{props.title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
    categoryContainer : {
    width: 60,
    height: 80,
    marginRight: 10
  },
  categoryBox : {
    height: 60,
    justifyContent:"center",
    alignItems:"center",
    borderRadius: 15,
    marginBottom: 5
  }
})
export default CategoryButton;