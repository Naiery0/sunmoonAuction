import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Main from './screens/Main';
import Login from './screens/Login';
import Join from './screens/Join';
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen
          name="Main" component={Main}
          options={{
            headerTitle: ""
          }}
        />

        <Stack.Screen
          name="Login" component={Login}
          options={{
            headerTitle: "",
          }}
        />
        <Stack.Screen
          name="Join" component={Join}
          options={{
            headerTitle: "",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
