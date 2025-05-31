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
  const [activeTab, setActiveTab] = useState('daily');
  const [showSearch, setShowSearch] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isOffline, setIsOffline] = useState(false);

  // Состояния для настроек
  const [useGeo, setUseGeo] = useState(true);
  const [tempUnit, setTempUnit] = useState('metric');
  const [windUnit, setWindUnit] = useState('m/s');

  // Цвета для адаптации под тему
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const placeholderColor = isDark ? 'lightgray' : '#999';
  const iconColor = isDark ? '#fff' : '#333';
  const borderColor = isDark ? '#fff' : '#333';

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
          const maxAge = 24 * 60 * 60 * 1000; // 24 часа
          
          if (cacheAge > maxAge) {
            await AsyncStorage.removeItem(key);
            console.log(`Удален старый кэш: ${key}`);
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
      const [geoSetting, unitSetting, windSetting] = await Promise.all([
        AsyncStorage.getItem('useGeo'),
        AsyncStorage.getItem('unit'),
        AsyncStorage.getItem('windUnit')
      ]);

      setUseGeo(geoSetting !== 'false');
      if (unitSetting) setTempUnit(unitSetting);
      if (windSetting) setWindUnit(windSetting);
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
        
        Alert.alert(
          'Нет подключения к интернету',
          'Показаны кэшированные данные. Для обновления подключитесь к интернету.',
          [{ text: 'OK' }]
        );
      } else {
        setLoading(false);
        Alert.alert(
          'Ошибка',
          'Не удалось загрузить данные о погоде. Проверьте подключение к интернету.',
          [{ text: 'OK' }]
        );
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
      <View style={[styles.centered, { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#333'} />
        <Text style={[styles.loadingText, { color: textColor }]}>
          Загрузка погоды...
        </Text>
      </View>
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
        <View style={styles.container}>


          {/* Поисковая строка и кнопки */}
          <View style={styles.searchContainer}>
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
              { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5'}
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
              <Text style={[styles.city, { color: textColor }]}>{weather.name}</Text>
              <Text style={[styles.country, { color: secondaryTextColor }]}>
                {countries.getName(weather.sys.country, 'ru') || weather.sys.country}
              </Text>
            </View>
          </View>

          {/* Анимация + температура */}
          <View style={styles.weatherMain}>
            <LottieView
              source={animation}
              autoPlay
              loop
              style={{ width: 160, height: 160 }}
            />
            <Text style={[styles.temp, { color: textColor }]}>
              {Math.round(convertTemperature(weather.main.temp, tempUnit))}{getTemperatureSymbol(tempUnit)}
            </Text>
            <Text style={[styles.description, { color: secondaryTextColor }]}>
              {weather.weather[0].description}
            </Text>
          </View>

          {/* Детали */}
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
              <Feather name="sun" size={20} color={iconColor} />
              <Text style={[styles.detailText, { color: textColor }]}>
                {new Date(weather.sys.sunrise * 1000).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </BlurView>

          {/* Переключатели вкладок */}
          <View style={styles.tabRow}>
            <TouchableOpacity onPress={() => setActiveTab('daily')}>
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'daily' ? textColor : secondaryTextColor },
                activeTab === 'daily' && {
                  ...styles.tabActive,
                  borderColor: borderColor,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                }
              ]}>
                Погода на неделю
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('hourly')}>
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'hourly' ? textColor : secondaryTextColor },
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

          {activeTab === 'daily' ? (
            <FlatList
              data={forecast}
              horizontal
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[
                  styles.dailyCard,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }
                ]}>
                  <Text style={[styles.day, { color: textColor }]}>
                    {new Date(item.date).toLocaleDateString('ru-RU', {
                      weekday: 'short',
                    })}
                  </Text>
                  <LottieView
                    source={getWeatherAnimation(item.main, item.description)}
                    autoPlay
                    loop
                    style={{ width: 90, height: 90 }}
                  />
                  <Text style={[styles.weatherStatus, { color: secondaryTextColor }]}>
                    {item.description}
                  </Text>
                  <Text style={[styles.dayTemp, { color: textColor }]}>
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
              contentContainerStyle={{ paddingHorizontal: 10 }}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[
                  styles.dailyCard,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }
                ]}>
                  <Text style={[styles.day, { color: textColor }]}>
                    {new Date(item.dt_txt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <LottieView
                    source={getWeatherAnimation(item.weather[0].main, item.weather[0].description)}
                    autoPlay
                    loop
                    style={{ width: 90, height: 90 }}
                  />
                  <Text style={[styles.weatherStatus, { color: secondaryTextColor }]}>
                    {item.weather[0].description}
                  </Text>
                  <Text style={[styles.dayTemp, { color: textColor }]}>
                    {Math.round(convertTemperature(item.main.temp, tempUnit))}{getTemperatureSymbol(tempUnit)}
                  </Text>
                </View>
              )}
            />
          )}
        </View>

{/* Индикатор офлайн режима */}
{isOffline && (
            <View style={[styles.offlineIndicator, { backgroundColor: isDark ? 'rgba(255,165,0,0.2)' : 'rgba(255,165,0,0.1)' }]}>
              <TouchableOpacity onPress={refreshWeatherData} style={styles.refreshButton}>
                <Ionicons name="refresh-outline" size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>
          )}
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  blurOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingBottom: 35,
  },
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 10,
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
    top: 160,
    left: 20,
    padding: 10,
    borderRadius: 999,
  },
  offlineText: {
    fontSize: 14,
    marginLeft: 6,
    marginRight: 8,
  },
  refreshButton: {
    padding: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  city: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  country: {
    fontSize: 16,
    marginTop: -4,
    textAlign: 'center',
  },
  weatherMain: {
    alignItems: 'center',
    marginTop: 20,
  },
  temp: {
    fontSize: 60,
    fontWeight: 'bold',
    marginTop: -10,
  },
  description: {
    fontSize: 18,
    marginTop: -10,
    textTransform: 'capitalize',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    marginHorizontal: 10,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 15,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailText: {
    marginTop: 5,
    fontSize: 14,
  },
  dailyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
  },
  dailyCard: {
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    marginRight: 10,
    width: 110,
    minHeight: 60,
    marginLeft: -1.5,
  },
  weatherStatus: {
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'capitalize',
    marginTop: 2,
    marginBottom: 2,
    minHeight: 36,
  },
  day: {
    fontSize: 16,
    textTransform: 'capitalize',
  },
  dayTemp: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    marginBottom: 10,
  },
  tabText: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabActive: {
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
    borderRadius: 30,
    paddingHorizontal: 10,
    marginHorizontal: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    paddingHorizontal: 10,
    marginHorizontal: 10,
  },
  searchButton: {
    padding: 10,
    borderRadius: 999,
  },
  settingsButton: {
    padding: 10,
    borderRadius: 999,
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
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
});