/**
 * useWeatherData
 *
 * Хук для загрузки, кэширования и автообновления погодных данных.
 * Работает с нормализованными данными из weather.js — не знает про
 * структуру ответа API.
 *
 * Использование:
 * const { weather, forecast, hourlyForecast, loading, isOffline, loadWeatherData, refreshWeatherData } = useWeatherData(autoRefreshInterval, onToast);
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getCurrentWeather, getDailyForecast, getHourlyForecast } from '../api/weather';

// Получить координаты из сохранённого города или геолокации
export const getCoords = async () => {
  const saved = await AsyncStorage.getItem('savedCity');
  if (saved) return JSON.parse(saved);

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const location = await Location.getCurrentPositionAsync({});
  return { lat: location.coords.latitude, lon: location.coords.longitude };
};

const getCacheKey = (lat, lon) => `weather_cache_${lat.toFixed(4)}_${lon.toFixed(4)}`;

const saveToCache = async (lat, lon, weather, forecast, hourly) => {
  try {
    await AsyncStorage.setItem(getCacheKey(lat, lon), JSON.stringify({
      weather,
      forecast,
      hourly,
      timestamp: Date.now(),
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
      if (!forceOnline) {
        const cached = await loadFromCache(lat, lon, autoRefreshInterval);
        if (cached) {
          applyData(cached, true);
          if (cached.isExpired) loadWeatherData(lat, lon, true);
          return;
        }
      }

      const [current, daily, hourlyRaw] = await Promise.all([
        getCurrentWeather(lat, lon),
        getDailyForecast(lat, lon),
        getHourlyForecast(lat, lon),
      ]);

      // current и hourlyRaw.list уже нормализованы в weather.js
      await saveToCache(lat, lon, current, daily, hourlyRaw.list);
      applyData({ weather: current, forecast: daily, hourly: hourlyRaw.list }, false);

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

  // Автообновление
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const coords = await getCoords();
        if (coords) await loadWeatherData(coords.lat, coords.lon, true);
      } catch (error) {
        console.error('Ошибка автообновления:', error);
      }
    }, parseInt(autoRefreshInterval) * 60 * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval]);

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
