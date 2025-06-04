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
  Dimensions,
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const [step, setStep] = useState('welcome'); // 'welcome', 'manual', 'geo'
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isDark } = useThemeContext();

  // Адаптивные размеры
  const isSmallScreen = screenHeight < 700;
  const isMediumScreen = screenHeight >= 700 && screenHeight < 800;
  const isLargeScreen = screenHeight >= 800;
  const isTablet = screenWidth > 600;

  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  // Цвета для адаптации под тему
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const placeholderColor = isDark ? 'lightgray' : '#999';
  const iconColor = isDark ? '#fff' : '#333';

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
        setSearchResults(results.slice(0, isSmallScreen ? 4 : 5));
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
            <ActivityIndicator 
              size="large" 
              color={textColor} 
              style={{ transform: [{ scale: isTablet ? 1.5 : 1 }] }}
            />
            <Text style={[styles.loadingText, { 
              color: textColor,
              fontSize: isTablet ? 20 : (isSmallScreen ? 14 : 16),
              marginTop: isTablet ? 20 : 15
            }]}>
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
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: isSmallScreen ? 40 : (isTablet ? 80 : 60),
              paddingHorizontal: isTablet ? 40 : 20,
              paddingBottom: isSmallScreen ? 20 : 40
            }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          
          {step === 'welcome' && (
            <>
              {/* Приветственная анимация */}
              <View style={[styles.animationContainer, {
                marginTop: isSmallScreen ? 20 : (isTablet ? 60 : 40),
                marginBottom: isSmallScreen ? 30 : (isTablet ? 60 : 40)
              }]}>
                <LottieView
                  source={require('../assets/lottie/weather-welcome.json')}
                  autoPlay
                  loop
                  style={[styles.welcomeAnimation, {
                    width: isTablet ? 300 : (isSmallScreen ? 150 : 200),
                    height: isTablet ? 300 : (isSmallScreen ? 150 : 200)
                  }]}
                />
              </View>

              {/* Заголовок */}
              <View style={[styles.welcomeHeader, {
                marginBottom: isSmallScreen ? 30 : (isTablet ? 70 : 50)
              }]}>
                <Text style={[styles.welcomeTitle, { 
                  color: textColor,
                  fontSize: isTablet ? 42 : (isSmallScreen ? 26 : 32),
                  marginBottom: isSmallScreen ? 8 : 10
                }]}>
                  Добро пожаловать!
                </Text>
                <Text style={[styles.welcomeSubtitle, { 
                  color: secondaryTextColor,
                  fontSize: isTablet ? 20 : (isSmallScreen ? 14 : 16),
                  lineHeight: isTablet ? 28 : (isSmallScreen ? 20 : 22),
                  paddingHorizontal: isTablet ? 40 : 20
                }]}>
                  Настройте способ определения местоположения для получения точного прогноза погоды
                </Text>
              </View>

              {/* Кнопки выбора */}
              <View style={[styles.optionsContainer, {
                gap: isSmallScreen ? 12 : 15,
                maxWidth: isTablet ? 500 : '100%',
                alignSelf: 'center',
                width: '100%'
              }]}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      padding: isTablet ? 25 : (isSmallScreen ? 15 : 20),
                      borderRadius: isTablet ? 20 : 16
                    }
                  ]}
                  onPress={handleGeolocation}
                >
                  <View style={[styles.optionIcon, {
                    width: isTablet ? 60 : (isSmallScreen ? 40 : 50),
                    height: isTablet ? 60 : (isSmallScreen ? 40 : 50),
                    borderRadius: isTablet ? 30 : (isSmallScreen ? 20 : 25)
                  }]}>
                    <Ionicons 
                      name="location" 
                      size={isTablet ? 36 : (isSmallScreen ? 24 : 30)} 
                      color="#4CAF50" 
                    />
                  </View>
                  <View style={[styles.optionText, { gap: isSmallScreen ? 2 : 4 }]}>
                    <Text style={[styles.optionTitle, { 
                      color: textColor,
                      fontSize: isTablet ? 22 : (isSmallScreen ? 16 : 18)
                    }]}>
                      Автоматически
                    </Text>
                    <Text style={[styles.optionDescription, { 
                      color: secondaryTextColor,
                      fontSize: isTablet ? 16 : (isSmallScreen ? 12 : 14),
                      lineHeight: isTablet ? 20 : 18
                    }]}>
                      Использовать геолокацию устройства
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={isTablet ? 24 : 20} 
                    color={secondaryTextColor} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      padding: isTablet ? 25 : (isSmallScreen ? 15 : 20),
                      borderRadius: isTablet ? 20 : 16
                    }
                  ]}
                  onPress={handleManualSelection}
                >
                  <View style={[styles.optionIcon, {
                    width: isTablet ? 60 : (isSmallScreen ? 40 : 50),
                    height: isTablet ? 60 : (isSmallScreen ? 40 : 50),
                    borderRadius: isTablet ? 30 : (isSmallScreen ? 20 : 25)
                  }]}>
                    <Ionicons 
                      name="search" 
                      size={isTablet ? 36 : (isSmallScreen ? 24 : 30)} 
                      color="#2196F3" 
                    />
                  </View>
                  <View style={[styles.optionText, { gap: isSmallScreen ? 2 : 4 }]}>
                    <Text style={[styles.optionTitle, { 
                      color: textColor,
                      fontSize: isTablet ? 22 : (isSmallScreen ? 16 : 18)
                    }]}>
                      Выбрать город
                    </Text>
                    <Text style={[styles.optionDescription, { 
                      color: secondaryTextColor,
                      fontSize: isTablet ? 16 : (isSmallScreen ? 12 : 14),
                      lineHeight: isTablet ? 20 : 18
                    }]}>
                      Найти и выбрать город вручную
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={isTablet ? 24 : 20} 
                    color={secondaryTextColor} 
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'manual' && (
            <>
              {/* Заголовок для ручного выбора */}
              <View style={[styles.manualHeader, {
                marginBottom: isSmallScreen ? 20 : (isTablet ? 40 : 30)
              }]}>
                <TouchableOpacity
                  onPress={() => setStep('welcome')}
                  style={[styles.backButton, {
                    padding: isTablet ? 12 : 8,
                    marginRight: isTablet ? 15 : 10
                  }]}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={isTablet ? 28 : 24} 
                    color={textColor} 
                  />
                </TouchableOpacity>
                <Text style={[styles.manualTitle, { 
                  color: textColor,
                  fontSize: isTablet ? 32 : (isSmallScreen ? 20 : 24)
                }]}>
                  Выберите город
                </Text>
              </View>

              {/* Поле поиска */}
              <BlurView 
                intensity={0} 
                style={[
                  styles.searchContainer,
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    padding: isTablet ? 20 : (isSmallScreen ? 12 : 15),
                    borderRadius: isTablet ? 25 : 20,
                    marginBottom: isSmallScreen ? 15 : 20
                  }
                ]}
              >
                <Ionicons 
                  name="search" 
                  size={isTablet ? 24 : 20} 
                  color={secondaryTextColor} 
                />
                <TextInput
                  placeholder="Введите название города"
                  placeholderTextColor={placeholderColor}
                  value={searchCity}
                  onChangeText={searchCities}
                  style={[styles.searchInput, { 
                    color: textColor,
                    fontSize: isTablet ? 20 : (isSmallScreen ? 14 : 16),
                    marginLeft: isTablet ? 15 : 10
                  }]}
                  autoFocus
                />
              </BlurView>

              {/* Результаты поиска */}
              {searchResults.length > 0 && (
                <View style={[
                  styles.resultsContainer,
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderRadius: isTablet ? 20 : 16,
                    marginBottom: isSmallScreen ? 15 : 20,
                    maxHeight: isSmallScreen ? 250 : (isTablet ? 400 : 300)
                  }
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
                            padding: isTablet ? 20 : (isSmallScreen ? 12 : 15),
                            borderBottomWidth: index === searchResults.length - 1 ? 0 : 1
                          }
                        ]}
                      >
                        <View style={styles.resultInfo}>
                          <Text style={[styles.cityName, { 
                            color: textColor,
                            fontSize: isTablet ? 20 : (isSmallScreen ? 14 : 16),
                            marginBottom: isSmallScreen ? 1 : 2
                          }]}>
                            {item.local_names?.ru || item.name}
                          </Text>
                          <Text style={[styles.countryName, { 
                            color: secondaryTextColor,
                            fontSize: isTablet ? 16 : (isSmallScreen ? 12 : 14)
                          }]}>
                            {item.state ? `${item.state}, ` : ''}
                            {countries.getName(item.country, 'ru') || item.country}
                          </Text>
                        </View>
                        <Ionicons 
                          name="chevron-forward" 
                          size={isTablet ? 20 : 16} 
                          color={secondaryTextColor} 
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Подсказка */}
              <Text style={[styles.hint, { 
                color: secondaryTextColor,
                fontSize: isTablet ? 16 : (isSmallScreen ? 12 : 14),
                lineHeight: isTablet ? 22 : 20,
                paddingHorizontal: isTablet ? 40 : 20
              }]}>
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
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  animationContainer: {
    alignItems: 'center',
  },
  welcomeAnimation: {
    // Размеры задаются динамически
  },
  welcomeHeader: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    textAlign: 'center',
  },
  optionsContainer: {
    // Настройки задаются динамически
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: 15,
  },
  optionTitle: {
    fontWeight: '600',
  },
  optionDescription: {
    // Размеры задаются динамически
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    // Размеры задаются динамически
  },
  manualTitle: {
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
  },
  resultsContainer: {
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  cityName: {
    fontWeight: '500',
  },
  countryName: {
    // Размеры задаются динамически
  },
  hint: {
    textAlign: 'center',
  },
});