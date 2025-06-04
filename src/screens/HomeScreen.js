import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { Ionicons, Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { getCurrentWeather, getDailyForecast, getHourlyForecast } from '../api/weather';
import getWeatherAnimation from '../utils/getWeatherAnimation';
import { useThemeContext } from '../theme/ThemeContext';
import { TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchCityByName } from '../api/weather';
import { StatusBar } from 'expo-status-bar';

import countries from 'i18n-iso-countries';
import ruLocale from 'i18n-iso-countries/langs/ru.json';

countries.registerLocale(ruLocale);

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useThemeContext();
  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [activeTab, setActiveTab] = useState('daily');
  const [showSearch, setShowSearch] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isOffline, setIsOffline] = useState(false);

  // Состояния для настроек
  const [useGeo, setUseGeo] = useState(true);
  const [tempUnit, setTempUnit] = useState('metric');
  const [windUnit, setWindUnit] = useState('m/s');
  const [pressureUnit, setPressureUnit] = useState('mmHg');

  // Адаптивные размеры
  const isSmallScreen = screenHeight < 700;
  const isMediumScreen = screenHeight >= 700 && screenHeight < 800;
  const isLargeScreen = screenHeight >= 800;

  // Цвета для адаптации под тему
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const placeholderColor = isDark ? 'lightgray' : '#999';
  const iconColor = isDark ? '#fff' : '#333';
  const borderColor = isDark ? '#fff' : '#333';

  // состояния для toast уведомлений:
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('info'); // 'info', 'warning', 'error'

  // 2. Добавьте функцию для показа toast:
const showToast = (message, type = 'info') => {
  setToastMessage(message);
  setToastType(type);
  setToastVisible(true);
  
  // Автоматически скрываем через 3 секунды
  setTimeout(() => {
    setToastVisible(false);
  }, 1000);
};

// 5. Добавьте вспомогательные функции:
const getToastColor = (type, isDark) => {
  const opacity = isDark ? 0.2 : 0.1;
  switch (type) {
    case 'warning':
      return `rgba(255, 107, 53, ${opacity})`; // #FF6B35 с прозрачностью
    case 'error':
      return `rgba(244, 67, 54, ${opacity})`; // Красный с прозрачностью
    case 'success':
      return `rgba(76, 175, 80, ${opacity})`; // Зеленый с прозрачностью
    case 'info':
    default:
      return `rgba(33, 150, 243, ${opacity})`; // Синий с прозрачностью
  }
};

const getToastIconColor = (type) => {
  switch (type) {
    case 'warning':
      return '#FF6B35'; // Тот же цвет как в офлайн индикаторе
    case 'error':
      return '#f44336'; // Красный
    case 'success':
      return '#4CAF50'; // Зеленый
    case 'info':
    default:
      return '#2196F3'; // Синий
  }
};

const getToastIcon = (type) => {
  switch (type) {
    case 'warning':
      return 'cloud-offline-outline';
    case 'error':
      return 'close-circle-outline';
    case 'success':
      return 'checkmark-circle-outline';
    case 'info':
    default:
      return 'information-circle-outline';
  }
};

  // Функции для конвертации единиц измерения
  const convertTemperature = (temp, unit) => {
    if (unit === 'imperial') {
      return (temp * 9/5) + 32;
    }
    return temp;
  };

  const getTemperatureSymbol = (unit) => {
    return unit === 'imperial' ? '°F' : '°C';
  };

  const convertWindSpeed = (speed, unit) => {
    switch (unit) {
      case 'km/h':
        return speed * 3.6;
      case 'mph':
        return speed * 2.237;
      default:
        return speed;
    }
  };

  const getWindSpeedUnit = (unit) => {
    switch (unit) {
      case 'km/h':
        return 'км/ч';
      case 'mph':
        return 'mph';
      default:
        return 'м/с';
    }
  };

  // 3. Добавьте функцию конвертации давления:
const convertPressure = (pressure, unit) => {
  // pressure приходит в гектопаскалях (hPa)
  switch (unit) {
    case 'mmHg':
      return Math.round(pressure * 0.75); // 1 hPa = 0.75 мм рт.ст.
    case 'hPa':
      return Math.round(pressure); // Без изменений
    case 'bar':
      return (pressure / 1000).toFixed(3); // 1000 hPa = 1 бар
    case 'psi':
      return (pressure * 0.0145).toFixed(2); // 1 hPa = 0.0145 PSI
    default:
      return Math.round(pressure * 0.75);
  }
};

// 4. Добавьте функцию получения единицы измерения:
const getPressureUnitLabel = (unit) => {
  switch (unit) {
    case 'mmHg':
      return 'мм рт.ст'; // Без пробелов и точек
    case 'hPa':
      return 'гПа';
    case 'bar':
      return 'бар';
    case 'psi':
      return 'PSI';
    default:
      return 'мм рт.ст';
  }
};

  // Функции для работы с кэшем
  const getCacheKey = (lat, lon) => `weather_cache_${lat.toFixed(4)}_${lon.toFixed(4)}`;

  const saveWeatherToCache = async (lat, lon, weatherData, forecastData, hourlyData) => {
    try {
      const cacheKey = getCacheKey(lat, lon);
      const cacheData = {
        weather: weatherData,
        forecast: forecastData,
        hourly: hourlyData,
        timestamp: Date.now(),
        coordinates: { lat, lon }
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('Погодные данные сохранены в кэш');
    } catch (error) {
      console.error('Ошибка сохранения в кэш:', error);
    }
  };

  const loadWeatherFromCache = async (lat, lon) => {
    try {
      const cacheKey = getCacheKey(lat, lon);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsedData.timestamp;
        const maxAge = 30 * 60 * 1000; // 30 минут

        console.log(`Найден кэш, возраст: ${Math.round(cacheAge / 1000 / 60)} минут`);
        
        // Возвращаем кэшированные данные независимо от возраста
        // В офлайн режиме они всё равно лучше чем ничего
        return {
          weather: parsedData.weather,
          forecast: parsedData.forecast,
          hourly: parsedData.hourly,
          isExpired: cacheAge > maxAge
        };
      }
      return null;
    } catch (error) {
      console.error('Ошибка загрузки из кэша:', error);
      return null;
    }
  };

  const clearOldCache = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const weatherCacheKeys = keys.filter(key => key.startsWith('weather_cache_'));
      
      for (const key of weatherCacheKeys) {
        const cachedData = await AsyncStorage.getItem(key);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsedData.timestamp;
          const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 год (365 дней)
          
          if (cacheAge > maxAge) {
            await AsyncStorage.removeItem(key);
            console.log(`Удален старый кэш (старше 1 года): ${key}`);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка очистки старого кэша:', error);
    }
  };

  // Загрузка настроек
  const loadSettings = async () => {
    try {
      const [geoSetting, unitSetting, windSetting, pressureSetting] = await Promise.all([
        AsyncStorage.getItem('useGeo'),
        AsyncStorage.getItem('unit'),
        AsyncStorage.getItem('windUnit'),
        AsyncStorage.getItem('pressureUnit') // Добавляем загрузку настройки давления
      ]);
  
      setUseGeo(geoSetting !== 'false');
      if (unitSetting) setTempUnit(unitSetting);
      if (windSetting) setWindUnit(windSetting);
      if (pressureSetting) setPressureUnit(pressureSetting); // Устанавливаем единицу давления
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  // Загрузка погодных данных с кэшированием
  const loadWeatherData = async (lat, lon, forceOnline = false) => {
    setLoading(true);
    
    try {
      // Сначала пробуем загрузить из кэша
      if (!forceOnline) {
        const cachedData = await loadWeatherFromCache(lat, lon);
        if (cachedData) {
          setWeather(cachedData.weather);
          setForecast(cachedData.forecast);
          setHourlyForecast(cachedData.hourly);
          setIsOffline(true);
          setLoading(false);
          
          if (cachedData.isExpired) {
            console.log('Кэш устарел, попытка обновления...');
            // Пытаемся обновить в фоне
            loadWeatherData(lat, lon, true);
          }
          return;
        }
      }
  
      // Загружаем свежие данные из API
      const current = await getCurrentWeather(lat, lon);
      const daily = await getDailyForecast(lat, lon);
      const hourlyRaw = await getHourlyForecast(lat, lon);
  
      const today = new Date().toDateString();
      const hourly = hourlyRaw.list.filter(item =>
        new Date(item.dt_txt).toDateString() === today
      );
  
      // Сохраняем в кэш
      await saveWeatherToCache(lat, lon, current, daily, hourly);
      
      setWeather(current);
      setForecast(daily);
      setHourlyForecast(hourly);
      setIsOffline(false);
      setLoading(false);
      
      console.log('Данные загружены из API и сохранены в кэш');
      
      // Показываем уведомление об успешном обновлении
      if (forceOnline) {
        showToast('Данные обновлены', 'success');
      }
      
    } catch (error) {
      console.error('Ошибка загрузки погоды:', error);
      
      // Если не удалось загрузить из API, пробуем кэш
      const cachedData = await loadWeatherFromCache(lat, lon);
      if (cachedData) {
        setWeather(cachedData.weather);
        setForecast(cachedData.forecast);
        setHourlyForecast(cachedData.hourly);
        setIsOffline(true);
        setLoading(false);
        
        // Заменяем Alert на toast
        showToast('Офлайн режим - данные из кэша', 'warning');
      } else {
        setLoading(false);
        // Заменяем Alert на toast
        showToast('Ошибка загрузки данных', 'error');
      }
    }
  };

  useEffect(() => {
    (async () => {
      // Сначала загружаем настройки
      await loadSettings();
      
      // Очищаем старые кэшированные данные
      await clearOldCache();

      try {
        // Проверяем сохранённый город
        const saved = await AsyncStorage.getItem('savedCity');
        let lat, lon;

        if (saved) {
          const coords = JSON.parse(saved);
          lat = coords.lat;
          lon = coords.lon;
        } else {
          // Запрашиваем разрешение на геолокацию
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setLoading(false);
            return;
          }

          const location = await Location.getCurrentPositionAsync({});
          lat = location.coords.latitude;
          lon = location.coords.longitude;
        }

        await loadWeatherData(lat, lon);
      } catch (error) {
        console.error('Ошибка инициализации:', error);
        setLoading(false);
      }
    })();
  }, []);

  // Перезагрузка при возвращении с экрана настроек
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSettings();
    });

    return unsubscribe;
  }, [navigation]);

  // Функция для принудительного обновления данных
  const refreshWeatherData = async () => {
    if (!weather) return;
    
    try {
      const saved = await AsyncStorage.getItem('savedCity');
      let lat, lon;

      if (saved) {
        const coords = JSON.parse(saved);
        lat = coords.lat;
        lon = coords.lon;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({});
        lat = location.coords.latitude;
        lon = location.coords.longitude;
      }

      await loadWeatherData(lat, lon, true);
    } catch (error) {
      console.error('Ошибка обновления:', error);
      Alert.alert('Ошибка', 'Не удалось обновить данные');
    }
  };

  if (loading || !weather) {
    return (
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={styles.background}
        blurRadius={70}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
          
          {/* Оверлей загрузки */}
          <View style={styles.loadingOverlay}>
              {/* Используем стандартную анимацию облаков */}
              <LottieView
                source={require('../assets/lottie/weather-welcome.json')} // Или любая другая имеющаяся анимация
                autoPlay
                loop
                style={styles.loadingAnimation}
              />
              <Text style={[styles.loadingText, { color: textColor }]}>
                Загрузка погоды...
              </Text>
          </View>
      </ImageBackground>
    );
  }

  const animation = getWeatherAnimation(weather.weather[0].main, weather.weather[0].description);

  return (
    <ImageBackground
      source={backgroundImage}
      resizeMode="cover"
      style={styles.background}
      blurRadius={70}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Поисковая строка и кнопки */}
          <View style={[styles.searchContainer, { 
            paddingTop: isSmallScreen ? 30 : 40,
            marginBottom: isSmallScreen ? 10 : 20 
          }]}>
            {/* Кнопка настроек */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Settings')} 
              style={[styles.settingsButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
            >
              <Ionicons name="settings" size={24} color={iconColor} />
            </TouchableOpacity>

            {/* Поле ввода */}
            <TextInput
              placeholder="Введите город"
              placeholderTextColor={placeholderColor}
              value={searchCity}
              onChangeText={async (text) => {
                setSearchCity(text);
                if (text.length > 2) {
                  try {
                    const results = await searchCityByName(text);
                    setSearchResults(results);
                  } catch (error) {
                    console.log('Поиск недоступен в офлайн режиме');
                    setSearchResults([]);
                  }
                } else {
                  setSearchResults([]);
                }
              }}
              style={[
                styles.textInput,
                {
                  color: textColor,
                  opacity: showSearch ? 1 : 0,
                  backgroundColor: showSearch 
                  ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') 
                  : 'transparent',
                }
              ]}
              editable={showSearch}
              pointerEvents={showSearch ? 'auto' : 'none'}
            />

            {/* Кнопка лупы */}
            <TouchableOpacity 
              onPress={() => setShowSearch(!showSearch)} 
              style={[styles.searchButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
            >
              <Ionicons name="search" size={24} color={iconColor} />
            </TouchableOpacity>
          </View>

          {/* Подсказки городов */}
          {showSearch && searchResults.length > 0 && (
            <View style={[
              styles.suggestionList,
              { 
                backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5',
                top: isSmallScreen ? 75 : 85
              }
            ]}>
              
              {/* 📍 Кнопка геолокации - показываем только если включена геолокация */}
              {useGeo && (
                <TouchableOpacity
                  onPress={async () => {
                    setShowSearch(false);
                    setSearchCity('');
                    setSearchResults([]);

                    // Удаляем сохранённый город
                    await AsyncStorage.removeItem('savedCity');

                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') return;

                    const location = await Location.getCurrentPositionAsync({});
                    const lat = location.coords.latitude;
                    const lon = location.coords.longitude;

                    await loadWeatherData(lat, lon);
                  }}
                  style={[
                    styles.suggestionItem, 
                    { borderBottomColor: isDark ? '#777' : '#ccc' }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={16} color={textColor} style={{ marginRight: 6 }} />
                  <Text style={{ color: textColor, fontWeight: 'bold' }}>
                    Использовать геолокацию
                  </Text>
                </View>
                </TouchableOpacity>
              )}

              {/* Города-подсказки */}
              {searchResults.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={async () => {
                    setShowSearch(false);
                    setSearchCity(`${(item.local_names?.ru || item.name)}, ${countries.getName(item.country, 'ru') || item.country}`);
                    setSearchResults([]);

                    const coords = { lat: item.lat, lon: item.lon };
                    await AsyncStorage.setItem('savedCity', JSON.stringify(coords));

                    await loadWeatherData(item.lat, item.lon);
                  }}
                  style={[
                    styles.suggestionItem,
                    { borderBottomColor: isDark ? '#444' : '#eee' }
                  ]}
                >
                <Text style={{ color: textColor }}>
                  {(item.local_names?.ru || item.name)}
                  {item.state ? `, ${item.state}` : ''}, 
                  {countries.getName(item.country, 'ru') || item.country}
                </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Верх: город + кнопка */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.city, { 
                color: textColor,
                fontSize: isSmallScreen ? 24 : 28
              }]}>{weather.name}</Text>
              <Text style={[styles.country, { 
                color: secondaryTextColor,
                fontSize: isSmallScreen ? 14 : 16
              }]}>
                {countries.getName(weather.sys.country, 'ru') || weather.sys.country}
              </Text>
            </View>
          </View>

          {/* Анимация + температура */}
          <View style={[styles.weatherMainContainer, {
            marginTop: isSmallScreen ? 10 : 20
          }]}>
          {/* Левая колонка с кнопкой обновления и индикатором офлайн */}
          <View style={styles.leftColumn}>
            <TouchableOpacity 
              onPress={refreshWeatherData} 
              style={[styles.refreshButtonFixed, { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' 
              }]}
            >
              <Ionicons name="refresh-outline" size={24} color={iconColor} />
              {/* Индикатор офлайн режима */}
              {isOffline && (
                <View style={styles.offlineDot} />
              )}
            </TouchableOpacity>
          </View>

            {/* Центральная колонка с анимацией и температурой */}
            <View style={styles.weatherMain}>
              <LottieView
                source={animation}
                autoPlay
                loop
                style={{ 
                  width: isSmallScreen ? 120 : (isMediumScreen ? 140 : 160), 
                  height: isSmallScreen ? 120 : (isMediumScreen ? 140 : 160)
                }}
              />
              <Text style={[styles.temp, { 
                color: textColor,
                fontSize: isSmallScreen ? 50 : (isMediumScreen ? 55 : 60),
                marginTop: isSmallScreen ? -5 : -10
              }]}>
                {Math.round(convertTemperature(weather.main.temp, tempUnit))}{getTemperatureSymbol(tempUnit)}
              </Text>
              <Text style={[styles.description, { 
                color: secondaryTextColor,
                fontSize: isSmallScreen ? 16 : 18,
                marginTop: isSmallScreen ? -5 : -10
              }]}>
                {weather.weather[0].description}
              </Text>
            </View>

            {/* Правая колонка (пустая для симметрии) */}
            <View style={styles.rightColumn} />
          </View>

          {/* Детали */}
          <BlurView intensity={40} style={[
            styles.detailsContainer,
            { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              marginTop: isSmallScreen ? 15 : 30,
              padding: isSmallScreen ? 12 : 15
            }
          ]}>
            <View style={styles.detailItem}>
              <Feather name="wind" size={isSmallScreen ? 18 : 20} color={iconColor} />
              <Text style={[styles.detailText, { 
                color: textColor,
                fontSize: isSmallScreen ? 12 : 14
              }]}>
                {convertWindSpeed(weather.wind.speed, windUnit).toFixed(1)} {getWindSpeedUnit(windUnit)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="droplet" size={isSmallScreen ? 18 : 20} color={iconColor} />
              <Text style={[styles.detailText, { 
                color: textColor,
                fontSize: isSmallScreen ? 12 : 14
              }]}>{weather.main.humidity}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="thermometer" size={isSmallScreen ? 18 : 20} color={iconColor} />
              <Text 
                style={[styles.detailText, { 
                  color: textColor,
                  fontSize: isSmallScreen ? 12 : 14
                }]}
                numberOfLines={1} // Ограничиваем одной строчкой
                adjustsFontSizeToFit={true} // Автоматически уменьшаем шрифт если не помещается
                minimumFontScale={0.8} // Минимальный размер шрифта (80% от исходного)
              >
                {convertPressure(weather.main.pressure, pressureUnit)} {getPressureUnitLabel(pressureUnit)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="sun" size={isSmallScreen ? 18 : 20} color={iconColor} />
              <Text style={[styles.detailText, { 
                color: textColor,
                fontSize: isSmallScreen ? 12 : 14
              }]}>
                {new Date(weather.sys.sunrise * 1000).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </BlurView>

          {/* Переключатели вкладок */}
          <View style={[styles.tabRow, {
            marginTop: isSmallScreen ? 15 : 20,
            marginBottom: isSmallScreen ? 15 : 20
          }]}>
            <TouchableOpacity onPress={() => setActiveTab('daily')}>
              <Text style={[
                styles.tabText, 
                { 
                  color: activeTab === 'daily' ? textColor : secondaryTextColor,
                  fontSize: isSmallScreen ? 14 : 16,
                  paddingHorizontal: isSmallScreen ? 20 : 14,
                },
                activeTab === 'daily' && {
                  ...styles.tabActive,
                  borderColor: borderColor,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                }
              ]}>
                Погода на 5 дней
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('hourly')}>
              <Text style={[
                styles.tabText, 
                { 
                  color: activeTab === 'hourly' ? textColor : secondaryTextColor,
                  fontSize: isSmallScreen ? 14 : 16
                },
                activeTab === 'hourly' && {
                  ...styles.tabActive,
                  borderColor: borderColor,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                }
              ]}>
                Почасовой прогноз
              </Text>
            </TouchableOpacity>
          </View>

          {/* Прогноз */}
          <View style={[styles.forecastContainer, {
            minHeight: isSmallScreen ? 140 : (isMediumScreen ? 160 : 180)
          }]}>
            {activeTab === 'daily' ? (
              <FlatList
                data={forecast}
                horizontal
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ 
                  paddingHorizontal: 15,
                  alignItems: 'flex-start'
                }}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={[
                    styles.dailyCard,
                    { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      width: isSmallScreen ? 90 : 110,
                      padding: isSmallScreen ? 6 : 8
                    }
                  ]}>
                    <Text style={[styles.day, { 
                      color: textColor,
                      fontSize: isSmallScreen ? 14 : 16
                    }]}>
                      {new Date(item.date).toLocaleDateString('ru-RU', {
                        weekday: 'short',
                      })}
                    </Text>
                    <LottieView
                      source={getWeatherAnimation(item.main, item.description)}
                      autoPlay
                      loop
                      style={{ 
                        width: isSmallScreen ? 70 : 90, 
                        height: isSmallScreen ? 70 : 90 
                      }}
                    />
                    <Text style={[styles.weatherStatus, { 
                      color: secondaryTextColor,
                      fontSize: isSmallScreen ? 10 : 12,
                      minHeight: isSmallScreen ? 32 : 36
                    }]}>
                      {item.description}
                    </Text>
                    <Text style={[styles.dayTemp, { 
                      color: textColor,
                      fontSize: isSmallScreen ? 16 : 18
                    }]}>
                      {Math.round(convertTemperature(item.temp, tempUnit))}{getTemperatureSymbol(tempUnit)}
                    </Text>
                  </View>
                )}
              />
            ) : (
              <FlatList
                data={hourlyForecast.slice(0, 8)}
                horizontal
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ 
                  paddingHorizontal: 15,
                  alignItems: 'flex-start'
                }}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={[
                    styles.dailyCard,
                    { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      width: isSmallScreen ? 90 : 110,
                      padding: isSmallScreen ? 6 : 8
                    }
                  ]}>
                    <Text style={[styles.day, { 
                      color: textColor,
                      fontSize: isSmallScreen ? 14 : 16
                    }]}>
                      {new Date(item.dt_txt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <LottieView
                      source={getWeatherAnimation(item.weather[0].main, item.weather[0].description)}
                      autoPlay
                      loop
                      style={{ 
                        width: isSmallScreen ? 70 : 90, 
                        height: isSmallScreen ? 70 : 90 
                      }}
                    />
                    <Text style={[styles.weatherStatus, { 
                      color: secondaryTextColor,
                      fontSize: isSmallScreen ? 10 : 12,
                      minHeight: isSmallScreen ? 32 : 36
                    }]}>
                      {item.weather[0].description}
                    </Text>
                    <Text style={[styles.dayTemp, { 
                      color: textColor,
                      fontSize: isSmallScreen ? 16 : 18
                    }]}>
                      {Math.round(convertTemperature(item.main.temp, tempUnit))}{getTemperatureSymbol(tempUnit)}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </ScrollView>

        {/* Toast уведомление */}
        {toastVisible && (
          <View style={[
            styles.toastContainer, 
            { 
              backgroundColor: getToastColor(toastType, isDark),
              top: isSmallScreen ? 40 : 50
            }
          ]}>
            <Ionicons 
              name={getToastIcon(toastType)} 
              size={16} 
              color={getToastIconColor(toastType)}
            />
            <Text style={[styles.toastText, { color: getToastIconColor(toastType) }]}>
              {toastMessage}
            </Text>
          </View>
        )}
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  weatherMainContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  leftColumn: {
    width: 50,
    alignItems: 'flex-start',
    paddingTop: 20, // Выравнивание с уровнем кнопки настроек
  },
  rightColumn: {
    width: 50, // Для симметрии
  },
  weatherMain: {
    alignItems: 'center',
    flex: 1,
  },
  
  // Общий стиль для кнопки:
  refreshButtonFixed: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  blurOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  offlineIndicator: {
    position: 'absolute',
    left: 20,
    padding: 10,
    borderRadius: 999,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 100,
  },
  settingsButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 45,
    borderRadius: 22.5,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  suggestionList: {
    position: 'absolute',
    top: 85,
    left: 60,
    right: 60,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 10,
    zIndex: 20,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  city: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  country: {
    textAlign: 'center',
    marginTop: 2,
  },
  temp: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    marginTop: 5,
    fontWeight: '500',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    textAlign: 'center',
  },
  tabActive: {
    fontWeight: 'bold',
    borderWidth: 1,
    borderRadius: 20,
  },
  forecastContainer: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  dailyCard: {
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 15,
    padding: 8,
    width: 110,
    minHeight: 160,
  },
  day: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  weatherStatus: {
    textAlign: 'center',
    textTransform: 'capitalize',
    marginVertical: 5,
    lineHeight: 16,
    minHeight: 32,
  },
  dayTemp: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  offlineDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  toastContainer: {
    position: 'absolute',
    left: '20%', // Больше ширины - 70% экрана
    right: '20%',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginLeft: 8,
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 500,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Полупрозрачный фон
  },
  loadingContainer: {
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 40,
    maxWidth: 280,
  },
  loadingAnimation: {
    width: 160,
    height: 160,
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});