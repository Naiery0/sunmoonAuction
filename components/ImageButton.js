import { TouchableOpacity, Image, StyleSheet } from 'react-native'

const ImageButton = (props) => {

  const imgSource = props.imgSource;
  const imgColor = props.imgColor;
  const imgFunction = props.imgFunction ? props.imgFunction : "";

  return (
    <TouchableOpacity
      onPress={imgFunction}
      style={styles.buttonContainer}
    >
      <Image source={imgSource} style={{ marginTop: 5, width: 25, height: 25, tintColor: imgColor }} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  buttonContainer : {
    width:35,
    height:35,
    alignItems:"center",
    justifyContent:"center"
  }
})

export default ImageButton;