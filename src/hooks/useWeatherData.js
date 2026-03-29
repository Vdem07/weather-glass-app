/**
 * useWeatherData
 *
 * Хук для загрузки, кэширования и автообновления погодных данных.
 * Работает с нормализованными данными из weather.js.
 *
 * Логика автообновления:
 * - Свежий кэш — показываем сразу, в сеть не идём
 * - Устаревший кэш — показываем пока грузим, пробуем обновить
 * - Если API недоступен — откладываем обновление, кэш не трогаем
 * - Когда API становится доступным — выполняем отложенное обновление
 *
 * Использование:
 * const { weather, forecast, hourlyForecast, loading, isOffline, loadWeatherData, refreshWeatherData } = useWeatherData(autoRefreshInterval, onToast);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getCurrentWeather, getDailyForecast, getHourlyForecast } from '../api/weather';

const NETWORK_POLL_INTERVAL = 30000;

export const getCoords = async () => {
  const saved = await AsyncStorage.getItem('savedCity');
  if (saved) return JSON.parse(saved);

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const location = await Location.getCurrentPositionAsync({});
  return { lat: location.coords.latitude, lon: location.coords.longitude };
};

// Пробует загрузить все данные — возвращает объект или null при любой ошибке
const tryFetchWeather = async (lat, lon) => {
  try {
    const [current, daily, hourlyRaw] = await Promise.all([
      getCurrentWeather(lat, lon),
      getDailyForecast(lat, lon),
      getHourlyForecast(lat, lon),
    ]);
    return { current, daily, hourly: hourlyRaw.list };
  } catch {
    return null;
  }
};

const getCacheKey = (lat, lon) => `weather_cache_${lat.toFixed(4)}_${lon.toFixed(4)}`;

const saveToCache = async (lat, lon, weather, forecast, hourly) => {
  try {
    await AsyncStorage.setItem(getCacheKey(lat, lon), JSON.stringify({
      weather, forecast, hourly, timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Ошибка сохранения в кэш:', error);
  }
};

const loadFromCache = async (lat, lon, autoRefreshInterval) => {
  try {
    const cached = await AsyncStorage.getItem(getCacheKey(lat, lon));
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    return {
      ...parsed,
      isExpired: Date.now() - parsed.timestamp > parseInt(autoRefreshInterval) * 60 * 1000,
    };
  } catch (error) {
    console.error('Ошибка загрузки из кэша:', error);
    return null;
  }
};

const clearOldCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const maxAge = 365 * 24 * 60 * 60 * 1000;
    for (const key of keys.filter(k => k.startsWith('weather_cache_'))) {
      const cached = await AsyncStorage.getItem(key);
      if (cached && Date.now() - JSON.parse(cached).timestamp > maxAge) {
        await AsyncStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Ошибка очистки старого кэша:', error);
  }
};

export const useWeatherData = (autoRefreshInterval = '30', onToast = () => {}) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const pendingRefresh = useRef(false);

  const applyData = (data, offline) => {
    setWeather(data.weather);
    setForecast(data.forecast);
    setHourlyForecast(data.hourly);
    setIsOffline(offline);
    setLoading(false);
  };

  const loadWeatherData = useCallback(async (lat, lon, forceOnline = false) => {
    setLoading(true);
    try {
      const cached = await loadFromCache(lat, lon, autoRefreshInterval);

      // Свежий кэш — показываем сразу, в сеть не идём
      if (cached && !cached.isExpired && !forceOnline) {
        applyData(cached, false);
        return;
      }

      // Устаревший кэш — показываем пока грузим
      if (cached && !forceOnline) {
        applyData(cached, true);
      }

      // Пробуем загрузить из сети
      const data = await tryFetchWeather(lat, lon);
      if (!data) {
        pendingRefresh.current = true;
        setLoading(false);
        onToast('Нет подключения к интернету', 'warning');
        return;
      }

      await saveToCache(lat, lon, data.current, data.daily, data.hourly);
      applyData({ weather: data.current, forecast: data.daily, hourly: data.hourly }, false);
      pendingRefresh.current = false;

      if (forceOnline) onToast('Данные обновлены', 'success');

    } catch (error) {
      console.error('Ошибка загрузки погоды:', error);
      const cached = await loadFromCache(lat, lon, autoRefreshInterval);
      if (cached) {
        applyData(cached, true);
        onToast('Офлайн режим - данные из кэша', 'warning');
      } else {
        setLoading(false);
        onToast('Ошибка загрузки данных', 'error');
      }
    }
  }, [autoRefreshInterval]);

  const refreshWeatherData = useCallback(async () => {
    try {
      const coords = await getCoords();
      if (coords) await loadWeatherData(coords.lat, coords.lon, true);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  }, [loadWeatherData]);

  // Инициализация
  useEffect(() => {
    (async () => {
      await clearOldCache();
      try {
        const coords = await getCoords();
        if (coords) await loadWeatherData(coords.lat, coords.lon);
        else setLoading(false);
      } catch (error) {
        console.error('Ошибка инициализации:', error);
        setLoading(false);
      }
    })();
  }, []);

  // Автообновление по интервалу
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const coords = await getCoords();
        if (!coords) return;

        const data = await tryFetchWeather(coords.lat, coords.lon);
        if (!data) {
          pendingRefresh.current = true;
          return;
        }

        await saveToCache(coords.lat, coords.lon, data.current, data.daily, data.hourly);
        applyData({ weather: data.current, forecast: data.daily, hourly: data.hourly }, false);
        pendingRefresh.current = false;
        onToast('Данные обновлены', 'success');
      } catch (error) {
        console.error('Ошибка автообновления:', error);
      }
    }, parseInt(autoRefreshInterval) * 60 * 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval]);

  // Следим за отложенным обновлением — выполняем когда API становится доступным
  useEffect(() => {
    const networkPoller = setInterval(async () => {
      if (!pendingRefresh.current) return;
      try {
        const coords = await getCoords();
        if (!coords) return;

        const data = await tryFetchWeather(coords.lat, coords.lon);
        if (!data) return;

        await saveToCache(coords.lat, coords.lon, data.current, data.daily, data.hourly);
        applyData({ weather: data.current, forecast: data.daily, hourly: data.hourly }, false);
        pendingRefresh.current = false;
        onToast('Данные обновлены', 'success');
      } catch (error) {
        console.error('Ошибка отложенного обновления:', error);
      }
    }, NETWORK_POLL_INTERVAL);

    return () => clearInterval(networkPoller);
  }, [loadWeatherData]);

  return {
    weather,
    forecast,
    hourlyForecast,
    loading,
    isOffline,
    loadWeatherData,
    refreshWeatherData,
  };
};
