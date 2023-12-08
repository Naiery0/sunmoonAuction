import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';

import Market from './Market';
import Auction from './Auction';
import Home from './Home';
import ChatList from './ChatList';
import Info from './Info';

const Tab = createBottomTabNavigator();

const Main = (props) => {

  let user = null;
  let userId = null;

  if (props.route) {
    const params = props.route.params;
    user = params ? params.user : null;
    userId = params ? params.userId : null;

    console.log("Main User : "+user+", Main UserDoc : "+userId);
  }

  return (
    <Tab.Navigator initialRouteName="Home"
      screenOptions={{
        headerShown: false
      }}
    >
      <Tab.Screen
        name="Home" component={Home}
        initialParams={{ user: user }}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <Image source={require('../assets/home.png')} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
      <Tab.Screen
        name="Market" component={Market}
        initialParams={{ user: user }}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <Image source={require('../assets/trolley.png')} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Auction" component={Auction}
        initialParams={{ user: user }}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <Image source={require('../assets/tick.png')} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatList" component={ChatList}
        initialParams={{ user: user }}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <Image source={require('../assets/chat.png')} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
      <Tab.Screen
        name="Info" component={Info}
        initialParams={{ user: user, userId : userId }}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <Image source={require('../assets/info.png')} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default Main;