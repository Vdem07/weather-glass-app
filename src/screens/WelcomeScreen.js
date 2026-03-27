/**
 * WelcomeScreen
 *
 * Экран первого запуска. Управляет шагами онбординга и сохранением начальных настроек.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { ScrollView } from 'react-native';
import { useThemeContext } from '../theme/ThemeContext';
import WelcomeStep from '../components/welcome/WelcomeStep';
import ManualStep from '../components/welcome/ManualStep';

export default function WelcomeScreen({ navigation }) {
  const [step, setStep] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const { isDark } = useThemeContext();

  const textColor = isDark ? '#fff' : '#333';
  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  const handleGeolocation = async () => {
    setStep('geo');
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Разрешение отклонено',
          'Для использования геолокации необходимо предоставить разрешение.',
          [
            { text: 'Выбрать вручную', onPress: () => { setStep('manual'); setLoading(false); } },
            { text: 'Повторить',       onPress: () => { setStep('welcome'); setLoading(false); } },
          ]
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await Promise.all([
        AsyncStorage.setItem('savedCity', JSON.stringify({ lat: location.coords.latitude, lon: location.coords.longitude })),
        AsyncStorage.setItem('useGeo', 'true'),
        AsyncStorage.setItem('isFirstLaunch', 'false'),
      ]);
      navigation.replace('Home');
    } catch {
      setLoading(false);
      Alert.alert(
        'Ошибка',
        'Не удалось определить местоположение. Попробуйте выбрать город вручную.',
        [
          { text: 'Выбрать вручную', onPress: () => setStep('manual') },
          { text: 'Повторить',       onPress: () => setStep('welcome') },
        ]
      );
    }
  };

  const handleCitySelect = async (cityData) => {
    setLoading(true);
    try {
      await Promise.all([
        AsyncStorage.setItem('savedCity', JSON.stringify({ lat: cityData.lat, lon: cityData.lon })),
        AsyncStorage.setItem('useGeo', 'false'),
        AsyncStorage.setItem('isFirstLaunch', 'false'),
      ]);
      navigation.replace('Home');
    } catch {
      setLoading(false);
      Alert.alert('Ошибка', 'Не удалось сохранить выбранный город');
    }
  };

  if (loading) {
    return (
      <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.background} blurRadius={70}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={textColor} />
            <Text style={[styles.loadingText, { color: textColor }]}>
              {step === 'geo' ? 'Определение местоположения...' : 'Настройка приложения...'}
            </Text>
          </View>
        </BlurView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.background} blurRadius={70}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
          {step === 'welcome' && (
            <WelcomeStep
              isDark={isDark}
              onGeoSelect={handleGeolocation}
              onManualSelect={() => setStep('manual')}
            />
          )}
          {step === 'manual' && (
            <ManualStep
              isDark={isDark}
              onCitySelect={handleCitySelect}
              onBack={() => setStep('welcome')}
            />
          )}
        </ScrollView>
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  blurOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  scroll: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 15, paddingTop: 20, paddingBottom: 50, gap: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
  loadingText: { fontSize: 16, textAlign: 'center', fontWeight: '500' },
});
