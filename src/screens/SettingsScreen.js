import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useThemeContext } from '../theme/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

  // Адаптивные размеры
  const isSmallScreen = screenHeight < 700;
  const isMediumScreen = screenHeight >= 700 && screenHeight < 800;
  const isLargeScreen = screenHeight >= 800;
  const isTablet = screenWidth > 600;

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
    })();
  }, []);

  const updateSetting = async (key, value) => {
    await AsyncStorage.setItem(key, value);
  };

  const getWindUnitLabel = (unit) => {
    switch (unit) {
      case 'm/s': return isSmallScreen ? 'м/с' : 'м/с (метры в секунду)';
      case 'km/h': return isSmallScreen ? 'км/ч' : 'км/ч (километры в час)';
      case 'mph': return isSmallScreen ? 'mph' : 'mph (мили в час)';
      default: return unit;
    }
  };

  const getPressureUnitLabel = (unit) => {
    switch (unit) {
      case 'mmHg': return isSmallScreen ? 'мм рт.ст.' : 'мм рт.ст. (миллиметры ртутного столба)';
      case 'hPa': return isSmallScreen ? 'гПа' : 'гПа (гектопаскали)';
      case 'bar': return 'бар';
      case 'psi': return isSmallScreen ? 'PSI' : 'PSI (фунты на квадратный дюйм)';
      default: return unit;
    }
  };

  // Закрыть все дропдауны
  const closeAllDropdowns = () => {
    setShowUnitDropdown(false);
    setShowWindDropdown(false);
    setShowPressureDropdown(false);
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
    // Динамически рассчитываем высоту в зависимости от количества элементов
    const itemHeight = isSmallScreen ? 42 : (isTablet ? 56 : 48);
    const maxVisibleItems = isSmallScreen ? 4 : (isTablet ? 4 : 4); // Увеличиваем до 4 для маленьких экранов
    const paddingTotal = 16; // Общий padding
    const calculatedHeight = Math.min(items.length, maxVisibleItems) * itemHeight + paddingTotal;
    
    return (
      <View style={[
        styles.suggestionList, 
        { 
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          height: calculatedHeight,
          maxHeight: isSmallScreen ? 200 : (isTablet ? 280 : 220) // Увеличиваем maxHeight
        }
      ]}>
        <ScrollView 
          showsVerticalScrollIndicator={items.length > maxVisibleItems}
          bounces={false}
          contentContainerStyle={{ paddingVertical: 6 }}
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
                  borderBottomColor: isDark ? '#444' : '#eee',
                  height: itemHeight,
                  paddingVertical: isSmallScreen ? 6 : (isTablet ? 12 : 10)
                }
              ]}
            >
              <Text style={[
                styles.suggestionItemText, 
                { 
                  color: isDark ? '#fff' : '#000',
                  fontSize: isSmallScreen ? 12 : (isTablet ? 18 : 15), // Уменьшаем шрифт на маленьких экранах
                  lineHeight: isSmallScreen ? 14 : (isTablet ? 22 : 18)
                }
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
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.container,
            { 
              paddingHorizontal: isTablet ? 40 : 20,
              paddingTop: isSmallScreen ? 30 : 40
            }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* Назад */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.backButtonCircle,
              { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                width: isSmallScreen ? 45 : 45,
                height: isSmallScreen ? 45 : 45,
                borderRadius: isSmallScreen ? 22.5 : 22.5,
                marginBottom: isSmallScreen ? 15 : 20
              },
            ]}
          >
            <Ionicons 
              name="chevron-back" 
              size={isSmallScreen ? 18 : 20} 
              color={isDark ? '#fff' : '#000'} 
            />
          </TouchableOpacity>

          {/* Заголовок */}
          <Text style={[
            styles.title, 
            { 
              color: isDark ? '#fff' : '#000',
              fontSize: isTablet ? 32 : (isSmallScreen ? 22 : 26),
              marginBottom: isSmallScreen ? 20 : 30
            }
          ]}>
            Настройки
          </Text>

          {/* Темная тема */}
          <View style={[styles.settingRow, { marginTop: isSmallScreen ? 15 : 20 }]}>
            <Text style={[
              styles.label, 
              { 
                color: isDark ? '#fff' : '#000',
                fontSize: isTablet ? 20 : (isSmallScreen ? 14 : 16),
                flex: 1
              }
            ]}>
              Темная тема
            </Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
              style={{ transform: [{ scale: isSmallScreen ? 0.9 : 1 }] }}
            />
          </View>

          {/* Геолокация */}
          <View style={[styles.settingRow, { marginTop: isSmallScreen ? 15 : 20 }]}>
            <Text style={[
              styles.label, 
              { 
                color: isDark ? '#fff' : '#000',
                fontSize: isTablet ? 20 : (isSmallScreen ? 14 : 16),
                flex: 1
              }
            ]}>
              Использовать геолокацию
            </Text>
            <Switch
              value={useGeo}
              onValueChange={(value) => {
                setUseGeo(value);
                updateSetting('useGeo', value.toString());
              }}
              color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
              style={{ transform: [{ scale: isSmallScreen ? 0.9 : 1 }] }}
            />
          </View>

          {/* Температура */}
          <Text style={[
            styles.label, 
            { 
              color: isDark ? '#fff' : '#000',
              fontSize: isTablet ? 20 : (isSmallScreen ? 14 : 16),
              marginTop: isSmallScreen ? 20 : 25
            }
          ]}>
            Температура
          </Text>
          <TouchableOpacity
            style={[
              styles.grayButton, 
              { 
                borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                height: isSmallScreen ? 45 : (isTablet ? 60 : 50),
                marginTop: isSmallScreen ? 8 : 10
              }
            ]}
            onPress={() => {
              closeAllDropdowns();
              setShowUnitDropdown(!showUnitDropdown);
            }}
          >
            <Text style={[
              styles.grayLabel, 
              { 
                color: isDark ? '#fff' : '#000',
                fontSize: isTablet ? 18 : (isSmallScreen ? 14 : 16)
              }
            ]}>
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

          {/* Скорость ветра */}
          <Text style={[
            styles.label, 
            { 
              color: isDark ? '#fff' : '#000',
              fontSize: isTablet ? 20 : (isSmallScreen ? 14 : 16),
              marginTop: isSmallScreen ? 20 : 25
            }
          ]}>
            Скорость ветра
          </Text>
          <TouchableOpacity
            style={[
              styles.grayButton, 
              { 
                borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                height: isSmallScreen ? 45 : (isTablet ? 60 : 50),
                marginTop: isSmallScreen ? 8 : 10
              }
            ]}
            onPress={() => {
              closeAllDropdowns();
              setShowWindDropdown(!showWindDropdown);
            }}
          >
            <Text style={[
              styles.grayLabel, 
              { 
                color: isDark ? '#fff' : '#000',
                fontSize: isTablet ? 18 : (isSmallScreen ? 14 : 16)
              }
            ]}>
              {getWindUnitLabel(windUnit)}
            </Text>
          </TouchableOpacity>
          {showWindDropdown && (
            <DropdownList
              items={[
                { label: isSmallScreen ? 'м/с' : 'м/с (метры в секунду)', value: 'm/s' },
                { label: isSmallScreen ? 'км/ч' : 'км/ч (километры в час)', value: 'km/h' },
                { label: isSmallScreen ? 'mph' : 'mph (мили в час)', value: 'mph' },
              ]}
              onSelect={(value) => {
                setWindUnit(value);
                updateSetting('windUnit', value);
              }}
              onClose={() => setShowWindDropdown(false)}
            />
          )}

          {/* Атмосферное давление */}
          <Text style={[
            styles.label, 
            { 
              color: isDark ? '#fff' : '#000',
              fontSize: isTablet ? 20 : (isSmallScreen ? 14 : 16),
              marginTop: isSmallScreen ? 20 : 25
            }
          ]}>
            Атмосферное давление
          </Text>
          <TouchableOpacity
            style={[
              styles.grayButton, 
              { 
                borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                height: isSmallScreen ? 45 : (isTablet ? 60 : 50),
                marginTop: isSmallScreen ? 8 : 10,
              }
            ]}
            onPress={() => {
              closeAllDropdowns();
              setShowPressureDropdown(!showPressureDropdown);
            }}
          >
            <Text style={[
              styles.grayLabel, 
              { 
                color: isDark ? '#fff' : '#000',
                fontSize: isTablet ? 18 : (isSmallScreen ? 14 : 16)
              }
            ]}>
              {getPressureUnitLabel(pressureUnit)}
            </Text>
          </TouchableOpacity>
          {showPressureDropdown && (
            <DropdownList
              items={[
                { label: isSmallScreen ? 'мм рт.ст.' : 'мм рт.ст. (миллиметры ртутного столба)', value: 'mmHg' },
                { label: isSmallScreen ? 'гПа' : 'гПа (гектопаскали)', value: 'hPa' },
                { label: 'бар', value: 'bar' },
                { label: isSmallScreen ? 'PSI' : 'PSI (фунты на квадратный дюйм)', value: 'psi' },
              ]}
              onSelect={(value) => {
                setPressureUnit(value);
                updateSetting('pressureUnit', value);
              }}
              onClose={() => setShowPressureDropdown(false)}
            />
          )}

          {/* Секция сброса приложения */}
          <View style={[styles.resetSection, {
            marginTop: isSmallScreen ? 30 : 40,
            paddingTop: isSmallScreen ? 20 : 25,
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }]}>
            {/* <Text style={[
              styles.resetSectionTitle, 
              { 
                color: isDark ? '#fff' : '#000',
                fontSize: isTablet ? 20 : (isSmallScreen ? 14 : 16),
                marginBottom: isSmallScreen ? 8 : 10
              }
            ]}>
              Сброс
            </Text> */}
            {/* <Text style={[
              styles.resetDescription, 
              { 
                color: isDark ? '#aaa' : '#666',
                fontSize: isTablet ? 16 : (isSmallScreen ? 12 : 14),
                marginBottom: isSmallScreen ? 15 : 20,
                lineHeight: isTablet ? 22 : (isSmallScreen ? 16 : 18)
              }
            ]}>
              Сброс приложения удалит все настройки, кэшированные данные и вернет приложение к первоначальному состоянию.
            </Text> */}
            <TouchableOpacity
              style={[
                styles.resetButton,
                { 
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  borderColor: '#f44336',
                  borderWidth: 1,
                  height: isSmallScreen ? 45 : (isTablet ? 60 : 50),
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center'
                }
              ]}
              onPress={handleResetApp}
            >
              <View style={styles.resetButtonContent}>
                <Ionicons 
                  name="refresh-outline" 
                  size={isTablet ? 24 : (isSmallScreen ? 18 : 20)} 
                  color="#f44336"
                  style={{ marginRight: 8 }}
                />
                <Text style={[
                  styles.resetButtonText, 
                  { 
                    color: '#f44336',
                    fontSize: isTablet ? 18 : (isSmallScreen ? 14 : 16),
                    fontWeight: '600'
                  }
                ]}>
                  Сбросить приложение
                </Text>
              </View>
            </TouchableOpacity>
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
  scrollContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  backButtonCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'left',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: '500',
  },
  grayButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
  },
  grayLabel: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  suggestionList: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 20,
    marginTop: 10,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  suggestionItemText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  resetSection: {
    // Стили задаются динамически
  },
  resetSectionTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  resetDescription: {
    textAlign: 'center',
  },
  resetButton: {
    // Стили задаются динамически
  },
  resetButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    // Стили задаются динамически
  },
});