/**
 * WidgetPreviewScreen
 *
 * Экран предварительного просмотра виджетов погоды.
 * При ошибке загрузки показывает демо-данные.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '../theme/ThemeContext';
import { getCurrentWeather, getDailyForecast } from '../api/weather';
import { convertTemperature, getTemperatureSymbol } from '../utils/weatherUnits';
import { getCoords } from '../hooks/useWeatherData';

import WidgetPreviewHeader from '../components/widgets/preview/WidgetPreviewHeader';
import WidgetPreviewCard   from '../components/widgets/preview/WidgetPreviewCard';
import WidgetInfoSection   from '../components/widgets/preview/WidgetInfoSection';

import { SmallWeatherWidget }  from '../components/widgets/SmallWeatherWidget';
import { MediumWeatherWidget } from '../components/widgets/MediumWeatherWidget';
import { LargeWeatherWidget }  from '../components/widgets/LargeWeatherWidget';

const getWeatherIcon = (weather) => {
  if (!weather?.weather?.[0]) return '❓';
  const main = weather.weather[0].main.toLowerCase();
  const id = weather.weather[0].id;
  const isDay = Date.now() / 1000 >= weather.sys.sunrise && Date.now() / 1000 < weather.sys.sunset;
  switch (main) {
    case 'clear':        return isDay ? '☀️' : '🌙';
    case 'clouds':       return weather.clouds.all < 25 ? (isDay ? '🌤️' : '🌙') : weather.clouds.all < 75 ? '⛅' : '☁️';
    case 'rain':         return id >= 511 ? '🌧️' : '🌦️';
    case 'drizzle':      return '🌦️';
    case 'thunderstorm': return '⛈️';
    case 'snow':         return '🌨️';
    case 'mist': case 'fog': case 'haze': case 'dust': case 'sand': return '🌫️';
    default:             return isDay ? '☀️' : '🌙';
  }
};

const DEMO_DATA = {
  current: {
    name: 'Москва',
    main: { temp: 22, feels_like: 20, temp_min: 18, temp_max: 25, humidity: 65, pressure: 1013 },
    weather: [{ main: 'Clear', description: 'ясно', id: 800 }],
    wind: { speed: 3.5 },
    clouds: { all: 10 },
    visibility: 10000,
    sys: { sunrise: Date.now() / 1000 - 21600, sunset: Date.now() / 1000 + 21600 },
  },
  forecast: [0, 1, 2, 3, 4].map((i) => ({
    date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
    temp: [25, 23, 20, 19, 22][i],
    nightTemp: [18, 16, 14, 13, 15][i],
    main: ['Clear', 'Clouds', 'Rain', 'Rain', 'Clouds'][i],
    description: ['ясно', 'облачно', 'дождь', 'дождь', 'облачно'][i],
  })),
};

const WIDGET_SIZES = [
  { key: 'small',  title: 'Малый виджет (2×1)',  desc: 'Текущая погода с дневной и ночной температурой',          width: 320, height: 120, Component: SmallWeatherWidget  },
  { key: 'medium', title: 'Средний виджет (4×2)', desc: 'Текущая погода + прогноз на 3 дня',                       width: 320, height: 240, Component: MediumWeatherWidget },
  { key: 'large',  title: 'Большой виджет (4×3)', desc: 'Текущая погода + детальные показатели + прогноз на 3 дня', width: 320, height: 320, Component: LargeWeatherWidget  },
];

const buildWeatherData = (current, forecast, tempUnit) => ({
  current,
  forecast: forecast.slice(0, 5),
  tempUnit,
  tempSymbol: getTemperatureSymbol(tempUnit),
  convertTemperature: (temp) => Math.round(convertTemperature(temp, tempUnit)),
  getWeatherDescription: (w) => w?.weather?.[0]?.description || 'Неизвестно',
  getWeatherIcon,
});

export default function WidgetPreviewScreen({ navigation }) {
  const { isDark } = useThemeContext();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const textColor = isDark ? '#fff' : '#333';
  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  const loadWeatherData = async () => {
    setLoading(true);
    setIsDemo(false);
    try {
      const coords = await getCoords();
      if (!coords) throw new Error('Разрешение на геолокацию не предоставлено');
      const [current, forecast] = await Promise.all([
        getCurrentWeather(coords.lat, coords.lon),
        getDailyForecast(coords.lat, coords.lon),
      ]);
      const tempUnit = await AsyncStorage.getItem('unit') || 'metric';
      setWeatherData(buildWeatherData(current, forecast, tempUnit));
    } catch (err) {
      console.error('Ошибка загрузки данных для предварительного просмотра:', err);
      setIsDemo(true);
      setWeatherData(buildWeatherData(DEMO_DATA.current, DEMO_DATA.forecast, 'metric'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWeatherData(); }, []);

  const showHelp = () => Alert.alert(
    'Как добавить виджет',
    '1. Нажмите и удерживайте свободное место на главном экране\n' +
    '2. Выберите "Виджеты"\n' +
    '3. Найдите виджеты "Погода" в списке\n' +
    '4. Выберите нужный размер и перетащите на экран\n\n' +
    'Виджеты автоматически обновляются каждые 30 минут.',
    [{ text: 'Понятно' }]
  );

  if (loading) {
    return (
      <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover" blurRadius={70}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
          <View style={styles.centered}>
            <Text style={[styles.loadingText, { color: textColor }]}>Загрузка данных виджетов...</Text>
          </View>
        </BlurView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover" blurRadius={70}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>

        <WidgetPreviewHeader isDark={isDark} navigation={navigation} onHelp={showHelp} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {isDemo && (
            <View style={styles.demoCard}>
              <Ionicons name="information-circle" size={20} color="#ff9800" />
              <Text style={styles.demoText}>Показаны демо-данные</Text>
            </View>
          )}

          {WIDGET_SIZES.map((w) => (
            <WidgetPreviewCard
              key={w.key}
              title={w.title}
              desc={w.desc}
              width={w.width}
              height={w.height}
              Component={w.Component}
              weatherData={weatherData}
              isDark={isDark}
            />
          ))}

          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: isDark ? 'rgba(33,150,243,0.2)' : 'rgba(33,150,243,0.1)' }]}
            onPress={loadWeatherData}
          >
            <Ionicons name="refresh" size={20} color="#2196F3" />
            <Text style={[styles.refreshBtnText, { color: '#2196F3' }]}>Обновить данные</Text>
          </TouchableOpacity>

          <WidgetInfoSection isDark={isDark} />

        </ScrollView>
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  blurOverlay: { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: 15, paddingBottom: 90, gap: 25 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, textAlign: 'center' },
  demoCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,152,0,0.1)', gap: 10 },
  demoText: { fontSize: 14, color: '#ff9800', flex: 1 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, gap: 10 },
  refreshBtnText: { fontSize: 16, fontWeight: '600' },
});
