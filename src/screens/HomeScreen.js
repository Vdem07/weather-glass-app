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
        const maxAge = 30 * 60 * 1000;

        console.log(`Найден кэш, возраст: ${Math.round(cacheAge / 1000 / 60)} минут`);
        
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
      const [geoSetting, unitSetting, windSetting, pressureSetting] = await Promise.all([
        AsyncStorage.getItem('useGeo'),
        AsyncStorage.getItem('unit'),
        AsyncStorage.getItem('windUnit'),
        AsyncStorage.getItem('pressureUnit')
      ]);
  
      setUseGeo(geoSetting !== 'false');
      if (unitSetting) setTempUnit(unitSetting);
      if (windSetting) setWindUnit(windSetting);
      if (pressureSetting) setPressureUnit(pressureSetting);
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
          setIsOffline(true);
          setLoading(false);
          
          if (cachedData.isExpired) {
            console.log('Кэш устарел, попытка обновления...');
            loadWeatherData(lat, lon, true);
          }
          return;
        }
      }
  
      const current = await getCurrentWeather(lat, lon);
      const daily = await getDailyForecast(lat, lon);
      const hourlyRaw = await getHourlyForecast(lat, lon);
  
      // const today = new Date().toDateString();
      const hourly = hourlyRaw.list.filter(item =>
        new Date(item.dt_txt).toDateString()
      );
  
      await saveWeatherToCache(lat, lon, current, daily, hourly);
      
      setWeather(current);
      setForecast(daily);
      setHourlyForecast(hourly);
      setIsOffline(false);
      setLoading(false);
      
      console.log('Данные загружены из API и сохранены в кэш');
      
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
              <LottieView
                source={animation}
                autoPlay
                loop
                style={styles.weatherAnimation}
              />
              <Text style={[styles.temp, { color: textColor }]}>
                {Math.round(convertTemperature(weather.main.temp, tempUnit))}{getTemperatureSymbol(tempUnit)}
              </Text>
              <Text style={[styles.description, { color: secondaryTextColor }]}>
                {weather.weather[0].description}
              </Text>
            </View>

            {/* Кнопка информации */}
            <View style={styles.infoButtonContainer}>
              <TouchableOpacity 
                onPress={() => 
                  Alert.alert(
                    "Источник данных", 
                    "Данные о погоде предоставляются бесплатным API OpenWeatherMap 2.5",
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
          <BlurView intensity={40} style={[
            styles.detailsContainer,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
          ]}>
            <View style={styles.detailItem}>
              <Feather name="wind" size={20} color={iconColor} />
              <Text style={[styles.detailText, { color: textColor }]}>
                {convertWindSpeed(weather.wind.speed, windUnit).toFixed(1)} {getWindSpeedUnit(windUnit)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="droplet" size={20} color={iconColor} />
              <Text style={[styles.detailText, { color: textColor }]}>{weather.main.humidity}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="thermometer" size={20} color={iconColor} />
              <Text 
                style={[styles.detailText, { color: textColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
              >
                {convertPressure(weather.main.pressure, pressureUnit)} {getPressureUnitLabel(pressureUnit)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="sun" size={20} color={iconColor} />
              <Text style={[styles.detailText, { color: textColor }]}>
                {new Date(weather.sys.sunrise * 1000).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </BlurView>

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
                    <LottieView
                      source={getWeatherAnimation(item.weather[0].main, item.weather[0].description)}
                      autoPlay
                      loop
                      style={styles.forecastAnimation}
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
                    <LottieView
                      source={getWeatherAnimation(item.main, item.description)}
                      autoPlay
                      loop
                      style={styles.dailyForecastAnimation}
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
    paddingBottom: 50,
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

  // Детали погоды
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
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
});