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
import Slider from '@react-native-community/slider';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { WidgetPreview } from 'react-native-android-widget';
import { StatusBar } from 'expo-status-bar';

import { AdaptiveWeatherWidget } from '../components/widgets/AdaptiveWeatherWidget';
import { useThemeContext } from '../theme/ThemeContext';
import { getCurrentWeather, getDailyForecast } from '../api/weather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export default function AdaptiveWidgetPreviewScreen({ navigation }) {
  const { isDark } = useThemeContext();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Состояния для управления размером виджета
  const [widgetWidth, setWidgetWidth] = useState(320);
  const [widgetHeight, setWidgetHeight] = useState(120);

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
        error: null,
        widgetWidth,
        widgetHeight
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
        error: 'Демо-данные',
        widgetWidth,
        widgetHeight
      });
    } finally {
      setLoading(false);
    }
  };

  // Обновляем данные виджета при изменении размеров
  useEffect(() => {
    if (weatherData) {
      setWeatherData({
        ...weatherData,
        widgetWidth,
        widgetHeight
      });
    }
  }, [widgetWidth, widgetHeight]);

  // Предустановленные размеры
  const presetSizes = [
    { name: 'Компактный (1×1)', width: 120, height: 120 },
    { name: 'Малый (2×1)', width: 320, height: 120 },
    { name: 'Средний (4×2)', width: 320, height: 240 },
    { name: 'Большой (4×3)', width: 320, height: 320 },
    { name: 'Широкий (5×2)', width: 400, height: 240 },
    { name: 'Высокий (2×4)', width: 160, height: 320 },
  ];

  const showAddWidgetInstructions = () => {
    Alert.alert(
      'Как добавить адаптивный виджет',
      'Для добавления адаптивного виджета на главный экран:\n\n' +
      '1. Нажмите и удерживайте свободное место на главном экране\n' +
      '2. Выберите "Виджеты" или нажмите на значок виджетов\n' +
      '3. Найдите виджет "Погода: Адаптивный" в списке\n' +
      '4. Перетащите виджет на главный экран\n' +
      '5. Изменяйте размер виджета, растягивая его за углы\n\n' +
      '• Виджет автоматически адаптируется под размер\n' +
      '• Поддерживает размеры от 1×1 до 5×4\n' +
      '• Автоматически обновляется каждые 30 минут',
      [{ text: 'Понятно', style: 'default' }]
    );
  };

  const getWidgetSizeInfo = () => {
    if (widgetWidth <= 150 && widgetHeight <= 150) {
      return { type: 'Компактный', description: 'Только текущая температура' };
    }
    if (widgetHeight <= 150) {
      return { type: 'Малый', description: 'Текущая погода + день/ночь' };
    }
    if (widgetHeight <= 250) {
      return { type: 'Средний', description: 'Текущая погода + прогноз на 3 дня' };
    }
    return { type: 'Большой', description: 'Полная информация + детальные показатели' };
  };

  if (loading) {
    return (
      <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover" blurRadius={70}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: textColor }]}>
              Загрузка адаптивного виджета...
            </Text>
          </View>
        </BlurView>
      </ImageBackground>
    );
  }

  const sizeInfo = getWidgetSizeInfo();

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
            Адаптивный виджет
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

          {/* Информация о текущем размере */}
          <View style={[styles.sizeInfoCard, { backgroundColor: isDark ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.1)' }]}>
            <Text style={[styles.sizeInfoTitle, { color: '#2196F3' }]}>
              {sizeInfo.type} виджет ({widgetWidth}×{widgetHeight})
            </Text>
            <Text style={[styles.sizeInfoDescription, { color: '#2196F3' }]}>
              {sizeInfo.description}
            </Text>
          </View>

          {/* Предварительный просмотр виджета */}
          <View style={styles.previewContainer}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Предварительный просмотр
            </Text>
            
            <View style={styles.widgetPreviewContainer}>
              <WidgetPreview
                renderWidget={() => <AdaptiveWeatherWidget {...weatherData} />}
                width={widgetWidth}
                height={widgetHeight}
              />
            </View>
          </View>

          {/* Управление размером виджета */}
          <View style={styles.sizeControlSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Настройка размера
            </Text>

            {/* Управление размером через кнопки */}
            <View style={[styles.buttonControlContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={styles.buttonControlGroup}>
                <Text style={[styles.controlLabel, { color: textColor }]}>
                  Ширина: {widgetWidth}px
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                    onPress={() => setWidgetWidth(Math.max(80, widgetWidth - 20))}
                  >
                    <Ionicons name="remove" size={20} color={textColor} />
                  </TouchableOpacity>
                  
                  <View style={styles.valueContainer}>
                    <Text style={[styles.valueText, { color: textColor }]}>{widgetWidth}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                    onPress={() => setWidgetWidth(Math.min(420, widgetWidth + 20))}
                  >
                    <Ionicons name="add" size={20} color={textColor} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.buttonControlGroup}>
                <Text style={[styles.controlLabel, { color: textColor }]}>
                  Высота: {widgetHeight}px
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                    onPress={() => setWidgetHeight(Math.max(80, widgetHeight - 20))}
                  >
                    <Ionicons name="remove" size={20} color={textColor} />
                  </TouchableOpacity>
                  
                  <View style={styles.valueContainer}>
                    <Text style={[styles.valueText, { color: textColor }]}>{widgetHeight}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                    onPress={() => setWidgetHeight(Math.min(400, widgetHeight + 20))}
                  >
                    <Ionicons name="add" size={20} color={textColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Предустановленные размеры */}
            <Text style={[styles.presetsTitle, { color: textColor }]}>
              Быстрые настройки:
            </Text>
            <View style={styles.presetButtonsContainer}>
              {presetSizes.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.presetButton,
                    { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      borderColor: (widgetWidth === preset.width && widgetHeight === preset.height) 
                        ? '#2196F3' 
                        : 'transparent'
                    }
                  ]}
                  onPress={() => {
                    setWidgetWidth(preset.width);
                    setWidgetHeight(preset.height);
                  }}
                >
                  <Text style={[
                    styles.presetButtonText, 
                    { color: (widgetWidth === preset.width && widgetHeight === preset.height) 
                        ? '#2196F3' 
                        : textColor 
                    }
                  ]}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              ))}
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

          {/* Информация об адаптивном виджете */}
          <View style={[styles.infoSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Text style={[styles.infoSectionTitle, { color: textColor }]}>
              Преимущества адаптивного виджета
            </Text>
            <Text style={[styles.infoSectionText, { color: secondaryTextColor }]}>
              • Один виджет для всех размеров экрана{'\n'}
              • Автоматически адаптируется при изменении размера{'\n'}
              • Умное отображение контента в зависимости от пространства{'\n'}
              • Поддерживает размеры от компактного 1×1 до большого 5×4{'\n'}
              • Плавные переходы между режимами отображения{'\n'}
              • Оптимизированные размеры шрифтов и отступов{'\n'}
              • Работает на всех версиях Android 12+
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
  sizeInfoCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  sizeInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sizeInfoDescription: {
    fontSize: 14,
  },
  previewContainer: {
    gap: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  widgetPreviewContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 15,
  },
  sizeControlSection: {
    gap: 15,
  },
  buttonControlContainer: {
    padding: 20,
    borderRadius: 12,
    gap: 20,
  },
  buttonControlGroup: {
    gap: 10,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueContainer: {
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  valueText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  presetButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 2,
    minWidth: 120,
    alignItems: 'center',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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