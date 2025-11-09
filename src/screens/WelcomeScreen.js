import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { searchCityByName } from '../api/weather';
import { useThemeContext } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import countries from 'i18n-iso-countries';
import ruLocale from 'i18n-iso-countries/langs/ru.json';

countries.registerLocale(ruLocale);

export default function WelcomeScreen({ navigation }) {
  const [step, setStep] = useState('welcome'); // 'welcome', 'manual', 'geo'
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vpnAlertShown, setVpnAlertShown] = useState(false);
  const { isDark } = useThemeContext();

  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  // Цвета для адаптации под тему
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const placeholderColor = isDark ? 'lightgray' : '#999';
  const iconColor = isDark ? '#fff' : '#333';

  // Проверяем первый запуск и показываем VPN предупреждение
  useEffect(() => {
    const checkFirstLaunchAndShowVpnAlert = async () => {
      try {
        const isFirstLaunch = await AsyncStorage.getItem('isFirstLaunch');
        const vpnAlertShownBefore = await AsyncStorage.getItem('vpnAlertShown');
        
        // Показываем alert только при первом запуске и если он еще не был показан
        if (isFirstLaunch !== 'false' && vpnAlertShownBefore !== 'true' && !vpnAlertShown) {
          // Небольшая задержка для того, чтобы экран успел загрузиться
          setTimeout(() => {
            showVpnAlert();
          }, 1000);
        }
      } catch (error) {
        console.error('Ошибка проверки первого запуска:', error);
      }
    };

    checkFirstLaunchAndShowVpnAlert();
  }, [vpnAlertShown]);

  const showVpnAlert = () => {
    setVpnAlertShown(true);
    
    Alert.alert(
      "⚠️ Важная информация",
      "Внимание! При возникновении трудностей с загрузкой или обновлением погодных данных воспользуйтесь VPN.",
      [
        {
          text: "Понятно",
          style: "default",
          onPress: async () => {
            try {
              // Сохраняем факт показа предупреждения
              await AsyncStorage.setItem('vpnAlertShown', 'true');
            } catch (error) {
              console.error('Ошибка сохранения состояния VPN alert:', error);
            }
          }
        }
      ],
      { 
        cancelable: false // Не позволяем закрыть alert без нажатия кнопки
      }
    );
  };

  const handleGeolocation = async () => {
    setStep('geo');
    setLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Разрешение отклонено',
          'Для использования геолокации необходимо предоставить разрешение. Выберите город вручную.',
          [
            { 
              text: 'Выбрать вручную', 
              onPress: () => {
                setStep('manual');
                setLoading(false);
              }
            },
            { 
              text: 'Повторить', 
              onPress: () => {
                setStep('welcome');
                setLoading(false);
              }
            }
          ]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        lat: location.coords.latitude,
        lon: location.coords.longitude,
      };

      await AsyncStorage.setItem('savedCity', JSON.stringify(coords));
      await AsyncStorage.setItem('useGeo', 'true');
      await AsyncStorage.setItem('isFirstLaunch', 'false');

      navigation.replace('Home');

    } catch (error) {
      console.error('Ошибка получения геолокации:', error);
      setLoading(false);
      Alert.alert(
        'Ошибка',
        'Не удалось определить местоположение. Попробуйте выбрать город вручную.',
        [
          { 
            text: 'Выбрать вручную', 
            onPress: () => setStep('manual')
          },
          { 
            text: 'Повторить', 
            onPress: () => setStep('welcome')
          }
        ]
      );
    }
  };

  const handleManualSelection = () => {
    setStep('manual');
  };

  const handleCitySelect = async (cityData) => {
    setLoading(true);

    try {
      const coords = {
        lat: cityData.lat,
        lon: cityData.lon,
      };

      await AsyncStorage.setItem('savedCity', JSON.stringify(coords));
      await AsyncStorage.setItem('useGeo', 'false');
      await AsyncStorage.setItem('isFirstLaunch', 'false');

      navigation.replace('Home');

    } catch (error) {
      console.error('Ошибка сохранения города:', error);
      setLoading(false);
      Alert.alert('Ошибка', 'Не удалось сохранить выбранный город');
    }
  };

  const searchCities = async (text) => {
    setSearchCity(text);
    if (text.length > 2) {
      try {
        const results = await searchCityByName(text);
        setSearchResults(results.slice(0, 5));
      } catch (error) {
        console.error('Ошибка поиска городов:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={styles.background}
        blurRadius={70}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={textColor} />
            <Text style={[styles.loadingText, { color: textColor }]}>
              {step === 'geo' ? 'Определение местоположения...' : 'Настройка приложения...'}
            </Text>
          </View>
        </BlurView>
      </ImageBackground>
    );
  }

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
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          
          {step === 'welcome' && (
            <>
              {/* Приветственная анимация */}
              <View style={styles.animationContainer}>
                <LottieView
                  source={require('../assets/lottie/weather-welcome.json')}
                  autoPlay
                  loop
                  style={styles.welcomeAnimation}
                />
              </View>

              {/* Заголовок */}
              <View style={styles.welcomeHeader}>
                <Text style={[styles.welcomeTitle, { color: textColor }]}>
                  Добро пожаловать!
                </Text>
                <Text style={[styles.welcomeSubtitle, { color: secondaryTextColor }]}>
                  Настройте способ определения местоположения для получения точного прогноза погоды
                </Text>
              </View>

              {/* Кнопки выбора */}
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                  ]}
                  onPress={handleGeolocation}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name="location" size={30} color="#4CAF50" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: textColor }]}>
                      Автоматически
                    </Text>
                    <Text style={[styles.optionDescription, { color: secondaryTextColor }]}>
                      Использовать геолокацию устройства
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                  ]}
                  onPress={handleManualSelection}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name="search" size={30} color="#2196F3" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: textColor }]}>
                      Выбрать город
                    </Text>
                    <Text style={[styles.optionDescription, { color: secondaryTextColor }]}>
                      Найти и выбрать город вручную
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
                </TouchableOpacity>
              </View>

              {/* VPN информационный баннер (опционально, если хотите добавить визуальный элемент) */}
              {/* <View style={[styles.infoBanner, { 
                backgroundColor: isDark ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255, 193, 7, 0.1)',
                borderColor: isDark ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 193, 7, 0.25)'
              }]}>
                <Ionicons 
                  name="information-circle-outline" 
                  size={16} 
                  color={isDark ? '#FFD700' : '#FF8F00'} 
                  style={styles.infoIcon}
                />
                <Text style={[styles.infoBannerText, { 
                  color: isDark ? '#FFE082' : '#F57C00' 
                }]}>
                  При проблемах с загрузкой данных рекомендуется использовать VPN
                </Text>
              </View> */}
            </>
          )}

          {step === 'manual' && (
            <>
              {/* Заголовок для ручного выбора */}
              <View style={styles.manualHeader}>
                <TouchableOpacity
                  onPress={() => setStep('welcome')}
                  style={styles.backButton}
                >
                  <Ionicons name="chevron-back" size={24} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.manualTitle, { color: textColor }]}>
                  Выберите город
                </Text>
              </View>

              {/* Поле поиска */}
              <BlurView 
                intensity={0} 
                style={[
                  styles.searchContainer,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                ]}
              >
                <Ionicons name="search" size={20} color={secondaryTextColor} />
                <TextInput
                  placeholder="Введите название города"
                  placeholderTextColor={placeholderColor}
                  value={searchCity}
                  onChangeText={searchCities}
                  style={[styles.searchInput, { color: textColor }]}
                  autoFocus
                />
              </BlurView>

              {/* Результаты поиска */}
              {searchResults.length > 0 && (
                <View style={[
                  styles.resultsContainer,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                ]}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {searchResults.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleCitySelect(item)}
                        style={[
                          styles.resultItem,
                          { 
                            borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            borderBottomWidth: index === searchResults.length - 1 ? 0 : 1
                          }
                        ]}
                      >
                        <View style={styles.resultInfo}>
                          <Text style={[styles.cityName, { color: textColor }]}>
                            {item.local_names?.ru || item.name}
                          </Text>
                          <Text style={[styles.countryName, { color: secondaryTextColor }]}>
                            {item.state ? `${item.state}, ` : ''}
                            {countries.getName(item.country, 'ru') || item.country}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={secondaryTextColor} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Подсказка */}
              <Text style={[styles.hint, { color: secondaryTextColor }]}>
                Введите название города для поиска подходящих вариантов
              </Text>
            </>
          )}

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
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  scrollContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 50,
    gap: 20, // gap между основными секциями
  },

  // Загрузка
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Приветственный экран
  animationContainer: {
    alignItems: 'center',
  },
  welcomeAnimation: {
    width: 200,
    height: 200,
  },
  welcomeHeader: {
    alignItems: 'center',
    gap: 10,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 15,
  },

  // Кнопки выбора
  optionsContainer: {
    gap: 15,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 15,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },

  // VPN информационный баннер
  infoBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -20, // Уменьшаем отступ сверху
  },
  infoIcon: {
    marginRight: 8,
  },
  infoBannerText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
    flexShrink: 1,
  },

  // Ручной выбор города
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Поиск
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  // Результаты поиска
  resultsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: 300,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '500',
  },
  countryName: {
    fontSize: 14,
  },

  // Подсказка
  hint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 15,
  },
});