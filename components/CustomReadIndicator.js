import { Text, View, StyleSheet } from 'react-native';

const CustomReadIndicator = () => (
  <View style={styles.container}>
    <Text style={styles.text}>   읽음</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    // 필요한 스타일을 여기에 정의합니다.
    marginRight: 5,
    marginBottom: 5,
  },
  text: {
    // 텍스트 스타일을 정의합니다.
    fontSize: 9,
    color: '#dedede',
  },
});

export default CustomReadIndicator;