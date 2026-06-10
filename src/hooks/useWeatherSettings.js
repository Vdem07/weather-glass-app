/**
 * useWeatherSettings
 *
 * Хук для загрузки и хранения пользовательских настроек приложения из AsyncStorage.
 * Используется в HomeScreen, LifeActivityScreen, WeatherMapScreen, WidgetPreviewScreen.
 *
 * Возвращает:
 * - settings: объект со всеми настройками
 * - loadSettings: функция для перезагрузки настроек (например, при возврате на экран)
 */

import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULTS = {
  tempUnit:          'metric',
  windUnit:          'm/s',
  pressureUnit:      'mmHg',
  visibilityUnit:    'km',
  autoRefreshInterval: '30',
  cardsLayout:       'horizontal',
  useStaticIcons:    false,
  useGeo:            true,
  showLifeSection:   true,
  showAiSection: true,
};

export const useWeatherSettings = () => {
  const [settings, setSettings] = useState(DEFAULTS);

  const loadSettings = useCallback(async () => {
    try {
      const [
        tempUnit,
        windUnit,
        pressureUnit,
        visibilityUnit,
        autoRefreshInterval,
        cardsLayout,
        useStaticIcons,
        useGeo,
        showLifeSection,
        showAiSection,
      ] = await Promise.all([
        AsyncStorage.getItem('unit'),
        AsyncStorage.getItem('windUnit'),
        AsyncStorage.getItem('pressureUnit'),
        AsyncStorage.getItem('visibilityUnit'),
        AsyncStorage.getItem('autoRefreshInterval'),
        AsyncStorage.getItem('cardsLayout'),
        AsyncStorage.getItem('useStaticIcons'),
        AsyncStorage.getItem('useGeo'),
        AsyncStorage.getItem('showLifeSection'),
        AsyncStorage.getItem('showAiSection'),
      ]);

      setSettings({
        tempUnit:            tempUnit          || DEFAULTS.tempUnit,
        windUnit:            windUnit          || DEFAULTS.windUnit,
        pressureUnit:        pressureUnit      || DEFAULTS.pressureUnit,
        visibilityUnit:      visibilityUnit    || DEFAULTS.visibilityUnit,
        autoRefreshInterval: autoRefreshInterval || DEFAULTS.autoRefreshInterval,
        cardsLayout:         cardsLayout       || DEFAULTS.cardsLayout,
        useStaticIcons:      useStaticIcons    === 'true',
        useGeo:              useGeo            !== 'false',
        showLifeSection:     showLifeSection   !== 'false',
        showAiSection:       showAiSection   !== 'false',
      });
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  }, []);

  return { settings, loadSettings };
};
