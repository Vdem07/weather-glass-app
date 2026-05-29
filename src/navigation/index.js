import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import WelcomeScreen      from '../screens/WelcomeScreen';
import HomeScreen         from '../screens/HomeScreen';
import FavoritesScreen    from '../screens/FavoritesScreen';
import SettingsScreen     from '../screens/SettingsScreen';
import LifeActivityScreen from '../screens/LifeActivityScreen';
import WeatherMapScreen   from '../screens/WeatherMapScreen';
import WidgetPreviewScreen from '../screens/WidgetPreviewScreen';
import BottomTabBar       from '../components/BottomTabBar';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

SplashScreen.preventAutoHideAsync();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const [appIsReady, setAppIsReady]       = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        const value = await AsyncStorage.getItem('isFirstLaunch');
        setIsFirstLaunch(value === null);
      } catch {
        setIsFirstLaunch(false);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  if (!appIsReady) return null;

  return (
    <View style={{ flex: 1 }} onLayout={() => SplashScreen.hideAsync()}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: 'fade', presentation: 'transparentModal' }}
          initialRouteName={isFirstLaunch ? 'Welcome' : 'Main'}
        >
          <Stack.Screen name="Welcome"       component={WelcomeScreen} options={{ animation: 'fade_from_bottom' }} />
          <Stack.Screen name="Main"          component={MainTabs} />
          <Stack.Screen name="Settings"      component={SettingsScreen} />
          <Stack.Screen name="LifeActivity"  component={LifeActivityScreen} />
          <Stack.Screen name="WeatherMap"    component={WeatherMapScreen} />
          <Stack.Screen name="WidgetPreview" component={WidgetPreviewScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
