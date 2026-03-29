import React, { useState, useCallback, useEffect } from 'react';
import { View, ImageBackground, StyleSheet, ScrollView, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useThemeContext } from '../theme/ThemeContext';
import { useWeatherData, getCoords } from '../hooks/useWeatherData';
import { useWeatherSettings } from '../hooks/useWeatherSettings';

import WeatherHeader   from '../components/home/WeatherHeader';
import WeatherMain     from '../components/home/WeatherMain';
import WeatherCards    from '../components/home/WeatherCards';
import HourlyForecast  from '../components/home/HourlyForecast';
import DailyForecast   from '../components/home/DailyForecast';
import LifeSection     from '../components/home/LifeSection';
import ToastNotification from '../components/home/ToastNotification';
import LazyMapWidget   from '../components/LazyMapWidget';

import countries from 'i18n-iso-countries';
import ruLocale from 'i18n-iso-countries/langs/ru.json';
countries.registerLocale(ruLocale);

export default function HomeScreen({ navigation }) {
  const { isDark } = useThemeContext();
  const { settings, loadSettings } = useWeatherSettings();

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1000);
  }, []);

  const {
    weather, forecast, hourlyForecast,
    loading, refreshing, isOffline, loadWeatherData, refreshWeatherData,
  } = useWeatherData(settings.autoRefreshInterval, showToast);

  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await loadSettings();
        try {
          const shouldRefresh = await AsyncStorage.getItem('shouldRefreshWeather');
          if (shouldRefresh === 'true') {
            await AsyncStorage.removeItem('shouldRefreshWeather');
            const coords = await getCoords();
            if (coords) await loadWeatherData(coords.lat, coords.lon, true);
          }
        } catch (error) {
          console.error('Ошибка при проверке флага обновления:', error);
        }
      })();
    }, [loadSettings, loadWeatherData])
  );

  const units = {
    tempUnit:       settings.tempUnit,
    windUnit:       settings.windUnit,
    pressureUnit:   settings.pressureUnit,
    visibilityUnit: settings.visibilityUnit,
  };

  if (loading || !weather) {
    return (
      <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.background} blurRadius={70}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingOverlay}>
          <LottieView
            source={require('../assets/lottie/weather-welcome.json')}
            autoPlay loop
            style={styles.loadingAnimation}
          />
          <Text style={[styles.loadingText, { color: textColor }]}>Загрузка погоды...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.background} blurRadius={70}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <WeatherHeader
            weather={weather}
            isDark={isDark}
            navigation={navigation}
            onCitySelect={(lat, lon) => loadWeatherData(lat, lon)}
            useGeo={settings.useGeo}
          />
          <WeatherMain
            weather={weather}
            isDark={isDark}
            isOffline={isOffline}
            tempUnit={settings.tempUnit}
            useStaticIcons={settings.useStaticIcons}
            onRefresh={refreshWeatherData}
          />
          <WeatherCards
            weather={weather}
            hourlyForecast={hourlyForecast}
            isDark={isDark}
            layout={settings.cardsLayout}
            units={units}
          />
          <HourlyForecast
            hourlyForecast={hourlyForecast}
            isDark={isDark}
            tempUnit={settings.tempUnit}
            useStaticIcons={settings.useStaticIcons}
          />
          <DailyForecast
            forecast={forecast}
            isDark={isDark}
            tempUnit={settings.tempUnit}
            useStaticIcons={settings.useStaticIcons}
          />
          {settings.showLifeSection && (
            <LifeSection
              weather={weather}
              forecast={forecast}
              hourlyForecast={hourlyForecast}
              isDark={isDark}
              navigation={navigation}
              tempUnit={settings.tempUnit}
              windUnit={settings.windUnit}
              pressureUnit={settings.pressureUnit}
              visibilityUnit={settings.visibilityUnit}
            />
          )}
          <LazyMapWidget
            weather={weather}
            isDark={isDark}
            textColor={textColor}
            secondaryTextColor={secondaryTextColor}
            countries={countries}
            navigation={navigation}
          />
        </ScrollView>

        <ToastNotification
          message={refreshing ? 'Обновление...' : toastMessage}
          type={refreshing ? 'loading' : toastType}
          visible={refreshing || toastVisible}
          isDark={isDark}
        />
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'center' },
  blurOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, gap: 20, paddingBottom: 60 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    gap: 15, zIndex: 500, backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingAnimation: { width: 160, height: 160 },
  loadingText: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
});
