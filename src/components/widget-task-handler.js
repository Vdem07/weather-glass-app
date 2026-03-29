import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { SmallWeatherWidget }  from './widgets/SmallWeatherWidget';
import { MediumWeatherWidget } from './widgets/MediumWeatherWidget';
import { LargeWeatherWidget }  from './widgets/LargeWeatherWidget';
import { getCurrentWeather, getDailyForecast } from '../api/weather';
import { convertTemperature, getTemperatureSymbol } from '../utils/weatherUnits';

const nameToWidget = {
  SmallWeather:  SmallWeatherWidget,
  MediumWeather: MediumWeatherWidget,
  LargeWeather:  LargeWeatherWidget,
};

// Координаты из сохранённого города или геолокации
const getCoords = async () => {
  const saved = await AsyncStorage.getItem('savedCity');
  if (saved) return JSON.parse(saved);

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission denied');

  const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: location.coords.latitude, lon: location.coords.longitude };
};

// Читает данные из кэша приложения
const loadFromCache = async () => {
  try {
    const saved = await AsyncStorage.getItem('savedCity');
    const key = saved
      ? `weather_cache_${JSON.parse(saved).lat.toFixed(4)}_${JSON.parse(saved).lon.toFixed(4)}`
      : null;
    if (!key) return null;
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;
    const { weather, forecast } = JSON.parse(cached);
    return { current: weather, forecast };
  } catch {
    return null;
  }
};

// Пробует загрузить свежие данные из сети
const tryFetchWeather = async () => {
  try {
    const { lat, lon } = await getCoords();
    const [current, forecast] = await Promise.all([
      getCurrentWeather(lat, lon),
      getDailyForecast(lat, lon),
    ]);
    return { current, forecast: forecast.slice(0, 5) };
  } catch {
    return null;
  }
};

// Иконка погоды — работает с нормализованными данными
const getWeatherIcon = (weather) => {
  if (!weather) return '❓';
  const main = weather.main?.toLowerCase();
  const isDay = Date.now() / 1000 >= weather.sunrise && Date.now() / 1000 < weather.sunset;
  switch (main) {
    case 'clear':        return isDay ? '☀️' : '🌙';
    case 'clouds':       return weather.clouds < 25 ? (isDay ? '🌤️' : '🌙') : weather.clouds < 75 ? '⛅' : '☁️';
    case 'rain':         return weather.weatherId >= 511 ? '🌧️' : '🌦️';
    case 'drizzle':      return '🌦️';
    case 'thunderstorm': return '⛈️';
    case 'snow':         return '🌨️';
    case 'mist': case 'fog': case 'haze': case 'dust': case 'sand': return '🌫️';
    default:             return isDay ? '☀️' : '🌙';
  }
};

const getWeatherDescription = (weather) => weather?.description || 'Неизвестно';

// Собирает props для виджета
const buildWidgetData = async (weatherData, isOffline = false) => {
  const tempUnit = await AsyncStorage.getItem('unit') || 'metric';
  return {
    ...weatherData,
    tempUnit,
    tempSymbol:          getTemperatureSymbol(tempUnit),
    convertTemperature:  (temp) => Math.round(convertTemperature(temp, tempUnit)),
    getWeatherDescription,
    getWeatherIcon,
    error:               isOffline ? 'Offline data' : null,
  };
};

// Основная логика: сначала кэш, потом сеть в фоне
const renderWidgetWithData = async (Widget, renderWidget) => {
  // 1. Сначала показываем кэш — мгновенно
  const cached = await loadFromCache();
  if (cached) {
    const data = await buildWidgetData(cached, true);
    renderWidget(<Widget {...data} />);
  }

  // 2. Пробуем обновить из сети
  const fresh = await tryFetchWeather();
  if (fresh) {
    const data = await buildWidgetData(fresh, false);
    renderWidget(<Widget {...data} />);
  }

  // 3. Если нет ни кэша ни сети — показываем ошибку
  if (!cached && !fresh) {
    renderWidget(<Widget error="Failed to load data" />);
  }
};

export async function widgetTaskHandler(props) {
  const Widget = nameToWidget[props.widgetInfo.widgetName];
  if (!Widget) return;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      await renderWidgetWithData(Widget, props.renderWidget);
      break;

    case 'WIDGET_DELETED':
    case 'WIDGET_CLICK':
      break;

    default:
      break;
  }
}
