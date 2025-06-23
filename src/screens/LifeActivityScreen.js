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

  const getVisibilityUnitLabel = (unit) => {
    switch (unit) {
      case 'km':
        return 'км';
      case 'm':
        return 'м';
      case 'mi':
        return 'мили';
      default:
        return 'км';
    }
  };import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeContext } from '../theme/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import WeatherIcon from '../components/WeatherIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LifeActivityScreen({ navigation, route }) {
  const { 
    activityType, 
    title, 
    color, 
    weather, 
    forecast, 
    hourlyForecast,
  } = route.params;
  
  const { isDark } = useThemeContext();
  
  // Состояния для настроек (загружаем из AsyncStorage)
  const [tempUnit, setTempUnit] = useState('metric');
  const [windUnit, setWindUnit] = useState('m/s');
  const [pressureUnit, setPressureUnit] = useState('mmHg');
  const [visibilityUnit, setVisibilityUnit] = useState('km');
  const [useStaticIcons, setUseStaticIcons] = useState(false);
  
  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const iconColor = isDark ? '#fff' : '#333';

  // Загрузка настроек при инициализации
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [unitSetting, windSetting, pressureSetting, visibilitySetting, iconTypeSetting] = await Promise.all([
          AsyncStorage.getItem('unit'),
          AsyncStorage.getItem('windUnit'),
          AsyncStorage.getItem('pressureUnit'),
          AsyncStorage.getItem('visibilityUnit'),
          AsyncStorage.getItem('useStaticIcons')
        ]);

        if (unitSetting) setTempUnit(unitSetting);
        if (windSetting) setWindUnit(windSetting);
        if (pressureSetting) setPressureUnit(pressureSetting);
        if (visibilitySetting) setVisibilityUnit(visibilitySetting);
        if (iconTypeSetting) setUseStaticIcons(iconTypeSetting === 'true');
      } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
      }
    };

    loadSettings();
  }, []);

  // Обновление настроек при возвращении на экран
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const [unitSetting, windSetting, pressureSetting, visibilitySetting, iconTypeSetting] = await Promise.all([
          AsyncStorage.getItem('unit'),
          AsyncStorage.getItem('windUnit'),
          AsyncStorage.getItem('pressureUnit'),
          AsyncStorage.getItem('visibilityUnit'),
          AsyncStorage.getItem('useStaticIcons')
        ]);

        if (unitSetting) setTempUnit(unitSetting);
        if (windSetting) setWindUnit(windSetting);
        if (pressureSetting) setPressureUnit(pressureSetting);
        if (visibilitySetting) setVisibilityUnit(visibilitySetting);
        if (iconTypeSetting) setUseStaticIcons(iconTypeSetting === 'true');
      } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Функции конвертации из HomeScreen
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
        if (visibility >= 1000) {
          return `${(visibility / 1000).toFixed(1)} км`;
        } else {
          return `${(visibility / 1000).toFixed(2)} км`;
        }
    }
  };

  // Функция получения данных для конкретного типа активности
  const getActivityData = () => {
    switch (activityType) {
      case 'allergy':
        return getAllergyData();
      case 'driving':
        return getDrivingData();
      case 'fishing':
        return getFishingData();
      case 'water_recreation':
        return getWaterRecreationData();
      case 'gardening':
        return getGardeningData();
      case 'running':
        return getRunningData();
      default:
        return { conditions: [], forecast: [], recommendations: [] };
    }
  };

  // Функция для получения корректных названий иконок
  const getValidIconName = (iconName) => {
    const iconMap = {
      'flower': 'flower-outline',
      'wind': 'flag-outline',
      'water': 'water-outline',
      'eye': 'eye-outline',
      'car': 'car-outline',
      'umbrella': 'umbrella-outline',
      'fish': 'fish-outline',
      'speedometer': 'speedometer-outline',
      'thermometer': 'thermometer-outline',
      'swimming': 'water-outline',
      'sunny': 'sunny-outline',
      'leaf': 'leaf-outline',
      'walk': 'walk-outline'
    };
    
    return iconMap[iconName] || iconName;
  };

  const getAllergyData = () => {
    const windSpeed = convertWindSpeed(weather.wind.speed, windUnit);
    const humidity = weather.main.humidity;
    const pressure = convertPressure(weather.main.pressure, pressureUnit);
    const temp = convertTemperature(weather.main.temp, tempUnit);
    
    // Расчет индекса пыльцы (упрощенный)
    let pollenIndex = 'Низкий';
    let pollenColor = '#4CAF50';
    let pollenScore = 0;
    
    // Адаптивные пороговые значения для ветра в зависимости от единиц измерения
    let windPollenThreshold, windRecommendationThreshold;
    
    switch (windUnit) {
      case 'm/s':
        windPollenThreshold = 3;
        windRecommendationThreshold = 5;
        break;
      case 'km/h':
        windPollenThreshold = 10.8; // 3 м/с = 10.8 км/ч
        windRecommendationThreshold = 18; // 5 м/с = 18 км/ч
        break;
      case 'mph':
        windPollenThreshold = 6.7; // 3 м/с = 6.7 mph
        windRecommendationThreshold = 11.2; // 5 м/с = 11.2 mph
        break;
      default:
        windPollenThreshold = 3;
        windRecommendationThreshold = 5;
    }
    
    // Адаптивные пороговые значения для температуры
    let tempPollenThreshold;
    if (tempUnit === 'imperial') {
      tempPollenThreshold = 59; // 15°C в Фаренгейтах
    } else {
      tempPollenThreshold = 15;
    }
    
    // Факторы влияния на пыльцу
    if (windSpeed > windPollenThreshold) pollenScore += 2; // Ветер разносит пыльцу
    if (humidity < 50) pollenScore += 1; // Сухой воздух
    if (weather.weather[0].main === 'Clear') pollenScore += 2; // Ясная погода
    if (temp > tempPollenThreshold) pollenScore += 1; // Теплая погода
    
    if (pollenScore >= 5) {
      pollenIndex = 'Очень высокий';
      pollenColor = '#f44336';
    } else if (pollenScore >= 4) {
      pollenIndex = 'Высокий';
      pollenColor = '#FF9800';
    } else if (pollenScore >= 2) {
      pollenIndex = 'Средний';
      pollenColor = '#FFC107';
    }
  
    // Функция для определения цвета видимости в зависимости от единиц измерения
    const getVisibilityColor = () => {
      const visibility = weather.visibility || 10000;
      
      // Конвертируем пороговое значение в зависимости от единицы измерения
      let visibilityThreshold;
      
      switch (visibilityUnit) {
        case 'km':
          visibilityThreshold = 5; // 5 км = 5000 м
          break;
        case 'm':
          visibilityThreshold = 5000;
          break;
        case 'mi':
          visibilityThreshold = 3.11; // 5000 м ≈ 3.11 мили
          break;
        default:
          visibilityThreshold = 5;
      }
      
      // Получаем значение видимости в выбранных единицах
      const visibilityValue = parseFloat(convertVisibility(visibility, visibilityUnit).split(' ')[0]);
      
      return visibilityValue < visibilityThreshold ? '#FF9800' : '#4CAF50';
    };
  
    return {
      conditions: [
        {
          title: 'Индекс\nпыльцы',
          value: pollenIndex,
          color: pollenColor,
          icon: 'flower-outline',
        },
        {
          title: 'Ветер',
          value: `${windSpeed.toFixed(1)} ${getWindSpeedUnit(windUnit)}`,
          color: windSpeed > windRecommendationThreshold ? '#FF9800' : '#4CAF50',
          icon: 'flag-outline',
        },
        {
          title: 'Влажность',
          value: `${humidity}%`,
          color: humidity < 40 ? '#FF9800' : '#4CAF50',
          icon: 'water-outline',
        },
        {
          title: 'Видимость',
          value: convertVisibility(weather.visibility, visibilityUnit),
          color: getVisibilityColor(),
          icon: 'eye-outline',
        }
      ],
      recommendations: [
        pollenScore >= 4 ? 'Избегайте длительного пребывания на улице' : 'Можно гулять без опасений',
        windSpeed > windRecommendationThreshold ? 
          'Сильный ветер усиливает распространение аллергенов' : 
          'Слабый ветер благоприятен для аллергиков',
        humidity < 40 ? 'Низкая влажность повышает концентрацию пыльцы' : 'Влажность в норме',
        'Принимайте антигистаминные препараты при необходимости',
      ]
    };
  };

  const getDrivingData = () => {
    const visibility = weather.visibility || 10000; // в метрах
    const windSpeed = convertWindSpeed(weather.wind.speed, windUnit);
    const isRain = weather.weather[0].main.includes('Rain');
    const isSnow = weather.weather[0].main.includes('Snow');
    const isFog = weather.weather[0].main.includes('Mist') || weather.weather[0].main.includes('Fog');
    
    let drivingScore = 5; // Отличные условия
    let drivingCondition = 'Отличные';
    let drivingColor = '#4CAF50';
    
    // Видимость (оценка в метрах, затем адаптация под единицы измерения)
    if (visibility < 1000) drivingScore -= 3;
    else if (visibility < 5000) drivingScore -= 2;
    else if (visibility < 10000) drivingScore -= 1;
    
    // Ветер (адаптируем пороговые значения под единицу измерения)
    let windDangerousThreshold, windCautiousThreshold;
    
    switch (windUnit) {
      case 'm/s':
        windDangerousThreshold = 15;
        windCautiousThreshold = 10;
        break;
      case 'km/h':
        windDangerousThreshold = 54; // 15 м/с = 54 км/ч
        windCautiousThreshold = 36;  // 10 м/с = 36 км/ч
        break;
      case 'mph':
        windDangerousThreshold = 33.6; // 15 м/с = 33.6 mph
        windCautiousThreshold = 22.4;  // 10 м/с = 22.4 mph
        break;
      default:
        windDangerousThreshold = 15;
        windCautiousThreshold = 10;
    }
    
    if (windSpeed > windDangerousThreshold) drivingScore -= 2;
    else if (windSpeed > windCautiousThreshold) drivingScore -= 1;
    
    // Осадки и туман
    if (isSnow) drivingScore -= 3;
    else if (isRain) drivingScore -= 2;
    else if (isFog) drivingScore -= 2;
    
    // Определение общего состояния
    if (drivingScore <= 1) {
      drivingCondition = 'Опасные';
      drivingColor = '#f44336';
    } else if (drivingScore <= 2) {
      drivingCondition = 'Сложные';
      drivingColor = '#FF9800';
    } else if (drivingScore <= 3) {
      drivingCondition = 'Удовлетворительные';
      drivingColor = '#FFC107';
    } else if (drivingScore <= 4) {
      drivingCondition = 'Хорошие';
      drivingColor = '#8BC34A';
    }
  
    // Функция для определения цвета видимости в зависимости от единиц измерения
    const getVisibilityColor = () => {
      // Конвертируем пороговые значения в зависимости от единицы измерения
      let poorVisibilityThreshold, moderateVisibilityThreshold;
      
      switch (visibilityUnit) {
        case 'km':
          poorVisibilityThreshold = 1; // 1 км = 1000 м
          moderateVisibilityThreshold = 5; // 5 км = 5000 м
          break;
        case 'm':
          poorVisibilityThreshold = 1000;
          moderateVisibilityThreshold = 5000;
          break;
        case 'mi':
          poorVisibilityThreshold = 0.62; // 1000 м ≈ 0.62 мили
          moderateVisibilityThreshold = 3.11; // 5000 м ≈ 3.11 мили
          break;
        default:
          poorVisibilityThreshold = 1;
          moderateVisibilityThreshold = 5;
      }
      
      // Получаем значение видимости в выбранных единицах
      const visibilityValue = parseFloat(convertVisibility(visibility, visibilityUnit).split(' ')[0]);
      
      if (visibilityValue < poorVisibilityThreshold) return '#f44336';
      else if (visibilityValue < moderateVisibilityThreshold) return '#FF9800';
      else return '#4CAF50';
    };
  
    return {
      conditions: [
        {
          title: 'Условия\nвождения',
          value: drivingCondition,
          color: drivingColor,
          icon: 'car-outline',
        },
        {
          title: 'Видимость',
          value: convertVisibility(visibility, visibilityUnit),
          color: getVisibilityColor(),
          icon: 'eye-outline',
        },
        {
          title: 'Ветер',
          value: `${windSpeed.toFixed(1)} ${getWindSpeedUnit(windUnit)}`,
          color: windSpeed > windDangerousThreshold ? '#f44336' : windSpeed > windCautiousThreshold ? '#FF9800' : '#4CAF50',
          icon: 'flag-outline',
        },
        {
          title: 'Осадки',
          value: isRain ? 'Дождь' : isSnow ? 'Снег' : 'Нет',
          color: isSnow ? '#f44336' : isRain ? '#FF9800' : '#4CAF50',
          icon: 'umbrella-outline',
        }
      ],
      recommendations: [
        drivingScore <= 2 ? 'Рекомендуется избегать поездок' : 'Соблюдайте осторожность',
        visibility < 1000 ? 'Очень плохая видимость - включите противотуманные фары' : 'Видимость в норме',
        windSpeed > windDangerousThreshold ? 
          'Сильный ветер - держите руль крепче' : 
          windSpeed > windCautiousThreshold ? 
            'Умеренный ветер - будьте осторожны' : 
            'Ветровые условия нормальные',
        isSnow ? 'Используйте зимнюю резину и цепи' : isRain ? 'Снизьте скорость на мокрой дороге' : 'Дорожные условия благоприятные',
      ]
    };
  };

  const getFishingData = () => {
    const pressure = convertPressure(weather.main.pressure, pressureUnit);
    const windSpeed = convertWindSpeed(weather.wind.speed, windUnit);
    const cloudiness = weather.clouds?.all || 0;
    const temp = convertTemperature(weather.main.temp, tempUnit);
    
    let fishingScore = 0;
    let fishingCondition = 'Плохие';
    let fishingColor = '#f44336';
    
    // Давление (адаптируем оптимальные значения под единицу измерения)
    let pressureOptimalMin, pressureOptimalMax, pressureGoodMin, pressureGoodMax;
    
    switch (pressureUnit) {
      case 'mmHg':
        pressureOptimalMin = 750;
        pressureOptimalMax = 770;
        pressureGoodMin = 740;
        pressureGoodMax = 780;
        break;
      case 'hPa':
        pressureOptimalMin = 1000;
        pressureOptimalMax = 1027;
        pressureGoodMin = 987;
        pressureGoodMax = 1040;
        break;
      case 'bar':
        pressureOptimalMin = 1.000;
        pressureOptimalMax = 1.027;
        pressureGoodMin = 0.987;
        pressureGoodMax = 1.040;
        break;
      case 'psi':
        pressureOptimalMin = 14.5;
        pressureOptimalMax = 14.9;
        pressureGoodMin = 14.3;
        pressureGoodMax = 15.1;
        break;
      default:
        pressureOptimalMin = 750;
        pressureOptimalMax = 770;
        pressureGoodMin = 740;
        pressureGoodMax = 780;
    }
    
    if (pressure >= pressureOptimalMin && pressure <= pressureOptimalMax) fishingScore += 2;
    else if (pressure >= pressureGoodMin && pressure <= pressureGoodMax) fishingScore += 1;
    
    // Ветер (адаптируем под единицу измерения)
    let windOptimalMin, windOptimalMax, windGoodMax;
    
    switch (windUnit) {
      case 'm/s':
        windOptimalMin = 1;
        windOptimalMax = 5;
        windGoodMax = 8;
        break;
      case 'km/h':
        windOptimalMin = 3.6;
        windOptimalMax = 18;
        windGoodMax = 29;
        break;
      case 'mph':
        windOptimalMin = 2.2;
        windOptimalMax = 11.2;
        windGoodMax = 17.9;
        break;
      default:
        windOptimalMin = 1;
        windOptimalMax = 5;
        windGoodMax = 8;
    }
    
    if (windSpeed >= windOptimalMin && windSpeed <= windOptimalMax) fishingScore += 2;
    else if (windSpeed <= windGoodMax) fishingScore += 1;
    
    // Облачность (остается без изменений)
    if (cloudiness >= 20 && cloudiness <= 70) fishingScore += 2;
    else if (cloudiness <= 80) fishingScore += 1;
    
    // Температура воды - для расчета score используем исходную температуру в Цельсиях
    const tempCelsius = weather.main.temp; // Исходная температура в Цельсиях
    const waterTempCelsius = tempCelsius - 2; // Примерное снижение температуры воды в Цельсиях
    
    // Для score всегда используем Цельсии
    if (waterTempCelsius >= 15 && waterTempCelsius <= 25) fishingScore += 1;
    
    // Для отображения конвертируем температуру воды в нужную единицу
    const waterTempDisplay = convertTemperature(waterTempCelsius, tempUnit);
    
    // Определение общего состояния
    if (fishingScore >= 6) {
      fishingCondition = 'Отличные';
      fishingColor = '#4CAF50';
    } else if (fishingScore >= 4) {
      fishingCondition = 'Хорошие';
      fishingColor = '#8BC34A';
    } else if (fishingScore >= 2) {
      fishingCondition = 'Удовлетворительные';
      fishingColor = '#FFC107';
    }
  
    // Функция для форматирования значения давления
    const formatPressure = (value) => {
      switch (pressureUnit) {
        case 'bar':
          return value.toFixed(3);
        case 'psi':
          return value.toFixed(2);
        default:
          return Math.round(value);
      }
    };
  
    // Функция для определения цвета температуры воды (всегда на основе Цельсиев)
    const getWaterTempColor = () => {
      if (waterTempCelsius >= 15 && waterTempCelsius <= 25) return '#4CAF50';
      else return '#FFC107';
    };
  
    return {
      conditions: [
        {
          title: 'Условия для\nрыбалки',
          value: fishingCondition,
          color: fishingColor,
          icon: 'fish-outline',
        },
        {
          title: 'Давление',
          value: `${formatPressure(pressure)} ${getPressureUnitLabel(pressureUnit)}`,
          color: (pressure >= pressureOptimalMin && pressure <= pressureOptimalMax) ? '#4CAF50' : '#FFC107',
          icon: 'speedometer-outline',
        },
        {
          title: 'Ветер',
          value: `${windSpeed.toFixed(1)} ${getWindSpeedUnit(windUnit)}`,
          color: (windSpeed >= windOptimalMin && windSpeed <= windOptimalMax) ? '#4CAF50' : windSpeed <= windGoodMax ? '#FFC107' : '#FF9800',
          icon: 'flag-outline',
        },
        {
          title: 'Температура\nводы',
          value: `~${Math.round(waterTempDisplay)}${getTemperatureSymbol(tempUnit)}`,
          color: getWaterTempColor(), // Используем функцию, которая всегда базируется на Цельсиях
          icon: 'thermometer-outline',
        }
      ],
      recommendations: [
        fishingScore >= 4 ? 'Отличное время для рыбалки!' : 'Клев может быть слабым',
        (pressure >= pressureOptimalMin && pressure <= pressureOptimalMax) ? 
          'Стабильное давление благоприятно для клева' : 
          'Перепады давления могут влиять на активность рыбы',
        (windSpeed >= windOptimalMin && windSpeed <= windOptimalMax) ? 
          'Легкий ветер создает рябь - хорошо для рыбалки' : 
          windSpeed > windGoodMax ? 
            'Сильный ветер затруднит рыбалку' : 
            'Штиль - рыба может быть менее активна',
        'Лучшее время клева: рассвет и закат',
      ]
    };
  };

  const getWaterRecreationData = () => {
    const temp = convertTemperature(weather.main.temp, tempUnit);
    const windSpeed = convertWindSpeed(weather.wind.speed, windUnit);
    const uvIndex = 5; // Примерный UV индекс (в реальном приложении можно получить из API)
    const waterTemp = temp - (tempUnit === 'imperial' ? 4 : 2); // Примерная температура воды
    
    let recreationScore = 0;
    let recreationCondition = 'Неподходящие';
    let recreationColor = '#f44336';
    
    // Адаптивные пороговые значения для температуры воздуха
    let tempExcellentThreshold, tempGoodThreshold;
    if (tempUnit === 'imperial') {
      tempExcellentThreshold = 77; // 25°C = 77°F
      tempGoodThreshold = 68;      // 20°C = 68°F
    } else {
      tempExcellentThreshold = 25;
      tempGoodThreshold = 20;
    }
    
    if (temp >= tempExcellentThreshold) recreationScore += 2;
    else if (temp >= tempGoodThreshold) recreationScore += 1;
    
    // Адаптивные пороговые значения для ветра
    let windCalmThreshold, windModerateThreshold;
    switch (windUnit) {
      case 'm/s':
        windCalmThreshold = 3;
        windModerateThreshold = 6;
        break;
      case 'km/h':
        windCalmThreshold = 10.8; // 3 м/с = 10.8 км/ч
        windModerateThreshold = 21.6; // 6 м/с = 21.6 км/ч
        break;
      case 'mph':
        windCalmThreshold = 6.7; // 3 м/с = 6.7 mph
        windModerateThreshold = 13.4; // 6 м/с = 13.4 mph
        break;
      default:
        windCalmThreshold = 3;
        windModerateThreshold = 6;
    }
    
    if (windSpeed <= windCalmThreshold) recreationScore += 2;
    else if (windSpeed <= windModerateThreshold) recreationScore += 1;
    
    if (weather.weather[0].main === 'Clear') recreationScore += 2;
    else if (weather.weather[0].main === 'Clouds' && weather.clouds?.all < 50) recreationScore += 1;
    
    if (recreationScore >= 5) {
      recreationCondition = 'Отличные';
      recreationColor = '#4CAF50';
    } else if (recreationScore >= 3) {
      recreationCondition = 'Хорошие';
      recreationColor = '#8BC34A';
    } else if (recreationScore >= 1) {
      recreationCondition = 'Удовлетворительные';
      recreationColor = '#FFC107';
    }
  
    // Функции для определения цветов в зависимости от единиц измерения
    const getAirTempColor = () => {
      if (temp >= tempExcellentThreshold) return '#4CAF50';
      else if (temp >= tempGoodThreshold) return '#FFC107';
      else return '#FF9800';
    };
  
    const getWaterTempColor = () => {
      let waterTempExcellentThreshold, waterTempGoodThreshold;
      if (tempUnit === 'imperial') {
        waterTempExcellentThreshold = 72; // 22°C = 72°F
        waterTempGoodThreshold = 64;      // 18°C = 64°F
      } else {
        waterTempExcellentThreshold = 22;
        waterTempGoodThreshold = 18;
      }
      
      if (waterTemp >= waterTempExcellentThreshold) return '#4CAF50';
      else if (waterTemp >= waterTempGoodThreshold) return '#FFC107';
      else return '#FF9800';
    };
  
    return {
      conditions: [
        {
          title: 'Условия\nдля отдыха',
          value: recreationCondition,
          color: recreationColor,
          icon: 'water-outline',
        },
        {
          title: 'Температура\nвоздуха',
          value: `${Math.round(temp)}${getTemperatureSymbol(tempUnit)}`,
          color: getAirTempColor(),
          icon: 'thermometer-outline',
        },
        {
          title: 'Температура\nводы',
          value: `~${Math.round(waterTemp)}${getTemperatureSymbol(tempUnit)}`,
          color: getWaterTempColor(),
          icon: 'water-outline',
        },
        {
          title: 'UV индекс',
          value: `${uvIndex}/10`,
          color: uvIndex <= 2 ? '#4CAF50' : uvIndex <= 5 ? '#FFC107' : uvIndex <= 7 ? '#FF9800' : '#f44336',
          icon: 'sunny-outline',
        }
      ],
      recommendations: [
        temp >= tempExcellentThreshold ? 
          'Отличная погода для купания' : 
          temp >= tempGoodThreshold ? 
            'Прохладно, но можно загорать' : 
            'Слишком прохладно для водных процедур',
        windSpeed <= windCalmThreshold ? 
          'Спокойные условия на воде' : 
          windSpeed <= windModerateThreshold ? 
            'Легкий ветерок - комфортно' : 
            'Ветрено - возможны волны',
        uvIndex > 7 ? 
          'Высокий UV - используйте солнцезащитный крем' : 
          uvIndex > 3 ? 
            'Умеренный UV - защита от солнца рекомендуется' : 
            'Низкий UV - безопасно загорать',
        'Не забывайте пить достаточно воды',
      ]
    };
  };

  const getGardeningData = () => {
    const temp = convertTemperature(weather.main.temp, tempUnit);
    const humidity = weather.main.humidity;
    const windSpeed = convertWindSpeed(weather.wind.speed, windUnit);
    const isRain = weather.weather[0].main.includes('Rain');
    
    let gardeningScore = 0;
    let gardeningCondition = 'Неподходящие';
    let gardeningColor = '#f44336';
    
    // Адаптивные пороговые значения для температуры
    let tempOptimalMin, tempOptimalMax, tempGoodMin, tempGoodMax;
    if (tempUnit === 'imperial') {
      tempOptimalMin = 59; // 15°C = 59°F
      tempOptimalMax = 82; // 28°C = 82°F
      tempGoodMin = 50;    // 10°C = 50°F
      tempGoodMax = 90;    // 32°C = 90°F
    } else {
      tempOptimalMin = 15;
      tempOptimalMax = 28;
      tempGoodMin = 10;
      tempGoodMax = 32;
    }
    
    if (temp >= tempOptimalMin && temp <= tempOptimalMax) gardeningScore += 2;
    else if (temp >= tempGoodMin && temp <= tempGoodMax) gardeningScore += 1;
    
    if (humidity >= 40 && humidity <= 70) gardeningScore += 2;
    else if (humidity >= 30 && humidity <= 80) gardeningScore += 1;
    
    // Адаптивные пороговые значения для ветра
    let windThreshold;
    switch (windUnit) {
      case 'm/s':
        windThreshold = 5;
        break;
      case 'km/h':
        windThreshold = 18; // 5 м/с = 18 км/ч
        break;
      case 'mph':
        windThreshold = 11.2; // 5 м/с = 11.2 mph
        break;
      default:
        windThreshold = 5;
    }
    
    if (windSpeed <= windThreshold) gardeningScore += 1;
    
    if (!isRain) gardeningScore += 1;
    
    if (gardeningScore >= 5) {
      gardeningCondition = 'Отличные';
      gardeningColor = '#4CAF50';
    } else if (gardeningScore >= 3) {
      gardeningCondition = 'Хорошие';
      gardeningColor = '#8BC34A';
    } else if (gardeningScore >= 1) {
      gardeningCondition = 'Удовлетворительные';
      gardeningColor = '#FFC107';
    }
  
    // Функция для определения цвета температуры
    const getTempColor = () => {
      if (temp >= tempOptimalMin && temp <= tempOptimalMax) return '#4CAF50';
      else if (temp >= tempGoodMin && temp <= tempGoodMax) return '#FFC107';
      else return '#FF9800';
    };
  
    return {
      conditions: [
        {
          title: 'Условия для\nсадоводства',
          value: gardeningCondition,
          color: gardeningColor,
          icon: 'leaf-outline',
        },
        {
          title: 'Температура',
          value: `${Math.round(temp)}${getTemperatureSymbol(tempUnit)}`,
          color: getTempColor(),
          icon: 'thermometer-outline',
        },
        {
          title: 'Влажность',
          value: `${humidity}%`,
          color: (humidity >= 40 && humidity <= 70) ? '#4CAF50' : (humidity >= 30 && humidity <= 80) ? '#FFC107' : '#FF9800',
          icon: 'water-outline',
        },
        {
          title: 'Полив',
          value: isRain ? 'Не требуется' : 'Рекомендуется',
          color: isRain ? '#4CAF50' : '#2196F3',
          icon: 'umbrella-outline',
        }
      ],
      recommendations: [
        (temp >= tempOptimalMin && temp <= tempOptimalMax) ? 
          'Идеальная температура для работы в саду' : 
          temp < tempOptimalMin ? 
            'Прохладно - защитите теплолюбивые растения' : 
            'Жарко - поливайте растения чаще',
        (humidity >= 40 && humidity <= 70) ? 
          'Оптимальная влажность для растений' : 
          humidity < 40 ? 
            'Сухой воздух - увеличьте полив' : 
            'Высокая влажность - следите за грибковыми заболеваниями',
        isRain ? 
          'Дождь обеспечит естественный полив' : 
          'Хорошее время для полива и прополки',
        windSpeed <= windThreshold ? 
          'Спокойные условия для работы' : 
          'Ветрено - отложите опрыскивание растений',
      ]
    };
  };

  const getRunningData = () => {
    const temp = convertTemperature(weather.main.temp, tempUnit);
    const humidity = weather.main.humidity;
    const windSpeed = convertWindSpeed(weather.wind.speed, windUnit);
    const isRain = weather.weather[0].main.includes('Rain');
    const uvIndex = 5; // Примерный UV индекс
    
    let runningScore = 0;
    let runningCondition = 'Неподходящие';
    let runningColor = '#f44336';
    
    // Адаптивные пороговые значения для температуры
    let tempOptimalMin, tempOptimalMax, tempGoodMin, tempGoodMax;
    if (tempUnit === 'imperial') {
      tempOptimalMin = 50; // 10°C = 50°F
      tempOptimalMax = 68; // 20°C = 68°F
      tempGoodMin = 41;    // 5°C = 41°F
      tempGoodMax = 77;    // 25°C = 77°F
    } else {
      tempOptimalMin = 10;
      tempOptimalMax = 20;
      tempGoodMin = 5;
      tempGoodMax = 25;
    }
    
    if (temp >= tempOptimalMin && temp <= tempOptimalMax) runningScore += 2;
    else if (temp >= tempGoodMin && temp <= tempGoodMax) runningScore += 1;
    
    if (humidity <= 60) runningScore += 2;
    else if (humidity <= 75) runningScore += 1;
    
    // Адаптивные пороговые значения для ветра
    let windThreshold;
    switch (windUnit) {
      case 'm/s':
        windThreshold = 3;
        break;
      case 'km/h':
        windThreshold = 10.8; // 3 м/с = 10.8 км/ч
        break;
      case 'mph':
        windThreshold = 6.7; // 3 м/с = 6.7 mph
        break;
      default:
        windThreshold = 3;
    }
    
    if (windSpeed <= windThreshold) runningScore += 1;
    
    if (!isRain) runningScore += 2;
    
    if (runningScore >= 6) {
      runningCondition = 'Отличные';
      runningColor = '#4CAF50';
    } else if (runningScore >= 4) {
      runningCondition = 'Хорошие';
      runningColor = '#8BC34A';
    } else if (runningScore >= 2) {
      runningCondition = 'Удовлетворительные';
      runningColor = '#FFC107';
    }
  
    // Функция для определения цвета температуры
    const getTempColor = () => {
      if (temp >= tempOptimalMin && temp <= tempOptimalMax) return '#4CAF50';
      else if (temp >= tempGoodMin && temp <= tempGoodMax) return '#FFC107';
      else return '#FF9800';
    };
  
    return {
      conditions: [
        {
          title: 'Условия\nдля бега',
          value: runningCondition,
          color: runningColor,
          icon: 'walk-outline',
        },
        {
          title: 'Температура',
          value: `${Math.round(temp)}${getTemperatureSymbol(tempUnit)}`,
          color: getTempColor(),
          icon: 'thermometer-outline',
        },
        {
          title: 'Влажность',
          value: `${humidity}%`,
          color: humidity <= 60 ? '#4CAF50' : humidity <= 75 ? '#FFC107' : '#FF9800',
          icon: 'water-outline',
        },
        {
          title: 'UV индекс',
          value: `${uvIndex}/10`,
          color: uvIndex <= 2 ? '#4CAF50' : uvIndex <= 5 ? '#FFC107' : uvIndex <= 7 ? '#FF9800' : '#f44336',
          icon: 'sunny-outline',
        }
      ],
      recommendations: [
        (temp >= tempOptimalMin && temp <= tempOptimalMax) ? 
          'Идеальная температура для бега' : 
          temp < tempOptimalMin ? 
            'Прохладно - одевайтесь теплее' : 
            'Жарко - бегайте рано утром или вечером',
        humidity <= 60 ? 
          'Комфортная влажность' : 
          humidity <= 75 ? 
            'Повышенная влажность - больше пейте воды' : 
            'Высокая влажность - сократите интенсивность тренировки',
        isRain ? 
          'Дождь - лучше заниматься в помещении' : 
          windSpeed <= windThreshold ? 
            'Сухая погода и спокойный ветер - отлично для бега' : 
            'Сухая погода, но ветрено - будьте осторожны',
        uvIndex > 5 ? 
          'Высокий UV - используйте солнцезащитный крем и кепку' : 
          'Безопасный уровень UV излучения',
      ]
    };
  };

  const activityData = getActivityData();

  // Получение прогноза для активности на несколько дней
  const getActivityForecast = () => {
    return forecast.slice(0, 5).map(day => {
      const dayTemp = day.temp;
      let score = 0;
      let condition = 'Плохие';
      let conditionColor = '#f44336';

      // Упрощенная оценка для каждого типа активности
      switch (activityType) {
        case 'allergy':
          if (dayTemp > 15) score += 1;
          if (day.main !== 'Rain') score += 1;
          break;
        case 'driving':
          if (day.main !== 'Rain' && day.main !== 'Snow') score += 2;
          break;
        case 'fishing':
          if (dayTemp >= 15 && dayTemp <= 25) score += 1;
          if (day.main === 'Clouds') score += 1;
          break;
        case 'water_recreation':
          if (dayTemp >= 25) score += 2;
          else if (dayTemp >= 20) score += 1;
          if (day.main === 'Clear') score += 1;
          break;
        case 'gardening':
          if (dayTemp >= 15 && dayTemp <= 28) score += 1;
          if (day.main !== 'Rain') score += 1;
          break;
        case 'running':
          if (dayTemp >= 10 && dayTemp <= 20) score += 2;
          else if (dayTemp >= 5 && dayTemp <= 25) score += 1;
          if (day.main !== 'Rain') score += 1;
          break;
      }

      if (score >= 3) {
        condition = 'Отличные';
        conditionColor = '#4CAF50';
      } else if (score >= 2) {
        condition = 'Хорошие';
        conditionColor = '#8BC34A';
      } else if (score >= 1) {
        condition = 'Удовлетворительные';
        conditionColor = '#FFC107';
      }

      return {
        date: day.date,
        condition,
        conditionColor,
        temp: dayTemp,
        weather: day.main,
        description: day.description
      };
    });
  };

  const forecastData = getActivityForecast();

  return (
    <ImageBackground
      source={backgroundImage}
      resizeMode="cover"
      style={styles.background}
      blurRadius={70}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
        
{/* Header */}
<View style={styles.header}>
  <TouchableOpacity
    onPress={() => navigation.goBack()}
    style={[
      styles.backButton,
      { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }
    ]}
  >
    <Ionicons name="chevron-back" size={20} color={textColor} />
  </TouchableOpacity>

  <View style={styles.headerContent}>
    <View style={[styles.activityIcon, { backgroundColor: color }]}>
      <Image 
        source={
          activityType === 'allergy' ? require('../assets/icons/allergy.png') :
          activityType === 'driving' ? require('../assets/icons/driving.png') :
          activityType === 'fishing' ? require('../assets/icons/fishing.png') :
          activityType === 'water_recreation' ? require('../assets/icons/swimming.png') :
          activityType === 'gardening' ? require('../assets/icons/gardening.png') :
          activityType === 'running' ? require('../assets/icons/running.png') : 
          require('../assets/icons/allergy.png')
        } 
        style={styles.activityIconImage}
        resizeMode="contain"
      />
    </View>
    <Text style={[styles.title, { color: textColor }]}>{title}</Text>
  </View>

  <TouchableOpacity
    onPress={() => navigation.navigate('Settings')}
    style={[
      styles.settingsButton,
      { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }
    ]}
  >
    <Ionicons name="settings" size={20} color={iconColor} />
  </TouchableOpacity>
</View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          
          {/* Текущие условия */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Текущие условия
            </Text>
            
            <View style={styles.conditionsGrid}>
              {activityData.conditions.map((condition, index) => (
                <View 
                  key={index}
                  style={[
                    styles.conditionCard,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                  ]}
                >
                  <View style={styles.conditionHeader}>
                    <Ionicons name={getValidIconName(condition.icon)} size={24} color={condition.color} />
                    <Text style={[styles.conditionTitle, { color: textColor }]}>
                      {condition.title}
                    </Text>
                  </View>
                  <View style={[
                    styles.conditionValueWrapper,
                    { backgroundColor: condition.color }
                  ]}>
                    <Text style={styles.conditionValue}>
                      {condition.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Рекомендации */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Рекомендации
            </Text>
            
            <View style={[
              styles.recommendationsContainer,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
            ]}>
              {activityData.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={[styles.recommendationDot, { backgroundColor: color }]} />
                  <Text style={[styles.recommendationText, { color: textColor }]}>
                    {recommendation}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Прогноз на 5 дней */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Прогноз условий
            </Text>
            
            <View style={styles.forecastContainer}>
              {forecastData.map((item, index) => (
                <View 
                  key={index}
                  style={[
                    styles.forecastCard,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }
                  ]}
                >
                  <View style={styles.forecastLeft}>
                    <Text style={[styles.forecastDate, { color: textColor }]}>
                      {new Date(item.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                    <Text style={[styles.forecastDay, { color: secondaryTextColor }]}>
                      {new Date(item.date).toLocaleDateString('ru-RU', {
                        weekday: 'short',
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.forecastCenter}>
                    <WeatherIcon
                      weatherMain={item.weather}
                      weatherDescription={item.description}
                      style={styles.forecastWeatherIcon}
                      width={40}
                      height={40}
                      useStaticIcons={useStaticIcons}
                    />
                    <Text style={[styles.forecastTemp, { color: textColor }]}>
                      {Math.round(convertTemperature(item.temp, tempUnit))}°
                    </Text>
                  </View>
                  
                  <View style={styles.forecastRight}>
                    <View style={[
                      styles.conditionBadge,
                      { backgroundColor: item.conditionColor }
                    ]}>
                      <Text style={styles.conditionBadgeText}>
                        {item.condition}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Почасовой прогноз на сегодня */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Сегодня по часам
            </Text>
            
            <FlatList
              data={hourlyForecast.slice(0, 8)}
              horizontal
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.hourlyForecastList}
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -15 }} // Компенсируем отступы контейнера
              renderItem={({ item, index }) => {
                // Простая оценка условий для часа
                let hourScore = 0;
                const hourTemp = item.main.temp;
                
                switch (activityType) {
                  case 'allergy':
                    if (hourTemp > 15) hourScore += 1;
                    if (!item.weather[0].main.includes('Rain')) hourScore += 1;
                    break;
                  case 'driving':
                    if (!item.weather[0].main.includes('Rain') && !item.weather[0].main.includes('Snow')) hourScore += 2;
                    break;
                  case 'fishing':
                    if (hourTemp >= 15 && hourTemp <= 25) hourScore += 2;
                    break;
                  case 'water_recreation':
                    if (hourTemp >= 25) hourScore += 2;
                    else if (hourTemp >= 20) hourScore += 1;
                    break;
                  case 'gardening':
                    if (hourTemp >= 15 && hourTemp <= 28) hourScore += 1;
                    if (!item.weather[0].main.includes('Rain')) hourScore += 1;
                    break;
                  case 'running':
                    if (hourTemp >= 10 && hourTemp <= 20) hourScore += 2;
                    if (!item.weather[0].main.includes('Rain')) hourScore += 1;
                    break;
                }

                const hourColor = hourScore >= 2 ? '#4CAF50' : hourScore >= 1 ? '#FFC107' : '#FF9800';

                return (
                  <View style={[
                    styles.hourlyCard,
                    { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      marginRight: index === hourlyForecast.slice(0, 8).length - 1 ? 15 : 10, // Последняя карточка с правым отступом
                    }
                  ]}>
                    <Text style={[styles.hourlyTime, { color: textColor }]}>
                      {new Date(item.dt_txt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    
                    <WeatherIcon
                      weatherMain={item.weather[0].main}
                      weatherDescription={item.weather[0].description}
                      style={styles.hourlyWeatherIcon}
                      width={30}
                      height={30}
                      useStaticIcons={useStaticIcons}
                    />
                    
                    <Text style={[styles.hourlyTemp, { color: textColor }]}>
                      {Math.round(convertTemperature(hourTemp, tempUnit))}°
                    </Text>
                    
                    <View style={[styles.hourlyIndicator, { backgroundColor: hourColor }]} />
                  </View>
                );
              }}
            />
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
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 15, // Добавляем отступы для симметрии
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Content
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 70,
    gap: 20,
  },
  
  section: {
    gap: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
  },

 // Current conditions
 conditionsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
},
conditionCard: {
  width: '48%',
  borderRadius: 16,
  padding: 10,
  gap: 10,
  minHeight: 110,
},
conditionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginBottom: 12,
  flex: 1,
},
conditionTitle: {
  fontSize: 14,
  fontWeight: '600',
  lineHeight: 16,
},
conditionValueWrapper: {
  borderRadius: 18,
  paddingHorizontal: 4,
  paddingVertical: 4,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 30,
},
conditionValue: {
  fontSize: 12,
  fontWeight: 'bold',
  lineHeight: 20,
  color: '#FFFFFF', // Белый текст для контраста
  textAlign: 'center',
},

  // Recommendations
  recommendationsContainer: {
    borderRadius: 16,
    padding: 20,
    gap: 15,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recommendationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },

  // Forecast
  forecastContainer: {
    gap: 12,
  },
  forecastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  forecastLeft: {
    alignItems: 'flex-start',
    minWidth: 50,
  },
  forecastDate: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  forecastDay: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  forecastCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  forecastWeatherIcon: {
    width: 40,
    height: 40,
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: '600',
  },
  forecastRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  conditionBadge: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 18,
    minHeight: 30,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Hourly forecast
  hourlyForecastList: {
    paddingLeft: 15, // Только левый отступ
  },
  hourlyCard: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    width: 70,
    gap: 8,
    // marginRight убираем отсюда, так как он устанавливается динамически
  },
  hourlyTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  hourlyWeatherIcon: {
    width: 30,
    height: 30,
  },
  hourlyTemp: {
    fontSize: 14,
    fontWeight: '600',
  },
  hourlyIndicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
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
});