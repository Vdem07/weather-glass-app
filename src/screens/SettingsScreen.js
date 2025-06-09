import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import {
  Switch,
  Text,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useThemeContext } from '../theme/ThemeContext';
import * as Location from 'expo-location';
import { searchCityByName, getCurrentWeather } from '../api/weather';

import countries from 'i18n-iso-countries';
import ruLocale from 'i18n-iso-countries/langs/ru.json';

countries.registerLocale(ruLocale);

export default function SettingsScreen({ navigation }) {
  const { isDark, toggleTheme } = useThemeContext();
  const [useGeo, setUseGeo] = useState(true);
  const [city, setCity] = useState('');
  const [unit, setUnit] = useState('metric');
  const [windUnit, setWindUnit] = useState('m/s');
  const [pressureUnit, setPressureUnit] = useState('mmHg');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showWindDropdown, setShowWindDropdown] = useState(false);
  const [showPressureDropdown, setShowPressureDropdown] = useState(false);
  
  // Новые состояния для города
  const [currentCity, setCurrentCity] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    (async () => {
      const geo = await AsyncStorage.getItem('useGeo');
      const citySaved = await AsyncStorage.getItem('city');
      const savedUnit = await AsyncStorage.getItem('unit');
      const savedWind = await AsyncStorage.getItem('windUnit');
      const savedPressure = await AsyncStorage.getItem('pressureUnit');

      setUseGeo(geo !== 'false');
      if (citySaved) setCity(citySaved);
      if (savedUnit) setUnit(savedUnit);
      if (savedWind) setWindUnit(savedWind);
      if (savedPressure) setPressureUnit(savedPressure);

      // Загружаем текущий город
      await loadCurrentCity();
    })();
  }, []);

  const loadCurrentCity = async () => {
    try {
      const savedCity = await AsyncStorage.getItem('savedCity');
      if (savedCity) {
        const coords = JSON.parse(savedCity);
        // Получаем информацию о городе по координатам
        const weather = await getCurrentWeather(coords.lat, coords.lon);
        const cityName = `${weather.name}, ${countries.getName(weather.sys.country, 'ru') || weather.sys.country}`;
        setCurrentCity(cityName);
      } else {
        setCurrentCity('Не выбрано (используется геолокация)');
      }
    } catch (error) {
      console.error('Ошибка загрузки текущего города:', error);
      setCurrentCity('Ошибка загрузки города');
    }
  };

  const updateSetting = async (key, value) => {
    await AsyncStorage.setItem(key, value);
  };

  const getWindUnitLabel = (unit) => {
    switch (unit) {
      case 'm/s': return 'м/с (метры в секунду)';
      case 'km/h': return 'км/ч (километры в час)';
      case 'mph': return 'mph (мили в час)';
      default: return unit;
    }
  };

  const getPressureUnitLabel = (unit) => {
    switch (unit) {
      case 'mmHg': return 'мм рт.ст. (миллиметры ртутного столба)';
      case 'hPa': return 'гПа (гектопаскали)';
      case 'bar': return 'бар';
      case 'psi': return 'PSI (фунты на квадратный дюйм)';
      default: return unit;
    }
  };

  // Закрыть все дропдауны
  const closeAllDropdowns = () => {
    setShowUnitDropdown(false);
    setShowWindDropdown(false);
    setShowPressureDropdown(false);
    setShowCitySearch(false);
  };

  // Функция автоматического определения местоположения
  const handleAutoLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Разрешение не получено',
          'Для определения местоположения необходимо разрешить доступ к геолокации в настройках устройства.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Удаляем сохраненный город, чтобы использовать геолокацию
      await AsyncStorage.removeItem('savedCity');
      
      // Получаем название города по координатам
      const weather = await getCurrentWeather(location.coords.latitude, location.coords.longitude);
      const cityName = `${weather.name}, ${countries.getName(weather.sys.country, 'ru') || weather.sys.country}`;
      
      setCurrentCity(`${cityName} (по геолокации)`);
      
      // НЕ изменяем настройку useGeo автоматически
      // setUseGeo(true);
      // await updateSetting('useGeo', 'true');

      // Сигнализируем главному экрану об обновлении
      await AsyncStorage.setItem('shouldRefreshWeather', 'true');

      Alert.alert(
        'Успешно',
        `Местоположение определено: ${cityName}`,
        [
          {
            text: 'ОК',
            onPress: () => {
              // Возвращаемся на главный экран для обновления данных
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Ошибка определения местоположения:', error);
      Alert.alert(
        'Ошибка',
        'Не удалось определить местоположение. Проверьте подключение к интернету и настройки геолокации.'
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Функция выбора города
  const handleCitySelect = async (cityData) => {
    try {
      const coords = { lat: cityData.lat, lon: cityData.lon };
      await AsyncStorage.setItem('savedCity', JSON.stringify(coords));
      
      const cityName = `${(cityData.local_names?.ru || cityData.name)}, ${countries.getName(cityData.country, 'ru') || cityData.country}`;
      setCurrentCity(cityName);
      setSearchCity('');
      setSearchResults([]);
      setShowCitySearch(false);
      
      // НЕ изменяем настройку useGeo - она должна быть независимой
      // setUseGeo(false);
      // await updateSetting('useGeo', 'false');

      // Сигнализируем главному экрану об обновлении
      await AsyncStorage.setItem('shouldRefreshWeather', 'true');

      Alert.alert(
        'Город изменен',
        `Выбран город: ${cityName}`,
        [
          {
            text: 'ОК',
            onPress: () => {
              // Возвращаемся на главный экран для обновления данных
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Ошибка выбора города:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать город');
    }
  };

  // Функция сброса приложения
  const handleResetApp = () => {
    Alert.alert(
      'Сброс приложения',
      'Вы уверены, что хотите сбросить все настройки? Это действие нельзя отменить. Приложение вернется к первоначальному состоянию.',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            try {
              // Очищаем все данные AsyncStorage
              await AsyncStorage.clear();
              
              // Показываем уведомление об успехе
              Alert.alert(
                'Сброс завершен',
                'Все данные приложения были удалены. Сейчас вы будете перенаправлены на экран приветствия.',
                [
                  {
                    text: 'ОК',
                    onPress: () => {
                      // Перенаправляем на экран приветствия
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Welcome' }],
                      });
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Ошибка при сбросе приложения:', error);
              Alert.alert(
                'Ошибка',
                'Не удалось выполнить сброс приложения. Попробуйте еще раз.'
              );
            }
          },
        },
      ]
    );
  };

  const DropdownList = ({ items, onSelect, onClose }) => {
    return (
      <View style={[
        styles.suggestionList, 
        { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
      ]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.dropdownContent}
        >
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                onSelect(item.value);
                onClose();
              }}
              style={[
                styles.suggestionItem,
                { 
                  borderBottomWidth: index === items.length - 1 ? 0 : 1,
                  borderBottomColor: isDark ? '#444' : '#eee'
                }
              ]}
            >
              <Text style={[
                styles.suggestionItemText, 
                { color: isDark ? '#fff' : '#000' }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover" blurRadius={70}>
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
        
        {/* Фиксированная панель навигации */}
        <View style={styles.fixedHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.backButton,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }
            ]}
          >
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons 
                name="chevron-back" 
                size={20} 
                color={isDark ? '#fff' : '#000'} 
              />
            </View>
          </TouchableOpacity>

          <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
            Настройки
          </Text>
        </View>

        {/* Прокручиваемый контент */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* Текущий город */}
          <View style={styles.settingGroup}>
            <Text style={[styles.groupLabel, { color: isDark ? '#fff' : '#000' }]}>
              Текущее местоположение
            </Text>
            <View style={[
              styles.cityInfoContainer,
              { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
              }
            ]}>
              <Text style={[
                styles.currentCityText, 
                { color: isDark ? '#fff' : '#000' }
              ]}>
                {currentCity}
              </Text>
            </View>

            {/* Кнопки управления городом */}
            <View style={styles.cityButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.cityButton,
                  { backgroundColor: isDark ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)' }
                ]}
                onPress={() => {
                  closeAllDropdowns();
                  setShowCitySearch(!showCitySearch);
                }}
              >
                <Ionicons name="search" size={16} color="#2196F3" />
                <Text style={[styles.cityButtonText, { color: '#2196F3' }]}>
                  Выбрать город
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cityButton,
                  { 
                    backgroundColor: isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                    opacity: isLoadingLocation ? 0.6 : 1
                  }
                ]}
                onPress={handleAutoLocation}
                disabled={isLoadingLocation}
              >
                <Ionicons 
                  name={isLoadingLocation ? "time" : "location"} 
                  size={16} 
                  color="#4CAF50" 
                />
                <Text style={[styles.cityButtonText, { color: '#4CAF50' }]}>
                  {isLoadingLocation ? 'Определение...' : 'Автолокация'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Поиск города */}
            {showCitySearch && (
              <View style={styles.citySearchContainer}>
                <TextInput
                  placeholder="Введите название города"
                  placeholderTextColor={isDark ? '#ccc' : '#666'}
                  value={searchCity}
                  onChangeText={async (text) => {
                    setSearchCity(text);
                    if (text.length > 2) {
                      try {
                        const results = await searchCityByName(text);
                        setSearchResults(results);
                      } catch (error) {
                        console.log('Поиск недоступен:', error);
                        setSearchResults([]);
                      }
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  style={[
                    styles.citySearchInput,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      color: isDark ? '#fff' : '#000',
                      borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                    }
                  ]}
                />

                {/* Результаты поиска */}
                {searchResults.length > 0 && (
                  <View style={[
                    styles.citySearchResults,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                  ]}>
                    <ScrollView 
                      showsVerticalScrollIndicator={false}
                      style={{ maxHeight: 150 }}
                    >
                      {searchResults.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleCitySelect(item)}
                          style={[
                            styles.citySearchResultItem,
                            { 
                              borderBottomWidth: index === searchResults.length - 1 ? 0 : 1,
                              borderBottomColor: isDark ? '#444' : '#eee'
                            }
                          ]}
                        >
                          <Text style={[
                            styles.citySearchResultText,
                            { color: isDark ? '#fff' : '#000' }
                          ]}>
                            {(item.local_names?.ru || item.name)}
                            {item.state ? `, ${item.state}` : ''}, 
                            {countries.getName(item.country, 'ru') || item.country}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Темная тема */}
          <View style={styles.settingRow}>
            <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>
              Темная тема
            </Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
            />
          </View>

          {/* Геолокация */}
          <View style={styles.settingRow}>
            <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>
              Использовать геолокацию в поиске
            </Text>
            <Switch
              value={useGeo}
              onValueChange={(value) => {
                setUseGeo(value);
                updateSetting('useGeo', value.toString());
              }}
              color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
            />
          </View>

          {/* Температура */}
          <View style={styles.settingGroup}>
            <Text style={[styles.groupLabel, { color: isDark ? '#fff' : '#000' }]}>
              Температура
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton, 
                { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }
              ]}
              onPress={() => {
                closeAllDropdowns();
                setShowUnitDropdown(!showUnitDropdown);
              }}
            >
              <Text style={[styles.dropdownLabel, { color: isDark ? '#fff' : '#000' }]}>
                {unit === 'metric' ? '°C (Цельсий)' : '°F (Фаренгейт)'}
              </Text>
            </TouchableOpacity>
            {showUnitDropdown && (
              <DropdownList
                items={[
                  { label: '°C (Цельсий)', value: 'metric' },
                  { label: '°F (Фаренгейт)', value: 'imperial' },
                ]}
                onSelect={(value) => {
                  setUnit(value);
                  updateSetting('unit', value);
                }}
                onClose={() => setShowUnitDropdown(false)}
              />
            )}
          </View>

          {/* Скорость ветра */}
          <View style={styles.settingGroup}>
            <Text style={[styles.groupLabel, { color: isDark ? '#fff' : '#000' }]}>
              Скорость ветра
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton, 
                { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }
              ]}
              onPress={() => {
                closeAllDropdowns();
                setShowWindDropdown(!showWindDropdown);
              }}
            >
              <Text style={[styles.dropdownLabel, { color: isDark ? '#fff' : '#000' }]}>
                {getWindUnitLabel(windUnit)}
              </Text>
            </TouchableOpacity>
            {showWindDropdown && (
              <DropdownList
                items={[
                  { label: 'м/с (метры в секунду)', value: 'm/s' },
                  { label: 'км/ч (километры в час)', value: 'km/h' },
                  { label: 'mph (мили в час)', value: 'mph' },
                ]}
                onSelect={(value) => {
                  setWindUnit(value);
                  updateSetting('windUnit', value);
                }}
                onClose={() => setShowWindDropdown(false)}
              />
            )}
          </View>

          {/* Атмосферное давление */}
          <View style={styles.settingGroup}>
            <Text style={[styles.groupLabel, { color: isDark ? '#fff' : '#000' }]}>
              Атмосферное давление
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton, 
                { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }
              ]}
              onPress={() => {
                closeAllDropdowns();
                setShowPressureDropdown(!showPressureDropdown);
              }}
            >
              <Text style={[styles.dropdownLabel, { color: isDark ? '#fff' : '#000' }]}>
                {getPressureUnitLabel(pressureUnit)}
              </Text>
            </TouchableOpacity>
            {showPressureDropdown && (
              <DropdownList
                items={[
                  { label: 'мм рт.ст. (миллиметры ртутного столба)', value: 'mmHg' },
                  { label: 'гПа (гектопаскали)', value: 'hPa' },
                  { label: 'бар', value: 'bar' },
                  { label: 'PSI (фунты на квадратный дюйм)', value: 'psi' },
                ]}
                onSelect={(value) => {
                  setPressureUnit(value);
                  updateSetting('pressureUnit', value);
                }}
                onClose={() => setShowPressureDropdown(false)}
              />
            )}
          </View>

          {/* Секция сброса приложения */}
          <View style={styles.resetSection}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetApp}
            >
              <View style={styles.resetButtonContent}>
                <Ionicons 
                  name="refresh-outline" 
                  size={20} 
                  color="#f44336"
                />
                <Text style={styles.resetButtonText}>
                  Сбросить приложение
                </Text>
              </View>
            </TouchableOpacity>
          </View>
            {/* Версия приложения */}
            <Text style={[styles.versionText, { color: isDark ? '#aaa' : '#666' }]}>
              Версия 1.0.2
            </Text>
        </ScrollView>
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // Базовые контейнеры
  background: {
    flex: 1,
  },
  blurOverlay: {
    flex: 1,
  },
  
  // Фиксированная панель навигации
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: 'transparent',
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
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },

  // Прокручиваемый контент
  scrollContainer: {
    flex: 1,
    marginTop: 130,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 60,
    gap: 25,
  },

  // Настройки с переключателями
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },

  // Группы настроек с выпадающими списками
  settingGroup: {
    gap: 10,
  },
  groupLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  dropdownLabel: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Стили для города
  cityInfoContainer: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    minHeight: 50,
    justifyContent: 'center',
  },
  currentCityText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  cityButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  cityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 6,
  },
  cityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  citySearchContainer: {
    gap: 10,
  },
  citySearchInput: {
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 50,
  },
  citySearchResults: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  citySearchResultItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  citySearchResultText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Выпадающие списки
  suggestionList: {
    borderRadius: 20,
    marginTop: 10,
    overflow: 'hidden',
    maxHeight: 220,
  },
  dropdownContent: {
    paddingVertical: 6,
  },
  suggestionItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    justifyContent: 'center',
    minHeight: 44,
  },
  suggestionItemText: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 15,
  },

  // Секция сброса
  resetSection: {
    paddingTop: 25,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  resetButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: '#f44336',
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resetButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});