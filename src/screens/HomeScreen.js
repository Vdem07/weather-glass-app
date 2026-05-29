import React, { useState, useCallback, useEffect } from 'react';
import { View, ImageBackground, StyleSheet, ScrollView, Text, RefreshControl } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useThemeContext } from '../theme/ThemeContext';
import { useWeatherData, getCoords } from '../hooks/useWeatherData';
import { useWeatherSettings } from '../hooks/useWeatherSettings';

import WeatherHeader  from '../components/home/WeatherHeader';
import WeatherMain    from '../components/home/WeatherMain';
import WeatherCards   from '../components/home/WeatherCards';
import HourlyForecast from '../components/home/HourlyForecast';
import DailyForecast  from '../components/home/DailyForecast';
import LifeSection    from '../components/home/LifeSection';
import LazyMapWidget  from '../components/LazyMapWidget';

import countries from 'i18n-iso-countries';
import ruLocale from 'i18n-iso-countries/langs/ru.json';
countries.registerLocale(ruLocale);

export default function HomeScreen({ navigation }) {
  const { isDark } = useThemeContext();
  const { settings, loadSettings } = useWeatherSettings();
  const route = useRoute();
  const [isFavorite, setIsFavorite] = useState(false);

  const {
    weather, forecast, hourlyForecast,
    loading, refreshing, refreshStatus, loadWeatherData, refreshWeatherData,
  } = useWeatherData(settings.autoRefreshInterval);

  const updateStatus = refreshing ? 'loading' : refreshStatus;

  useEffect(() => {
    if (route.params?.lat && route.params?.lon)
      loadWeatherData(route.params.lat, route.params.lon);
  }, [route.params]);

  useEffect(() => {
    if (!weather) return;
    AsyncStorage.getItem('favoriteCities').then(data => {
      const favs = data ? JSON.parse(data) : [];
      setIsFavorite(favs.some(f => f.name === weather.name && f.country === weather.country));
    });
  }, [weather]);

  const handleToggleFavorite = async () => {
    if (!weather) return;
    const data = await AsyncStorage.getItem('favoriteCities');
    const favs = data ? JSON.parse(data) : [];
    const exists = favs.some(f => f.name === weather.name && f.country === weather.country);
    const coords = await getCoords();
    const updated = exists
      ? favs.filter(f => !(f.name === weather.name && f.country === weather.country))
      : [...favs, { name: weather.name, country: weather.country, lat: coords?.lat, lon: coords?.lon }];
    await AsyncStorage.setItem('favoriteCities', JSON.stringify(updated));
    setIsFavorite(!exists);
  };

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
        } catch {}
      })();
    }, [loadSettings, loadWeatherData])
  );

  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';

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
            autoPlay loop style={styles.loadingAnimation}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshWeatherData}
              tintColor={isDark ? '#fff' : '#333'}
            />
          }
        >
          <WeatherHeader
            weather={weather}
            isDark={isDark}
            navigation={navigation}
            onCitySelect={(lat, lon) => loadWeatherData(lat, lon)}
            useGeo={settings.useGeo}
            updateStatus={updateStatus}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
          />
          <WeatherMain
            weather={weather}
            isDark={isDark}
            tempUnit={settings.tempUnit}
            useStaticIcons={settings.useStaticIcons}
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
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'center' },
  blurOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, gap: 20, paddingBottom: 120 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    gap: 15, zIndex: 500, backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingAnimation: { width: 160, height: 160 },
  loadingText: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
});
