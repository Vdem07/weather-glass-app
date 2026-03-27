/**
 * Navigation
 *
 * Корневой навигатор приложения.
 * При первом запуске направляет на WelcomeScreen, при последующих — на HomeScreen.
 * Управляет сплэш-экраном через expo-splash-screen.
 */

import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LifeActivityScreen from '../screens/LifeActivityScreen';
import WeatherMapScreen from '../screens/WeatherMapScreen';
import WidgetPreviewScreen from '../screens/WidgetPreviewScreen';

const Stack = createNativeStackNavigator();

SplashScreen.preventAutoHideAsync();

export default function Navigation() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        const value = await AsyncStorage.getItem('isFirstLaunch');
        setIsFirstLaunch(value === null);
      } catch (e) {
        console.warn('Ошибка при подготовке приложения:', e);
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
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            presentation: 'transparentModal',
          }}
          initialRouteName={isFirstLaunch ? 'Welcome' : 'Home'}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade_from_bottom' }} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="LifeActivity" component={LifeActivityScreen} />
          <Stack.Screen name="WeatherMap" component={WeatherMapScreen} />
          <Stack.Screen name="WidgetPreview" component={WidgetPreviewScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
