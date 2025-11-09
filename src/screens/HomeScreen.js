import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { Ionicons, Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { getCurrentWeather, getDailyForecast, getHourlyForecast, getUVIndex, getCurrentWeatherWithDewPoint, calculateDewPoint } from '../api/weather';
import getWeatherAnimation from '../utils/getWeatherAnimation';
import renderWeatherIcon from '../components/renderWeatherIcon'
import { useThemeContext } from '../theme/ThemeContext';
import { TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchCityByName } from '../api/weather';
import { StatusBar } from 'expo-status-bar';

import LazyMapWidget from '../components/LazyMapWidget';

import { SimpleVpnBanner, DismissibleVpnBanner, CompactVpnBanner, AnimatedVpnBanner } from '../components/VPNBanner';

import WebView from 'react-native-webview';

import countries from 'i18n-iso-countries';
import ruLocale from 'i18n-iso-countries/langs/ru.json';

import WeatherIcon from '../components/WeatherIcon';

countries.registerLocale(ruLocale);

export default function HomeScreen({ navigation }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useThemeContext();
  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isOffline, setIsOffline] = useState(false);

  // Состояния для настроек
  const [useGeo, setUseGeo] = useState(true);
  const [tempUnit, setTempUnit] = useState('metric');
  const [windUnit, setWindUnit] = useState('m/s');
  const [pressureUnit, setPressureUnit] = useState('mmHg');
  const [visibilityUnit, setVisibilityUnit] = useState('km');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState('30');

  // Цвета для адаптации под тему
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const placeholderColor = isDark ? 'lightgray' : '#999';
  const iconColor = isDark ? '#fff' : '#333';
  const borderColor = isDark ? '#fff' : '#333';

  // состояния для toast уведомлений:
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('info');

  const [countdown, setCountdown] = useState(0);

  const [cardsLayout, setCardsLayout] = useState('horizontal');

  const [useStaticIcons, setUseStaticIcons] = useState(false);

  const [dewPoint, setDewPoint] = useState(null);

  const [showLifeSection, setShowLifeSection] = useState(true);

  // Toast функции
  const showToast = (message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    
    setTimeout(() => {
      setToastVisible(false);
    }, 1000);
  };

  const getToastColor = (type, isDark) => {
    const opacity = isDark ? 0.2 : 0.1;
    switch (type) {
      case 'warning':
        return `rgba(255, 107, 53, ${opacity})`;
      case 'error':
        return `rgba(244, 67, 54, ${opacity})`;
      case 'success':
        return `rgba(76, 175, 80, ${opacity})`;
      case 'info':
      default:
        return `rgba(33, 150, 243, ${opacity})`;
    }
  };

  const getToastIconColor = (type) => {
    switch (type) {
      case 'warning':
        return '#FF6B35';
      case 'error':
        return '#f44336';
      case 'success':
        return '#4CAF50';
      case 'info':
      default:
        return '#2196F3';
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

  const convertPressure = (pressure, unit) => {
    switch (unit) {
      case 'mmHg':
        return Math.round(pressure * 0.75);
      case 'hPa':
        return Math.round(pressure);
      case 'bar':
        return (pressure / 1000).toFixed(3);
      case 'psi':
        return (pressure * 0.0145).toFixed(2);
      default:
        return Math.round(pressure * 0.75);
    }
  };

  const getPressureUnitLabel = (unit) => {
    switch (unit) {
      case 'mmHg':
        return 'мм рт.ст';
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

  // Функция для получения направления ветра
  const getWindDirection = (degrees) => {
    if (degrees === undefined || degrees === null) return 'Не определено';
    
    const directions = [
      'Северный', 'Северо-северо-восточный', 'Северо-восточный', 'Востоко-северо-восточный',
      'Восточный', 'Востоко-юго-восточный', 'Юго-восточный', 'Юго-юго-восточный',
      'Южный', 'Юго-юго-западный', 'Юго-западный', 'Западо-юго-западный',
      'Западный', 'Западо-северо-западный', 'Северо-западный', 'Северо-северо-западный'
    ];
    
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };
  
  // Компонент компаса для направления ветра
  const WindCompass = ({ degrees, size = 40, color = '#333' }) => {
    if (degrees === undefined || degrees === null) {
      return null;
    }
  
    return (
      <View style={{ 
        width: size, 
        height: size, 
        justifyContent: 'center', 
        alignItems: 'center',
        marginTop: 10 
      }}>
        {/* Кольцо компаса */}
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
          position: 'absolute',
          opacity: 0.3
        }} />
        
        {/* Стрелка направления */}
        <View style={{
          width: size * 0.6,
          height: 2,
          backgroundColor: color,
          position: 'absolute',
          transform: [{ rotate: `${degrees}deg` }],
          transformOrigin: 'center'
        }}>
          {/* Наконечник стрелки */}
          <View style={{
            position: 'absolute',
            right: -4,
            top: -4,
            width: 0,
            height: 0,
            borderLeftWidth: 6,
            borderRightWidth: 0,
            borderTopWidth: 4,
            borderBottomWidth: 4,
            borderLeftColor: color,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent'
          }} />
        </View>
        
        {/* Центральная точка */}
        <View style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
          position: 'absolute'
        }} />
      </View>
    );
  };

  // Функция для конвертации видимости
  const convertVisibility = (visibility, unit) => {
    if (!visibility) return 'Н/Д';
    
    switch (unit) {
      case 'km':
        if (visibility >= 1000) {
          return `${(visibility / 1000).toFixed(1)} км`;
        } else {
          return `${(visibility / 1000).toFixed(2)} км`;
        }
      case 'm':
        return `${visibility} м`;
      case 'mi':
        const miles = (visibility / 1609.34).toFixed(1);
        return `${miles} миль`;
      default:
        // По умолчанию километры
        if (visibility >= 1000) {
          return `${(visibility / 1000).toFixed(1)} км`;
        } else {
          return `${(visibility / 1000).toFixed(2)} км`;
        }
    }
  };

  // Функция для получения данных об осадках
  const getPrecipitationProbability = (weather, hourlyForecast) => {
    // Сначала проверяем текущие данные
    if (weather.pop !== undefined && weather.pop !== null) {
      return `${Math.round(weather.pop * 100)}%`;
    }
    
    // Если в текущих данных нет pop, берем из ближайшего прогноза
    if (hourlyForecast && hourlyForecast.length > 0) {
      const nearestForecast = hourlyForecast[0];
      if (nearestForecast.pop !== undefined && nearestForecast.pop !== null) {
        return `${Math.round(nearestForecast.pop * 100)}%`;
      }
    }
    
    // Если совсем нет данных, попробуем определить по типу погоды
    const weatherMain = weather.weather[0].main.toLowerCase();
    const weatherDescription = weather.weather[0].description.toLowerCase();
    
    if (weatherMain.includes('rain') || weatherDescription.includes('дождь')) {
      return '90%';
    } else if (weatherMain.includes('snow') || weatherDescription.includes('снег')) {
      return '85%';
    } else if (weatherMain.includes('drizzle') || weatherDescription.includes('морось')) {
      return '70%';
    } else if (weatherMain.includes('thunderstorm') || weatherDescription.includes('гроза')) {
      return '95%';
    } else if (weatherMain.includes('clouds')) {
      const cloudiness = weather.clouds?.all || 0;
      if (cloudiness > 80) return '30%';
      if (cloudiness > 50) return '15%';
      return '5%';
    }
    
    return '0%';
  };

  // Функция для определения части дня
  const getDayPeriod = (weather) => {
    const now = new Date();
    const currentHour = now.getHours();
    const sunrise = new Date(weather.sys.sunrise * 1000);
    const sunset = new Date(weather.sys.sunset * 1000);
    const sunriseHour = sunrise.getHours();
    const sunsetHour = sunset.getHours();

    if (currentHour >= 5 && currentHour < 12) {
      return 'Утро';
    } else if (currentHour >= 12 && currentHour < 17) {
      return 'День';
    } else if (currentHour >= 17 && currentHour < 22) {
      return 'Вечер';
    } else {
      return 'Ночь';
    }
  };

  // Функция для получения времени последнего обновления
  const getLastUpdateTime = (weather) => {
    if (weather.dt) {
      const updateTime = new Date(weather.dt * 1000);
      const now = new Date();
      const diffMs = now - updateTime;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);

      if (diffMinutes < 1) {
        return 'только что';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} мин назад`;
      } else if (diffHours < 24) {
        return `${diffHours} ч назад`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} д назад`;
      }
    }
    return 'неизвестно';
  };

const getTimeUntilNextRefresh = () => {
  if (!weather || !weather.dt) return 0;
  
  const lastUpdate = new Date(weather.dt * 1000);
  const intervalMs = parseInt(autoRefreshInterval) * 60 * 1000;
  const nextUpdate = new Date(lastUpdate.getTime() + intervalMs);
  const now = new Date();
  
  if (nextUpdate <= now) {
    return 0;
  }
  
  const diffMs = nextUpdate - now;
  const totalSeconds = Math.floor(diffMs / 1000);
  
  return Math.max(totalSeconds, 0);
};

  // Функция форматирования времени
const formatTime = (totalSeconds) => {
  if (totalSeconds <= 0) return 'скоро';
  
  if (totalSeconds <= 60) {
    return `${totalSeconds}с`;
  }
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes < 60) {
    return `${minutes}м ${seconds}с`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0 && seconds === 0) {
    return `${hours}ч`;
  } else if (seconds === 0) {
    return `${hours}ч ${remainingMinutes}м`;
  } else {
    return `${hours}ч ${remainingMinutes}м ${seconds}с`;
  }
};

  // Функция для выбора подходящей иконки осадков:
  // const getPrecipitationIcon = (weather) => {
  //   const weatherMain = weather.weather[0].main.toLowerCase();
  //   const weatherDescription = weather.weather[0].description.toLowerCase();
    
  //   if (weatherMain.includes('rain') || weatherDescription.includes('дождь')) {
  //     return 'rainy'; // дождь
  //   } else if (weatherMain.includes('snow') || weatherDescription.includes('снег')) {
  //     return 'snow'; // снег
  //   } else if (weatherMain.includes('thunderstorm') || weatherDescription.includes('гроза')) {
  //     return 'thunderstorm'; // гроза
  //   } else {
  //     return 'umbrella'; // обычный зонт по умолчанию
  //   }
  // };

  // Функции для работы с кэшем
  const getCacheKey = (lat, lon) => `weather_cache_${lat.toFixed(4)}_${lon.toFixed(4)}`;

  const saveWeatherToCache = async (lat, lon, weatherData, forecastData, hourlyData, dewPointData) => {
    try {
      const cacheKey = getCacheKey(lat, lon);
      const cacheData = {
        weather: weatherData,
        forecast: forecastData,
        hourly: hourlyData,
        dewPoint: dewPointData || weatherData.dew_point || null, // Исправлено: правильно сохраняем точку росы
        timestamp: Date.now(),
        coordinates: { lat, lon }
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('Погодные данные сохранены в кэш, точка росы:', cacheData.dewPoint);
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
        
        const refreshInterval = parseInt(autoRefreshInterval) * 60 * 1000;
        
        console.log(`Найден кэш, возраст: ${Math.round(cacheAge / 1000 / 60)} минут`);
        console.log(`Интервал обновления: ${autoRefreshInterval} минут`);
        
        return {
          weather: parsedData.weather,
          forecast: parsedData.forecast,
          hourly: parsedData.hourly,
          dewPoint: parsedData.dewPoint || null, // Добавляем точку росы
          isExpired: cacheAge > refreshInterval
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
          const maxAge = 365 * 24 * 60 * 60 * 1000;
          
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
      const [geoSetting, unitSetting, windSetting, pressureSetting, visibilitySetting, autoRefreshSetting, cardsLayoutSetting, iconTypeSetting] = await Promise.all([
        AsyncStorage.getItem('useGeo'),
        AsyncStorage.getItem('unit'),
        AsyncStorage.getItem('windUnit'),
        AsyncStorage.getItem('pressureUnit'),
        AsyncStorage.getItem('visibilityUnit'),
        AsyncStorage.getItem('autoRefreshInterval'),
        AsyncStorage.getItem('cardsLayout'),
        AsyncStorage.getItem('useStaticIcons')
      ]);
  
      setUseGeo(geoSetting !== 'false');
      if (unitSetting) setTempUnit(unitSetting);
      if (windSetting) setWindUnit(windSetting);
      if (pressureSetting) setPressureUnit(pressureSetting);
      if (visibilitySetting) setVisibilityUnit(visibilitySetting);
      if (autoRefreshSetting) setAutoRefreshInterval(autoRefreshSetting);
      if (cardsLayoutSetting) setCardsLayout(cardsLayoutSetting);
      if (iconTypeSetting) setUseStaticIcons(iconTypeSetting === 'true');
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  // Загрузка погодных данных с кэшированием
  const loadWeatherData = async (lat, lon, forceOnline = false) => {
    setLoading(true);
    
    try {
      if (!forceOnline) {
        const cachedData = await loadWeatherFromCache(lat, lon);
        if (cachedData) {
          setWeather(cachedData.weather);
          setForecast(cachedData.forecast);
          setHourlyForecast(cachedData.hourly);
          setDewPoint(cachedData.dewPoint); // Устанавливаем точку росы из кэша
          setIsOffline(true);
          setLoading(false);
          
          if (cachedData.isExpired) {
            console.log('Кэш устарел, попытка обновления...');
            loadWeatherData(lat, lon, true);
          }
          return;
        }
      }
  
      // Получаем все данные параллельно
      const [current, daily, hourlyRaw] = await Promise.all([
        getCurrentWeatherWithDewPoint(lat, lon), // Используем функцию с точкой росы
        getDailyForecast(lat, lon),
        getHourlyForecast(lat, lon),
      ]);
  
      // Если точка росы не получена из API, рассчитываем её
      if (!current.dew_point && current.main?.temp && current.main?.humidity) {
        current.dew_point = calculateDewPoint(current.main.temp, current.main.humidity);
      }
  
      const hourly = hourlyRaw.list.filter(item =>
        new Date(item.dt_txt).toDateString()
      );
  
      // Исправлено: правильно передаем точку росы в функцию сохранения
      await saveWeatherToCache(lat, lon, current, daily, hourly, current.dew_point);
      
      setWeather(current);
      setForecast(daily);
      setHourlyForecast(hourly);
      setDewPoint(current.dew_point); // Устанавливаем точку росы
      setIsOffline(false);
      setLoading(false);
      
      console.log('Данные загружены из API и сохранены в кэш, точка росы:', current.dew_point);
      
      if (forceOnline) {
        showToast('Данные обновлены', 'success');
      }
      
    } catch (error) {
      console.error('Ошибка загрузки погоды:', error);
      
      const cachedData = await loadWeatherFromCache(lat, lon);
      if (cachedData) {
        setWeather(cachedData.weather);
        setForecast(cachedData.forecast);
        setHourlyForecast(cachedData.hourly);
        setDewPoint(cachedData.dewPoint); // Устанавливаем точку росы из кэша
        setIsOffline(true);
        setLoading(false);
        
        showToast('Офлайн режим - данные из кэша', 'warning');
      } else {
        setLoading(false);
        showToast('Ошибка загрузки данных', 'error');
      }
    }
  };
  
  useEffect(() => {
    const loadLifeSectionSetting = async () => {
      try {
        const savedLifeSection = await AsyncStorage.getItem('showLifeSection');
        setShowLifeSection(savedLifeSection !== 'false');
      } catch (error) {
        console.error('Ошибка загрузки настройки секции "Для жизни":', error);
      }
    };
  
    loadLifeSectionSetting();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadLifeSectionSetting = async () => {
        try {
          const savedLifeSection = await AsyncStorage.getItem('showLifeSection');
          setShowLifeSection(savedLifeSection !== 'false');
        } catch (error) {
          console.error('Ошибка загрузки настройки секции "Для жизни":', error);
        }
      };
  
      loadLifeSectionSetting();
    }, [])
  );

  useEffect(() => {
    (async () => {
      await loadSettings();
      await clearOldCache();

      try {
        const saved = await AsyncStorage.getItem('savedCity');
        let lat, lon;

        if (saved) {
          const coords = JSON.parse(saved);
          lat = coords.lat;
          lon = coords.lon;
        } else {
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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSettings();
    });

    return unsubscribe;
  }, [navigation]);

  // Добавьте этот useEffect в HomeScreen после существующего useEffect с navigation.addListener

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      // Загружаем настройки при возвращении на экран
      await loadSettings();
      
      // Проверяем, нужно ли обновить погодные данные
      try {
        const shouldRefresh = await AsyncStorage.getItem('shouldRefreshWeather');
        if (shouldRefresh === 'true') {
          // Удаляем флаг
          await AsyncStorage.removeItem('shouldRefreshWeather');
          
          // Определяем координаты для обновления
          const saved = await AsyncStorage.getItem('savedCity');
          let lat, lon;

          if (saved) {
            const coords = JSON.parse(saved);
            lat = coords.lat;
            lon = coords.lon;
          } else {
            // Используем геолокацию
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const location = await Location.getCurrentPositionAsync({});
              lat = location.coords.latitude;
              lon = location.coords.longitude;
            } else {
              return; // Нет разрешений
            }
          }

          // Принудительно обновляем данные
          await loadWeatherData(lat, lon, true);
        }
      } catch (error) {
        console.error('Ошибка при проверке флага обновления:', error);
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const intervalMinutes = parseInt(autoRefreshInterval);
    const intervalMs = intervalMinutes * 60 * 1000;
  
    console.log(`Настройка автообновления каждые ${intervalMinutes} минут`);
  
    const timer = setInterval(async () => {
      console.log('Выполняется автообновление данных...');
      
      try {
        const saved = await AsyncStorage.getItem('savedCity');
        let lat, lon;
  
        if (saved) {
          const coords = JSON.parse(saved);
          lat = coords.lat;
          lon = coords.lon;
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({});
            lat = location.coords.latitude;
            lon = location.coords.longitude;
          } else {
            return;
          }
        }
  
        await loadWeatherData(lat, lon, true);
        console.log('Автообновление выполнено успешно');
        
      } catch (error) {
        console.error('Ошибка автообновления:', error);
      }
    }, intervalMs);
  
    return () => {
      clearInterval(timer);
      console.log('Таймер автообновления очищен');
    };
  }, [autoRefreshInterval]);

  useEffect(() => {
    const countdownTimer = setInterval(() => {
      const seconds = getTimeUntilNextRefresh();
      setCountdown(seconds);
    }, 1000);
  
    return () => clearInterval(countdownTimer);
  }, [weather, autoRefreshInterval]);

  const getRefreshProgress = () => {
    if (!weather || !weather.dt) return 0;
    
    const lastUpdate = new Date(weather.dt * 1000);
    const intervalMs = parseInt(autoRefreshInterval) * 60 * 1000;
    const totalTime = intervalMs;
    const elapsed = Date.now() - lastUpdate.getTime();
    const progress = Math.min((elapsed / totalTime) * 100, 100);
    
    return Math.max(progress, 0);
  };

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

// Функция для получения интерпретации значений
const getWeatherInterpretation = (type, value, weather) => {
  switch (type) {
    case 'pressure':
      const pressureValue = convertPressure(weather.main.pressure, pressureUnit);
      
      // Адаптивные пороговые значения для разных единиц измерения
      let lowThreshold, highThreshold;
      
      switch (pressureUnit) {
        case 'mmHg':
          lowThreshold = 740;
          highThreshold = 770;
          break;
        case 'hPa':
          lowThreshold = 987;  // 740 mmHg в hPa
          highThreshold = 1027; // 770 mmHg в hPa
          break;
        case 'bar':
          lowThreshold = 0.987;
          highThreshold = 1.027;
          break;
        case 'psi':
          lowThreshold = 14.3;
          highThreshold = 14.9;
          break;
        default:
          lowThreshold = 740;
          highThreshold = 770;
      }
      
      if (pressureValue < lowThreshold) return 'Низкое давление';
      if (pressureValue > highThreshold) return 'Высокое давление';
      return 'Давление в норме';
    
    case 'humidity':
      if (value < 30) return 'Воздух очень сухой';
      if (value < 40) return 'Воздух сухой';
      if (value > 80) return 'Влажность очень высокая';
      if (value > 70) return 'Влажность высокая';
      if (value > 60) return 'Влажность повышенная';
      return 'Влажность нормальная';
    
    case 'wind':
      const windSpeed = convertWindSpeed(weather.wind.speed, windUnit);
      
      // Адаптивные пороговые значения для разных единиц измерения
      let lightThreshold, moderateThreshold, freshThreshold, strongThreshold;
      
      switch (windUnit) {
        case 'm/s':
          lightThreshold = 2;
          moderateThreshold = 5;
          freshThreshold = 10;
          strongThreshold = 15;
          break;
        case 'km/h':
          lightThreshold = 7.2;  // 2 м/с = 7.2 км/ч
          moderateThreshold = 18; // 5 м/с = 18 км/ч
          freshThreshold = 36;    // 10 м/с = 36 км/ч
          strongThreshold = 54;   // 15 м/с = 54 км/ч
          break;
        case 'mph':
          lightThreshold = 4.5;   // 2 м/с = 4.5 mph
          moderateThreshold = 11.2; // 5 м/с = 11.2 mph
          freshThreshold = 22.4;  // 10 м/с = 22.4 mph
          strongThreshold = 33.6; // 15 м/с = 33.6 mph
          break;
        default:
          lightThreshold = 2;
          moderateThreshold = 5;
          freshThreshold = 10;
          strongThreshold = 15;
      }
      
      if (windSpeed < lightThreshold) return 'Штиль';
      if (windSpeed < moderateThreshold) return 'Легкий ветер';
      if (windSpeed < freshThreshold) return 'Умеренный ветер';
      if (windSpeed < strongThreshold) return 'Свежий ветер';
      if (windSpeed < strongThreshold * 1.5) return 'Сильный ветер';
      return 'Очень сильный ветер';
    
    case 'clouds':
      if (value < 10) return 'Ясно';
      if (value < 25) return 'Малооблачно';
      if (value < 50) return 'Переменная облачность';
      if (value < 75) return 'Облачно';
      return 'Пасмурно';
    
    case 'visibility':
      if (!weather.visibility) return 'Видимость хорошая';
      
      const visibility = weather.visibility; // в метрах
      const visibilityConverted = convertVisibility(visibility, visibilityUnit);
      const visibilityValue = parseFloat(visibilityConverted.split(' ')[0]);
      
      // Адаптивные пороговые значения для разных единиц измерения
      let poorThreshold, limitedThreshold, goodThreshold;
      
      switch (visibilityUnit) {
        case 'km':
          poorThreshold = 1;    // 1 км = 1000 м
          limitedThreshold = 5; // 5 км = 5000 м
          goodThreshold = 10;   // 10 км = 10000 м
          break;
        case 'm':
          poorThreshold = 1000;
          limitedThreshold = 5000;
          goodThreshold = 10000;
          break;
        case 'mi':
          poorThreshold = 0.62;  // 1000 м ≈ 0.62 мили
          limitedThreshold = 3.11; // 5000 м ≈ 3.11 мили
          goodThreshold = 6.21;  // 10000 м ≈ 6.21 мили
          break;
        default:
          poorThreshold = 1;
          limitedThreshold = 5;
          goodThreshold = 10;
      }
      
      if (visibilityValue < poorThreshold) return 'Видимость очень плохая';
      if (visibilityValue < limitedThreshold) return 'Видимость ограничена';
      if (visibilityValue < goodThreshold) return 'Видимость хорошая';
      return 'Видимость отличная';
    
    case 'precipitation':
      const prob = parseInt(value);
      if (prob === 0) return 'Осадков не ожидается';
      if (prob < 20) return 'Осадки маловероятны';
      if (prob < 50) return 'Небольшая вероятность осадков';
      if (prob < 70) return 'Возможны осадки';
      if (prob < 90) return 'Осадки ожидаются';
      return 'Осадки неизбежны';
    
    case 'temperature':
      // Добавляем интерпретацию температуры
      const temp = convertTemperature(value, tempUnit);
      const tempSymbol = getTemperatureSymbol(tempUnit);
      
      // Пороговые значения в зависимости от единиц измерения
      let freezingThreshold, coldThreshold, coolThreshold, warmThreshold, hotThreshold;
      
      if (tempUnit === 'imperial') {
        freezingThreshold = 32;  // 0°C = 32°F
        coldThreshold = 50;      // 10°C = 50°F
        coolThreshold = 68;      // 20°C = 68°F
        warmThreshold = 77;      // 25°C = 77°F
        hotThreshold = 86;       // 30°C = 86°F
      } else {
        freezingThreshold = 0;
        coldThreshold = 10;
        coolThreshold = 20;
        warmThreshold = 25;
        hotThreshold = 30;
      }
      
      if (temp < freezingThreshold) return 'Заморозки';
      if (temp < coldThreshold) return 'Холодно';
      if (temp < coolThreshold) return 'Прохладно';
      if (temp < warmThreshold) return 'Комфортно';
      if (temp < hotThreshold) return 'Тепло';
      return 'Жарко';
    
    case 'uv':
      // Добавляем интерпретацию UV индекса
      const uvValue = parseInt(value);
      if (uvValue <= 2) return 'Низкий UV';
      if (uvValue <= 5) return 'Умеренный UV';
      if (uvValue <= 7) return 'Высокий UV';
      if (uvValue <= 10) return 'Очень высокий UV';
      return 'Экстремальный UV';
      
    case 'dew_point':
      if (!value) return 'Данные недоступны';
      
      const tempCelsius = weather.main.temp;
      const dewPointDiff = tempCelsius - value;
      
      if (dewPointDiff < 2) return 'Очень высокая влажность - возможен туман';
      if (dewPointDiff < 5) return 'Высокая влажность - дискомфорт';
      if (dewPointDiff < 10) return 'Умеренная влажность';
      return 'Сухой воздух - комфортно';

    default:
      return '';
  }
};

// Функция для получения цвета индикатора
const getIndicatorColor = (type, value, weather) => {
  switch (type) {
    case 'pressure':
      const pressureValue = convertPressure(weather.main.pressure, pressureUnit);
      if (pressureUnit === 'mmHg') {
        if (pressureValue < 740 || pressureValue > 770) return '#ff8800';
        return '#4CAF50';
      }
      return '#4CAF50';
    
    case 'humidity':
      if (value < 30 || value > 70) return '#ff8800';
      return '#4CAF50';
    
    case 'wind':
      const windSpeed = convertWindSpeed(weather.wind.speed, windUnit);
      if (windSpeed > 15) return '#ff4444';
      if (windSpeed > 10) return '#ff8800';
      return '#4CAF50';
    
    case 'clouds':
      if (value > 70) return '#666';
      if (value > 30) return '#ff8800';
      return '#4CAF50';
    
    case 'precipitation':
      const prob = parseInt(value);
      if (prob > 70) return '#2196F3';
      if (prob > 30) return '#ff8800';
      return '#4CAF50';

    case 'uv':
      const uvValue = parseInt(value) || 0;
      if (uvValue <= 2) return '#4CAF50';
      if (uvValue <= 5) return '#FFC107';
      if (uvValue <= 7) return '#FF9800';
      if (uvValue <= 10) return '#f44336';
      return '#9C27B0'; // Экстремальный UV

    case 'dew_point':
      if (!value || !weather?.main?.temp) return '#999';
      
      const tempCelsius = weather.main.temp;
      const dewPointDiff = tempCelsius - value;
      
      if (dewPointDiff < 2) return '#2196F3'; // Высокая влажность - синий
      if (dewPointDiff < 5) return '#FF9800'; // Умеренная влажность - оранжевый
      if (dewPointDiff < 10) return '#4CAF50'; // Комфортно - зеленый
      return '#FFC107'; // Сухо - желтый

    default:
      return '#4CAF50';
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
        <View style={styles.loadingOverlay}>
          <LottieView
            source={require('../assets/lottie/weather-welcome.json')}
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

  // Данные для карточек
// Данные для карточек
const weatherCards = [
  {
    id: 'wind',
    icon: 'wind',
    title: 'Ветер',
    value: `${convertWindSpeed(weather.wind.speed, windUnit).toFixed(1)} ${getWindSpeedUnit(windUnit)}`,
    subtitle: getWindDirection(weather.wind.deg),
    interpretation: getWeatherInterpretation('wind', weather.wind.speed, weather),
    color: getIndicatorColor('wind', weather.wind.speed, weather)
  },
  {
    id: 'humidity',
    icon: 'droplet',
    title: 'Влажность',
    value: `${weather.main.humidity}%`,
    subtitle: 'Относительная влажность',
    interpretation: getWeatherInterpretation('humidity', weather.main.humidity, weather),
    color: getIndicatorColor('humidity', weather.main.humidity, weather)
  },
  {
    id: 'dew_point',
    icon: 'water',
    title: 'Точка росы',
    value: dewPoint ? `${Math.round(convertTemperature(dewPoint, tempUnit))}${getTemperatureSymbol(tempUnit)}` : 'Н/Д',
    subtitle: 'Температура конденсации',
    interpretation: getWeatherInterpretation('dew_point', dewPoint, weather),
    color: getIndicatorColor('dew_point', dewPoint, weather)
  },
  {
    id: 'pressure',
    icon: 'thermometer',
    title: 'Давление',
    value: `${convertPressure(weather.main.pressure, pressureUnit)} ${getPressureUnitLabel(pressureUnit)}`,
    subtitle: 'Атмосферное давление',
    interpretation: getWeatherInterpretation('pressure', weather.main.pressure, weather),
    color: getIndicatorColor('pressure', weather.main.pressure, weather)
  },
  {
    id: 'clouds',
    icon: 'cloud',
    title: 'Облачность',
    value: `${weather.clouds?.all || 0}%`,
    subtitle: 'Покрытие неба облаками',
    interpretation: getWeatherInterpretation('clouds', weather.clouds?.all || 0, weather),
    color: getIndicatorColor('clouds', weather.clouds?.all || 0, weather)
  },
  {
    id: 'uv',
    icon: 'sun',
    title: 'UV индекс',
    value: weather.uv_index !== undefined ? `${weather.uv_index}/11` : 'Н/Д',
    subtitle: 'Ультрафиолетовое излучение',
    interpretation: getWeatherInterpretation('uv', weather.uv_index || 0, weather),
    color: getIndicatorColor('uv', weather.uv_index || 0, weather)
  },
  {
    id: 'sunrise',
    icon: 'sunrise',
    title: 'Рассвет',
    value: new Date(weather.sys.sunrise * 1000).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    subtitle: 'Восход солнца',
    interpretation: 'Начало светового дня',
    color: '#FF9800'
  },
  {
    id: 'sunset',
    icon: 'sunset',
    title: 'Закат',
    value: new Date(weather.sys.sunset * 1000).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    subtitle: 'Заход солнца',
    interpretation: 'Конец светового дня',
    color: '#FF5722'
  },
  {
    id: 'visibility',
    icon: 'eye',
    title: 'Видимость',
    value: convertVisibility(weather.visibility, visibilityUnit),
    subtitle: 'Дальность видимости',
    interpretation: getWeatherInterpretation('visibility', weather.visibility, weather),
    color: getIndicatorColor('visibility', weather.visibility, weather)
  },
  {
    id: 'precipitation',
    icon: 'umbrella',
    title: 'Осадки',
    value: getPrecipitationProbability(weather, hourlyForecast),
    subtitle: 'Вероятность осадков',
    interpretation: getWeatherInterpretation('precipitation', getPrecipitationProbability(weather, hourlyForecast), weather),
    color: getIndicatorColor('precipitation', getPrecipitationProbability(weather, hourlyForecast), weather)
  }
];
  

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
          <View style={styles.searchContainer}>
            {/* Кнопка настроек */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Settings')} 
              style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
            >
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="settings" size={24} color={iconColor} />
              </View>
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
              style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
            >
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="search" size={24} color={iconColor} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Подсказки городов */}
          {showSearch && searchResults.length > 0 && (
            <View style={[
              styles.suggestionList,
              { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5' }
            ]}>
              {useGeo && (
                <TouchableOpacity
                  onPress={async () => {
                    setShowSearch(false);
                    setSearchCity('');
                    setSearchResults([]);

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
                  <View style={styles.suggestionContent}>
                    <Ionicons name="location-outline" size={16} color={textColor} />
                    <Text style={[styles.suggestionText, { color: textColor, fontWeight: 'bold' }]}>
                      Использовать геолокацию
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {searchResults.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={async () => {
                    setShowSearch(false);
                    // setSearchCity(`${(item.local_names?.ru || item.name)}, ${countries.getName(item.country, 'ru') || item.country}`);
                    setSearchCity('');
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
                  <Text style={[styles.suggestionText, { color: textColor }]}>
                    {(item.local_names?.ru || item.name)}
                    {item.state ? `, ${item.state}` : ''}, 
                    {countries.getName(item.country, 'ru') || item.country}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Заголовок с городом */}
          <View style={styles.header}>
            <Text style={[styles.city, { color: textColor }]}>{weather.name}</Text>
            <Text style={[styles.country, { color: secondaryTextColor }]}>
              {countries.getName(weather.sys.country, 'ru') || weather.sys.country}
            </Text>
          </View>

          {/* Основная информация о погоде */}
          <View style={styles.weatherMainContainer}>
            {/* Кнопка обновления */}
            <View style={styles.refreshButtonContainer}>
              <TouchableOpacity 
                onPress={refreshWeatherData} 
                style={[styles.refreshButton, { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' 
                }]}
              >
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="refresh-outline" size={24} color={iconColor} />
                </View>
                {isOffline && <View style={styles.offlineDot} />}
              </TouchableOpacity>
            </View>

            {/* Центральная часть с анимацией и температурой */}
            <View style={styles.weatherMainContent}>
              <WeatherIcon
                weatherMain={weather.weather[0].main}
                weatherDescription={weather.weather[0].description}
                style={styles.weatherAnimation}
                width={160}
                height={160}
                useStaticIcons={useStaticIcons}
              />
              <Text style={[styles.temp, { color: textColor }]}>
                {Math.round(convertTemperature(weather.main.temp, tempUnit))}{getTemperatureSymbol(tempUnit)}
              </Text>
              <Text style={[styles.description, { color: secondaryTextColor }]}>
                {weather.weather[0].description}
              </Text>
              
              {/* Информация о времени дня */}
              <View style={styles.timeInfoContainer}>
              <Text style={[styles.lastUpdateText, { color: secondaryTextColor }]}>
                Обновлено {getLastUpdateTime(weather)}
              </Text>
              {/* <CompactVpnBanner isDark={isDark} /> */}
            </View>
            </View>

            {/* Кнопка информации */}
            <View style={styles.infoButtonContainer}>
              <TouchableOpacity 
                onPress={() => 
                  Alert.alert(
                    "Источник данных", 
                    "Данные о погоде предоставляются бесплатным API OpenWeatherMap 2.5: " + "https://openweathermap.org/" + "\n\n" +
                    "Индекс UV предоставляется отдельным бесплатным API WeatherAPI: " + "https://www.weatherapi.com/" + "\n\n" +
                    "Пожалуйста, учитывайте, что данные могут быть неточными и отличаться от реальных условий.",
                    [
                      {
                        text: "OK",
                        style: "default"
                      }
                    ]
                  )
                } 
                style={[styles.infoButton, { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' 
                }]}
              >
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="information-circle-outline" size={24} color={iconColor} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

{/* Детали погоды */}
<View style={styles.detailsSection}>
  <Text style={[styles.sectionTitle, { color: textColor }]}>
    Детали погоды
  </Text>
  
  {cardsLayout === 'compact' ? (
    // Компактный блок со всеми параметрами в сетке 5×2
    <BlurView intensity={40} style={[
      styles.detailsContainer,
      { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
    ]}>
      <View style={styles.compactGrid}>
        {weatherCards.map((item) => (
          <View key={item.id} style={styles.detailItem}>
            {renderWeatherIcon(item.id, 24)}
            <Text 
              style={[styles.detailTitle, { color: textColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {item.title}
            </Text>
            <Text 
              style={[styles.detailText, { color: textColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </BlurView>
  ) : cardsLayout === 'grid' ? (
    // Сетка 2x4
    <View style={styles.weatherCardsGrid}>
      {weatherCards.map((item) => (
        <BlurView 
          key={item.id}
          intensity={40} 
          style={[
            styles.weatherCardGrid,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]}
        >
          {/* Верхняя секция - название и иконка */}
          <View style={styles.cardTopSection}>
            <View style={styles.cardLeftSection}>
              <Text style={[styles.cardTitle, { color: textColor }]}>
                {item.title}
              </Text>
              <Text style={[styles.cardValue, { color: textColor }]}>
                {item.value}
              </Text>
              {/* Дополнительная информация (subtitle) */}
              {item.subtitle && (
                <Text style={[styles.cardSubtitleText, { color: secondaryTextColor }]}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            
            <View style={styles.cardIconWrapper}>
              {renderWeatherIcon(item.id, 38)}
            </View>
          </View>
          
          {/* Нижняя секция - интерпретация по центру */}
          <View style={styles.cardBottomSection}>
            <Text style={[styles.cardInterpretation, { color: secondaryTextColor }]}>
              {item.interpretation}
            </Text>
          </View>
        </BlurView>
      ))}
    </View>
  ) : cardsLayout === 'horizontal_grid' ? (
    // Сетка 4x2 с горизонтальной прокруткой
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.weatherCardsHorizontalGrid}>
        {weatherCards.map((item) => (
          <BlurView 
            key={item.id}
            intensity={40} 
            style={[
              styles.weatherCardHorizontalGrid,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
            ]}
          >
            {/* Верхняя секция - название и иконка */}
            <View style={styles.cardTopSection}>
              <View style={styles.cardLeftSection}>
                <Text style={[styles.cardTitle, { color: textColor }]}>
                  {item.title}
                </Text>
                <Text style={[styles.cardValue, { color: textColor }]}>
                  {item.value}
                </Text>
                {/* Дополнительная информация (subtitle) */}
                {item.subtitle && (
                  <Text style={[styles.cardSubtitleText, { color: secondaryTextColor }]}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
              
              <View style={styles.cardIconWrapper}>
                {renderWeatherIcon(item.id, 38)}
              </View>
            </View>
            
            {/* Нижняя секция - интерпретация по центру */}
            <View style={styles.cardBottomSection}>
              <Text style={[styles.cardInterpretation, { color: secondaryTextColor }]}>
                {item.interpretation}
              </Text>
            </View>
          </BlurView>
        ))}
      </View>
    </ScrollView>
  ) : (
    // Горизонтальная прокрутка 1x8
    <FlatList
      data={weatherCards}
      horizontal
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.weatherCardsList}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <BlurView intensity={40} style={[
          styles.weatherCardHorizontal,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
        ]}>
          {/* Верхняя секция - название и иконка */}
          <View style={styles.cardTopSection}>
            <View style={styles.cardLeftSection}>
              <Text style={[styles.cardTitle, { color: textColor }]}>
                {item.title}
              </Text>
              <Text style={[styles.cardValue, { color: textColor }]}>
                {item.value}
              </Text>
              {/* Дополнительная информация (subtitle) */}
              {item.subtitle && (
                <Text style={[styles.cardSubtitleText, { color: secondaryTextColor }]}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            
            <View style={styles.cardIconWrapper}>
              {renderWeatherIcon(item.id, 38)}
            </View>
          </View>
          
          {/* Нижняя секция - интерпретация по центру */}
          <View style={styles.cardBottomSection}>
            <Text style={[styles.cardInterpretation, { color: secondaryTextColor }]}>
              {item.interpretation}
            </Text>
          </View>
        </BlurView>
      )}
    />
  )}
</View>

          {/* Почасовой прогноз */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Почасовой прогноз
            </Text>
            <View style={styles.forecastContainer}>
              <FlatList
                data={hourlyForecast.slice(0, 8)}
                horizontal
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.forecastList}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={[
                    styles.forecastCard,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }
                  ]}>
                    <Text style={[styles.forecastDay, { color: textColor }]}>
                      {new Date(item.dt_txt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                      <WeatherIcon
                        weatherMain={item.weather[0].main}
                        weatherDescription={item.weather[0].description}
                        style={styles.forecastAnimation}
                        width={90}
                        height={90}
                        useStaticIcons={useStaticIcons}
                      />
                    <Text style={[styles.forecastDescription, { color: secondaryTextColor }]}>
                      {item.weather[0].description}
                    </Text>
                    <Text style={[styles.forecastTemp, { color: textColor }]}>
                      {Math.round(convertTemperature(item.main.temp, tempUnit))}{getTemperatureSymbol(tempUnit)}
                    </Text>
                  </View>
                )}
              />
            </View>
          </View>

          {/* Прогноз на 5 дней */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Прогноз на 5 дней
            </Text>
            <View style={styles.dailyForecastContainer}>
              {forecast.map((item, index) => (
                <View key={index} style={[
                  styles.dailyForecastCard,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }
                ]}>
                  <View style={styles.dailyForecastLeft}>
                    <Text style={[styles.dailyForecastDate, { color: textColor }]}>
                      {new Date(item.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </Text>
                    <Text style={[styles.dailyForecastDay, { color: secondaryTextColor }]}>
                      {new Date(item.date).toLocaleDateString('ru-RU', {
                        weekday: 'long',
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.dailyForecastCenter}>
                    <WeatherIcon
                      weatherMain={item.main}
                      weatherDescription={item.description}
                      style={styles.dailyForecastAnimation}
                      width={50}
                      height={50}
                      useStaticIcons={useStaticIcons}
                    />
                  </View>
                  
                  <View style={styles.dailyForecastRight}>
                    {/* Блок с дневной температурой */}
                    <View style={styles.tempBlock}>
                      <Text style={[styles.tempLabel, { color: secondaryTextColor }]}>
                        День
                      </Text>
                      <Text style={[styles.dailyForecastDayTemp, { color: textColor }]}>
                        {Math.round(convertTemperature(item.temp, tempUnit))}°
                      </Text>
                    </View>
                    
                    {/* Блок с ночной температурой */}
                    <View style={styles.tempBlock}>
                      <Text style={[styles.tempLabel, { color: secondaryTextColor }]}>
                        Ночь
                      </Text>
                      <Text style={[styles.dailyForecastNightTemp, { color: secondaryTextColor }]}>
                        {Math.round(convertTemperature(item.nightTemp, tempUnit))}°
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Прогноз для жизни */}
                  {showLifeSection && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Для жизни
            </Text>
            <View style={styles.lifeCardsContainer}>
              <FlatList
                data={[
                  { 
                    id: 'allergy', 
                    icon: require('../assets/icons/allergy.png'), 
                    title: 'Аллергия', 
                    color: '#FF9800' 
                  },
                  { 
                    id: 'driving', 
                    icon: require('../assets/icons/driving.png'), 
                    title: 'На дорогах', 
                    color: '#2196F3' 
                  },
                  { 
                    id: 'fishing', 
                    icon: require('../assets/icons/fishing.png'), 
                    title: 'Рыбалка', 
                    color: '#00BCD4' 
                  },
                  { 
                    id: 'water_recreation', 
                    icon: require('../assets/icons/swimming.png'), 
                    title: 'Отдых у воды', 
                    color: '#03A9F4' 
                  },
                  { 
                    id: 'gardening', 
                    icon: require('../assets/icons/gardening.png'), 
                    title: 'Сад и огород', 
                    color: '#4CAF50' 
                  },
                  { 
                    id: 'running', 
                    icon: require('../assets/icons/running.png'), 
                    title: 'Бег', 
                    color: '#F44336' 
                  },
                ]}
                horizontal
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.lifeCardsList}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.lifeCard,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                    ]}
                    onPress={() => navigation.navigate('LifeActivity', { 
                      activityType: item.id, 
                      title: item.title,
                      color: item.color,
                      weather: weather,
                      forecast: forecast,
                      hourlyForecast: hourlyForecast,
                      uvIndex: weather.uv_index || 0,
                      dewPoint: dewPoint,
                      tempUnit: tempUnit,
                      windUnit: windUnit,
                      pressureUnit: pressureUnit,
                      visibilityUnit: visibilityUnit
                    })}
                  >
                    <View style={[styles.lifeCardIcon, { backgroundColor: item.color }]}>
                      <Image 
                        source={item.icon} 
                        style={styles.lifeCardIconImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={[styles.lifeCardTitle, { color: textColor }]}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        )}

  {/* Виджет карты осадков */}
  <LazyMapWidget 
    weather={weather}
    isDark={isDark}
    textColor={textColor}
    secondaryTextColor={secondaryTextColor}
    countries={countries}
    navigation={navigation}
  />

        </ScrollView>

        {/* Toast уведомление */}
        {toastVisible && (
          <View style={[
            styles.toastContainer, 
            { backgroundColor: getToastColor(toastType, isDark) }
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
  // Базовые контейнеры
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
    gap: 20,
    paddingBottom: 60,
  },

  // Поиск и заголовок
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    gap: 10,
    position: 'relative',
    zIndex: 100,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    // Добавляем эти свойства для точного центрирования
    display: 'flex',
    flexDirection: 'row', // Важно для некоторых иконок
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 20,
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
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionText: {
    fontSize: 14,
  },

  // Заголовок
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  city: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  country: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 2,
  },

  // Основная погодная информация
  weatherMainContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  infoButtonContainer: {
    width: 0,
    alignItems: 'flex-end',
    paddingTop: 20,
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    // Добавляем эти свойства для точного центрирования
    display: 'flex',
    flexDirection: 'row', // Важно для некоторых иконок
  },
  refreshButtonContainer: {
    width: 0,
    alignItems: 'flex-start',
    paddingTop: 20,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    // Добавляем эти свойства для точного центрирования
    display: 'flex',
    flexDirection: 'row', // Важно для некоторых иконок
  },
  weatherMainContent: {
    flex: 1,
    alignItems: 'center',
  },
  weatherAnimation: {
    width: 160,
    height: 160,
  },
  temp: {
    fontSize: 60,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: -10,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    textTransform: 'capitalize',
    marginTop: -10,
  },

  // Контейнер для информации о времени
  timeInfoContainer: {
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
    gap: 8,
  },
  dayPeriodText: {
    fontSize: 18,
    textAlign: 'center',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  updateInfoContainer: {
    alignItems: 'center',
    gap: 4,
  },
  lastUpdateText: {
    fontSize: 12,
    textAlign: 'center',
  },
  nextUpdateText: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Дополнительные стили для версии с прогресс-баром:
countdownContainer: {
  alignItems: 'center',
  gap: 6,
},
progressBarContainer: {
  marginTop: 4,
},
progressBar: {
  width: 80,
  height: 2.5,
  borderRadius: 1.25,
  overflow: 'hidden',
},
progressBarFill: {
  height: '100%',
  borderRadius: 1.25,
},

  // Детали погоды
  detailsSection: {
    gap: 15,
  },

  // Горизонтальная прокрутка (оригинальные стили)
  weatherCardsList: {
    paddingHorizontal: 15,
    gap: 10,
  },
  weatherCardHorizontal: {
    width: 160,
    minHeight: 150,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },

  // Сетка 2x4
  weatherCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 15,
  },
  weatherCardGrid: {
    width: '48%', // Чуть меньше 50% для учета gap
    minHeight: 150,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },

  // Сетка 4x2 с горизонтальной прокруткой
  weatherCardsHorizontalGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    height: 320, // Высота для 2 рядов карточек
    paddingHorizontal: 15,
    gap: 10,
  },
  weatherCardHorizontalGrid: {
    width: 160, // Фиксированная ширина для горизонтального скролла
    height: 150,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 0, // Отступ между колонками
  },

  // Общие стили для карточек
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
  },
  cardLeftSection: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  cardIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardSubtitleText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 13,
  },
  cardBottomSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  cardInterpretation: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 13,
    textAlign: 'center',
  },

  // Секции прогнозов
  sectionContainer: {
    gap: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Прогноз на 5 дней (новый стиль)
  dailyForecastContainer: {
    paddingHorizontal: 15,
    gap: 12,
  },
  dailyForecastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  dailyForecastLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  dailyForecastDate: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dailyForecastDay: {
    fontSize: 14,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  dailyForecastCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  dailyForecastAnimation: {
    width: 50,
    height: 50,
  },
  dailyForecastRight: {
    minWidth: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  tempBlock: {
    alignItems: 'center',
  },
  tempLabel: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  dailyForecastDayTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dailyForecastNightTemp: {
    fontSize: 18,
    textAlign: 'center',
  },

  // Прогноз
  forecastContainer: {
    minHeight: 180,
  },
  forecastList: {
    paddingHorizontal: 15,
    gap: 10,
    alignItems: 'flex-start',
  },
  forecastCard: {
    alignItems: 'center',
    borderRadius: 15,
    padding: 8,
    width: 110,
    minHeight: 160,
  },
  forecastDay: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  forecastAnimation: {
    width: 90,
    height: 90,
  },
  forecastDescription: {
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'capitalize',
    marginVertical: 5,
    lineHeight: 16,
    minHeight: 32,
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },

  // Индикаторы и уведомления
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
    top: 50,
    left: '20%',
    right: '20%',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1000,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },

  // Загрузка
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    zIndex: 500,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingAnimation: {
    width: 160,
    height: 160,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Карточки для жизни
  lifeCardsContainer: {
    minHeight: 130,
  },
  lifeCardsList: {
    paddingHorizontal: 15,
    gap: 10,
    alignItems: 'flex-start',
  },
  lifeCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    width: 110,
    minHeight: 130,
    gap: 10,
  },
  lifeCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lifeCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },

  lifeCardIconImage: {
    width: 28,
    height: 28,
    tintColor: '#fff', // Делает иконку белой
  },
  activityIconImage: {
    width: 24,
    height: 24,
    tintColor: '#fff', // Делает иконку белой
  },

  // Виджет карты
// Виджет карты
MapContainer: {
  minHeight: 270,
},
mapWidget: {
  marginHorizontal: 15,
  borderRadius: 20,
  padding: 20,
  overflow: 'hidden',
},
mapWidgetHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15,
},
mapWidgetTitleContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},
mapWidgetTitle: {
  fontSize: 18,
  fontWeight: '600',
},
mapWidgetPreview: {
  height: 120,
  borderRadius: 12,
  overflow: 'hidden',
  marginBottom: 15,
  position: 'relative',
},
// Оверлей поверх карты
mapOverlay: {
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 1000,
},
weatherBadge: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 8,
  backdropFilter: 'blur(10px)',
},
weatherBadgeText: {
  fontSize: 12,
  fontWeight: '600',
},
mapWidgetInfo: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
mapInfoItem: {
  flexDirection: 'col',
  alignItems: 'center',
  gap: 4,
},
mapInfoText: {
  fontSize: 12,
  fontWeight: '500',
},

// Стили для компактного блока
detailsContainer: {
  marginHorizontal: 15,
  paddingVertical: 20,
  paddingHorizontal: 15,
  borderRadius: 20,
  overflow: 'hidden',
},
compactGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-around',
  alignItems: 'flex-start',
  rowGap: 20,
  columnGap: 5,
},
detailItem: {
  width: '23%', // 4 элемента в ряду с промежутками
  minWidth: 65,
  alignItems: 'center',
  gap: 6,
},
detailTitle: {
  fontSize: 10,
  fontWeight: '600',
  textAlign: 'center',
  opacity: 0.8,
},
detailText: {
  fontSize: 12,
  fontWeight: '500',
  textAlign: 'center',
},
// Убираем неиспользуемые стили
// mapPreviewBackground, mapGrid, mapGridLine, precipitationDot, locationMarker, locationDot, locationPulse - больше не нужны
});