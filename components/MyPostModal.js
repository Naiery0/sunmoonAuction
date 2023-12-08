import { View, ScrollView, Text, StyleSheet } from 'react-native';
import ItemList from './ItemList';
import ImageButton from './ImageButton';

const MyPostModal = (props) => {

  const selectedItems = props.items;
  const trigger = props.trigger;
  const user = props.user;

  return (
    <View style={{flex:1}}>
      <View style={styles.modalHeader}>

        <View style={{width:"90%",paddingLeft:10}}>
          <Text style={{fontSize:20, fontWeight:"bold"}}>{user}님의 게시글</Text>
        </View>
        <View style={{width:"10%"}}>
          <ImageButton
            imgSource={require("../assets/thinclose.png")}
            imgFunction={trigger}
            imgColor={"darkgray"}
          />
        </View>

      </View>
      <ScrollView style={{height:"100%"}}>
        {selectedItems.map(item => (
          <ItemList
            key={item.id}
            itemId={item.id}
            itemName={item.title}
            itemDate={item.createdAt}
            itemPrice={item.price}
            itemDetail={item.description}
            imageUrl={Array.isArray(item.images) && item.images.length > 0 ? item.images : ["noImage"]}
            endDate={item.endDate?item.endDate:"?"}
            writer={item.writer}
            bestUser={item.bestUser}
            user={user}
            mode={item.source === 'posts' ? 'market' : 'auction'}
            likeCount={item.likeCount}
            dealMode={item.dealMode}
            reserve={item.reserve}
            done={item.done}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  modalHeader : {
    flexDirection:"row",
    width:"100%",
    alignItems:"flex-end",
    paddingRight:10,
    paddingtop:15,
    borderBottomWidth:1,
    borderColor:"lightgray",
    paddingBottom:10
  }
})

export default MyPostModal;