import React from 'react';
import { SmallWeatherWidget } from './widgets/SmallWeatherWidget';
import { MediumWeatherWidget } from './widgets/MediumWeatherWidget';
import { LargeWeatherWidget } from './widgets/LargeWeatherWidget';
import { getCurrentWeather, getDailyForecast } from '../api/weather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const nameToWidget = {
  SmallWeather: SmallWeatherWidget,
  MediumWeather: MediumWeatherWidget,
  LargeWeather: LargeWeatherWidget,
};

// Функция получения данных о погоде для виджетов
async function getWeatherData() {
  try {
    // Получаем координаты из сохраненного города или геолокации
    const savedCity = await AsyncStorage.getItem('savedCity');
    let lat, lon;

    if (savedCity) {
      const coords = JSON.parse(savedCity);
      lat = coords.lat;
      lon = coords.lon;
    } else {
      // Используем геолокацию
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      lat = location.coords.latitude;
      lon = location.coords.longitude;
    }

    // Получаем данные о погоде
    const [currentWeather, forecast] = await Promise.all([
      getCurrentWeather(lat, lon),
      getDailyForecast(lat, lon),
    ]);

    return {
      current: currentWeather,
      forecast: forecast.slice(0, 5), // Первые 5 дней
      error: null
    };
  } catch (error) {
    console.error('Error getting weather data for widget:', error);
    
    // Пытаемся получить кэшированные данные
    try {
      const cachedData = await getCachedWeatherData();
      if (cachedData) {
        return {
          ...cachedData,
          error: 'Offline data'
        };
      }
    } catch (cacheError) {
      console.error('No cached data available:', cacheError);
    }
    
    return {
      current: null,
      forecast: null,
      error: error.message || 'Failed to load weather data'
    };
  }
}

// Функция получения кэшированных данных
async function getCachedWeatherData() {
  try {
    const savedCity = await AsyncStorage.getItem('savedCity');
    let cacheKey = 'weather_cache_default';
    
    if (savedCity) {
      const coords = JSON.parse(savedCity);
      cacheKey = `weather_cache_${coords.lat.toFixed(4)}_${coords.lon.toFixed(4)}`;
    }
    
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return {
        current: parsed.weather,
        forecast: parsed.forecast
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading cached weather data:', error);
    return null;
  }
}

// Функция получения настроек температуры
async function getTemperatureUnit() {
  try {
    const unit = await AsyncStorage.getItem('unit');
    return unit || 'metric';
  } catch (error) {
    return 'metric';
  }
}

// Функция конвертации температуры
function convertTemperature(temp, unit) {
  if (unit === 'imperial') {
    return Math.round((temp * 9/5) + 32);
  }
  return Math.round(temp);
}

// Функция получения символа температуры
function getTemperatureSymbol(unit) {
  return unit === 'imperial' ? '°F' : '°C';
}

// Функция получения описания погоды на русском
function getWeatherDescription(weather) {
  if (!weather || !weather.weather || !weather.weather[0]) {
    return 'Неизвестно';
  }
  return weather.weather[0].description || 'Неизвестно';
}

// Функция получения иконки погоды (emoji)
function getWeatherIcon(weather) {
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
}

// Основной обработчик виджетов
export async function widgetTaskHandler(props) {
  const widgetInfo = props.widgetInfo;
  const Widget = nameToWidget[widgetInfo.widgetName];

  if (!Widget) {
    console.error(`Widget ${widgetInfo.widgetName} not found`);
    return;
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
      try {
        // Получаем данные о погоде
        const weatherData = await getWeatherData();
        const tempUnit = await getTemperatureUnit();
        const tempSymbol = getTemperatureSymbol(tempUnit);
        
        // Подготавливаем данные для виджета
        const widgetData = {
          ...weatherData,
          tempUnit,
          tempSymbol,
          convertTemperature: (temp) => convertTemperature(temp, tempUnit),
          getWeatherDescription,
          getWeatherIcon,
        };
        
        // Рендерим виджет с данными
        props.renderWidget(<Widget {...widgetData} />);
      } catch (error) {
        console.error('Error updating widget:', error);
        // Рендерим виджет с ошибкой
        props.renderWidget(<Widget error="Failed to load data" />);
      }
      break;

    case 'WIDGET_RESIZED':
      // Обновляем виджет при изменении размера
      const resizeWeatherData = await getWeatherData();
      const resizeTempUnit = await getTemperatureUnit();
      const resizeTempSymbol = getTemperatureSymbol(resizeTempUnit);
      
      const resizeWidgetData = {
        ...resizeWeatherData,
        tempUnit: resizeTempUnit,
        tempSymbol: resizeTempSymbol,
        convertTemperature: (temp) => convertTemperature(temp, resizeTempUnit),
        getWeatherDescription,
        getWeatherIcon,
      };
      
      props.renderWidget(<Widget {...resizeWidgetData} />);
      break;

    case 'WIDGET_DELETED':
      // Можно очистить кэш или выполнить другие действия при удалении
      console.log(`Widget ${widgetInfo.widgetName} deleted`);
      break;

    case 'WIDGET_CLICK':
      // Обрабатываем клики по виджету
      // Можно открыть приложение или выполнить другие действия
      console.log(`Widget ${widgetInfo.widgetName} clicked`);
      break;

    default:
      break;
  }
}