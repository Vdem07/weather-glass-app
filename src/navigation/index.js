import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { useThemeContext } from '../theme/ThemeContext';

import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useThemeContext();

  useEffect(() => {
    checkFirstLaunch();
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
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5'
      }}>
        <ActivityIndicator 
          size="large" 
          color={isDark ? '#fff' : '#333'} 
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false, 
          animationEnabled: true,
        }}
        initialRouteName={isFirstLaunch ? 'Welcome' : 'Home'}
      >
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen} 
          options={{
            presentation: 'transparentModal', // важно для избежания белых полос
          }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            presentation: 'transparentModal', // важно для избежания белых полос
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{
            presentation: 'transparentModal', // важно для избежания белых полос
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}