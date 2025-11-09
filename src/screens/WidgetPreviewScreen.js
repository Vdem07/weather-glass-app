import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { WidgetPreview } from 'react-native-android-widget';
import { StatusBar } from 'expo-status-bar';

import { SmallWeatherWidget } from '../components/widgets/SmallWeatherWidget';
import { MediumWeatherWidget } from '../components/widgets/MediumWeatherWidget';
import { LargeWeatherWidget } from '../components/widgets/LargeWeatherWidget';
import { useThemeContext } from '../theme/ThemeContext';
import { getCurrentWeather, getDailyForecast } from '../api/weather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export default function WidgetPreviewScreen({ navigation }) {
  const { isDark } = useThemeContext();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Получаем координаты
      const savedCity = await AsyncStorage.getItem('savedCity');
      let lat, lon;

      if (savedCity) {
        const coords = JSON.parse(savedCity);
        lat = coords.lat;
        lon = coords.lon;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Разрешение на геолокацию не предоставлено');
        }

        const location = await Location.getCurrentPositionAsync({});
        lat = location.coords.latitude;
        lon = location.coords.longitude;
      }

      // Получаем данные о погоде
      const [current, forecast] = await Promise.all([
        getCurrentWeather(lat, lon),
        getDailyForecast(lat, lon),
      ]);

      // Получаем настройки температуры
      const tempUnit = await AsyncStorage.getItem('unit') || 'metric';
      const tempSymbol = tempUnit === 'imperial' ? '°F' : '°C';

      // Функции для виджетов
      const convertTemperature = (temp) => {
        if (tempUnit === 'imperial') {
          return Math.round((temp * 9/5) + 32);
        }
        return Math.round(temp);
      };

      const getWeatherDescription = (weather) => {
        if (!weather || !weather.weather || !weather.weather[0]) {
          return 'Неизвестно';
        }
        return weather.weather[0].description || 'Неизвестно';
      };

      const getWeatherIcon = (weather) => {
        if (!weather || !weather.weather || !weather.weather[0]) {
          return '❓';
        }
        
        const main = weather.weather[0].main.toLowerCase();
        const id = weather.weather[0].id;
        
        // Определяем время дня
        const now = Date.now() / 1000;
        const isDay = now >= weather.sys.sunrise && now < weather.sys.sunset;
        
        switch (main) {
          case 'clear':
            return isDay ? '☀️' : '🌙';
          case 'clouds':
            if (weather.clouds.all < 25) return isDay ? '🌤️' : '🌙';
            if (weather.clouds.all < 75) return '⛅';
            return '☁️';
          case 'rain':
            if (id >= 500 && id < 511) return '🌦️';
            if (id >= 511 && id < 520) return '🌧️';
            return '🌧️';
          case 'drizzle':
            return '🌦️';
          case 'thunderstorm':
            return '⛈️';
          case 'snow':
            return '🌨️';
          case 'mist':
          case 'fog':
            return '🌫️';
          case 'haze':
          case 'dust':
          case 'sand':
            return '🌫️';
          default:
            return isDay ? '☀️' : '🌙';
        }
      };

      setWeatherData({
        current,
        forecast: forecast.slice(0, 5),
        tempUnit,
        tempSymbol,
        convertTemperature,
        getWeatherDescription,
        getWeatherIcon,
        error: null
      });

    } catch (err) {
      console.error('Ошибка загрузки данных для предварительного просмотра:', err);
      setError(err.message);
      
      // Попытаемся загрузить демо-данные
      setWeatherData({
        current: {
          name: 'Москва',
          main: {
            temp: 22,
            feels_like: 20,
            temp_min: 18,
            temp_max: 25,
            humidity: 65,
            pressure: 1013,
          },
          weather: [{ main: 'Clear', description: 'ясно', id: 800 }],
          wind: { speed: 3.5 },
          clouds: { all: 10 },
          visibility: 10000,
          sys: {
            sunrise: Date.now() / 1000 - 21600, // 6 часов назад
            sunset: Date.now() / 1000 + 21600,  // через 6 часов
          },
        },
        forecast: [
          { date: new Date().toISOString().split('T')[0], temp: 25, nightTemp: 18, main: 'Clear', description: 'ясно' },
          { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], temp: 23, nightTemp: 16, main: 'Clouds', description: 'облачно' },
          { date: new Date(Date.now() + 172800000).toISOString().split('T')[0], temp: 20, nightTemp: 14, main: 'Rain', description: 'дождь' },
          { date: new Date(Date.now() + 259200000).toISOString().split('T')[0], temp: 19, nightTemp: 13, main: 'Rain', description: 'дождь' },
          { date: new Date(Date.now() + 345600000).toISOString().split('T')[0], temp: 22, nightTemp: 15, main: 'Clouds', description: 'облачно' },
        ],
        tempUnit: 'metric',
        tempSymbol: '°C',
        convertTemperature: (temp) => Math.round(temp),
        getWeatherDescription: (weather) => weather.weather?.[0]?.description || 'Демо',
        getWeatherIcon: () => '☀️',
        error: 'Демо-данные'
      });
    } finally {
      setLoading(false);
    }
  };

  const showAddWidgetInstructions = () => {
    Alert.alert(
      'Как добавить виджет',
      'Для добавления виджета на главный экран:\n\n' +
      '1. Нажмите и удерживайте свободное место на главном экране\n' +
      '2. Выберите "Виджеты" или нажмите на значок виджетов\n' +
      '3. Найдите виджеты "Погода" в списке\n' +
      '4. Выберите нужный размер виджета\n' +
      '5. Перетащите виджет на главный экран\n\n' +
      'Виджеты автоматически обновляются каждые 30 минут.',
      [{ text: 'Понятно', style: 'default' }]
    );
  };

  if (loading) {
    return (
      <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover" blurRadius={70}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: textColor }]}>
              Загрузка данных виджетов...
            </Text>
          </View>
        </BlurView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover" blurRadius={70}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
        
        {/* Заголовок */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}
          >
            <Ionicons name="chevron-back" size={20} color={textColor} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: textColor }]}>
            Виджеты погоды
          </Text>

          <TouchableOpacity
            onPress={showAddWidgetInstructions}
            style={[styles.infoButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}
          >
            <Ionicons name="help-circle-outline" size={20} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Информационное сообщение */}
          {error && (
            <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.1)' }]}>
              <Ionicons name="information-circle" size={20} color="#ff9800" />
              <Text style={[styles.infoText, { color: '#ff9800' }]}>
                {error === 'Демо-данные' ? 'Показаны демо-данные' : 'Используются кэшированные данные'}
              </Text>
            </View>
          )}

          {/* Малый виджет */}
          <View style={styles.widgetSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Малый виджет (2×1)
            </Text>
            <Text style={[styles.sectionDescription, { color: secondaryTextColor }]}>
              Текущая погода с дневной и ночной температурой
            </Text>
            
            <View style={styles.previewContainer}>
              <WidgetPreview
                renderWidget={() => <SmallWeatherWidget {...weatherData} />}
                width={320}
                height={120}
              />
            </View>
          </View>

          {/* Средний виджет */}
          <View style={styles.widgetSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Средний виджет (4×2)
            </Text>
            <Text style={[styles.sectionDescription, { color: secondaryTextColor }]}>
              Текущая погода + прогноз на 3 дня
            </Text>
            
            <View style={styles.previewContainer}>
              <WidgetPreview
                renderWidget={() => <MediumWeatherWidget {...weatherData} />}
                width={320}
                height={240}
              />
            </View>
          </View>

          {/* Большой виджет */}
          <View style={styles.widgetSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Большой виджет (4×3)
            </Text>
            <Text style={[styles.sectionDescription, { color: secondaryTextColor }]}>
              Текущая погода + детальные показатели + прогноз на 3 дня
            </Text>
            
            <View style={styles.previewContainer}>
              <WidgetPreview
                renderWidget={() => <LargeWeatherWidget {...weatherData} />}
                width={320}
                height={320}
              />
            </View>
          </View>

          {/* Кнопка обновления */}
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: isDark ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)' }]}
            onPress={loadWeatherData}
          >
            <Ionicons name="refresh" size={20} color="#2196F3" />
            <Text style={[styles.refreshButtonText, { color: '#2196F3' }]}>
              Обновить данные
            </Text>
          </TouchableOpacity>

          {/* Дополнительная информация */}
          <View style={[styles.infoSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Text style={[styles.infoSectionTitle, { color: textColor }]}>
              Информация о виджетах
            </Text>
            <Text style={[styles.infoSectionText, { color: secondaryTextColor }]}>
              • Виджеты автоматически обновляются каждые 30 минут{'\n'}
              • Данные синхронизируются с основным приложением{'\n'}
              • Работают в офлайн режиме с кэшированными данными{'\n'}
              • Меняют цвет фона в зависимости от времени суток{'\n'}
              • Адаптируются под настройки единиц измерения
            </Text>
          </View>
        </ScrollView>
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  blurOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    display: 'flex',
    flexDirection: 'row',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    display: 'flex',
    flexDirection: 'row',
  },
  scrollContainer: {
    flex: 1,
  },
  container: {
    padding: 15,
    paddingBottom: 90,
    gap: 25,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  widgetSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  previewContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 15,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 10,
    marginTop: 10,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoSectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});