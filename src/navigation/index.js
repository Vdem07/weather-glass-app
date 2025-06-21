import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useThemeContext } from '../theme/ThemeContext';

import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

// Предотвращаем автоматическое скрытие сплэш-экрана
SplashScreen.preventAutoHideAsync();

export default function Navigation() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const { isDark } = useThemeContext();

  useEffect(() => {
    async function prepare() {
      try {
        // Здесь можно добавить дополнительные задачи инициализации
        // например, загрузка шрифтов, предварительная загрузка данных и т.д.
        
        // Проверяем первый запуск
        await checkFirstLaunch();
        
        
      } catch (e) {
        console.warn('Ошибка при подготовке приложения:', e);
      } finally {
        setAppIsReady(true);
        setIsLoading(false);
      }
    }

    prepare();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const firstLaunch = await AsyncStorage.getItem('isFirstLaunch');
      if (firstLaunch === null) {
        // Первый запуск приложения
        setIsFirstLaunch(true);
      } else {
        // Не первый запуск
        setIsFirstLaunch(false);
      }
    } catch (error) {
      console.error('Ошибка проверки первого запуска:', error);
      setIsFirstLaunch(false);
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Скрываем сплэш-экран когда приложение готово
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null; // Показываем системный сплэш-экран
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false, 
            animationEnabled: true,
            animation: 'fade', // Плавная анимация переходов
          }}
          initialRouteName={isFirstLaunch ? 'Welcome' : 'Home'}
        >
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen} 
            options={{
              presentation: 'transparentModal',
              animation: 'fade_from_bottom',
            }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{
              presentation: 'transparentModal',
              animation: 'slide_from_left',
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{
              presentation: 'transparentModal',
              animation: 'slide_from_left',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}