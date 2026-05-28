/**
 * SettingsScreen
 *
 * Экран настроек приложения.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Alert, Linking } from 'react-native';
import { Switch } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useThemeContext } from '../theme/ThemeContext';
import { getCurrentWeather } from '../api/weather';
import { getWindSpeedFullLabel, getPressureFullLabel, getVisibilityFullLabel } from '../utils/weatherUnits';

import SettingsHeader    from '../components/settings/SettingsHeader';
import SettingsDropdown  from '../components/settings/SettingsDropdown';
import SettingsLinkButton from '../components/settings/SettingsLinkButton';
import CitySelector      from '../components/settings/CitySelector';

import countries from 'i18n-iso-countries';
import ruLocale from 'i18n-iso-countries/langs/ru.json';
countries.registerLocale(ruLocale);

const GITHUB_URL = 'https://github.com/Vdem07/weather-glass-app';

const getAutoRefreshLabel = (minutes) => {
  switch (parseInt(minutes)) {
    case 60:   return 'Каждый час';
    case 120:  return 'Каждые 2 часа';
    case 240:  return 'Каждые 4 часа';
    case 480:  return 'Каждые 8 часов';
    case 720:  return 'Каждые 12 часов';
    case 1440: return 'Каждые 24 часа';
    default:   return 'Каждые 30 минут';
  }
};

const getCardsLayoutLabel = (layout) => {
  switch (layout) {
    case 'grid':            return 'Сетка (2×5)';
    case 'horizontal_grid': return 'Сетка с прокруткой (5×2)';
    case 'compact':         return 'Компактный блок (все параметры)';
    default:                return 'Горизонтальная прокрутка (1×10)';
  }
};

export default function SettingsScreen({ navigation }) {
  const { isDark, toggleTheme } = useThemeContext();

  const [useGeo, setUseGeo] = useState(true);
  const [unit, setUnit] = useState('metric');
  const [windUnit, setWindUnit] = useState('m/s');
  const [pressureUnit, setPressureUnit] = useState('mmHg');
  const [visibilityUnit, setVisibilityUnit] = useState('km');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState('30');
  const [cardsLayout, setCardsLayout] = useState('horizontal');
  const [useStaticIcons, setUseStaticIcons] = useState(false);
  const [showLifeSection, setShowLifeSection] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [widgetRefreshInterval, setWidgetRefreshInterval] = useState('30');

  const textColor = isDark ? '#fff' : '#000';
  const secondaryTextColor = isDark ? '#aaa' : '#666';

  const saveSetting = (key, value) => AsyncStorage.setItem(key, value);
  const openDropdown = (name) => setActiveDropdown(prev => prev === name ? null : name);
  const closeDropdown = () => setActiveDropdown(null);

  useEffect(() => {
    (async () => {
      const [geo, savedUnit, savedWind, savedPressure, savedVisibility,
             savedAutoRefresh, savedCardsLayout, savedIconType, savedLifeSection, savedWidgetRefresh] = await Promise.all([
        AsyncStorage.getItem('useGeo'),
        AsyncStorage.getItem('unit'),
        AsyncStorage.getItem('windUnit'),
        AsyncStorage.getItem('pressureUnit'),
        AsyncStorage.getItem('visibilityUnit'),
        AsyncStorage.getItem('autoRefreshInterval'),
        AsyncStorage.getItem('cardsLayout'),
        AsyncStorage.getItem('useStaticIcons'),
        AsyncStorage.getItem('showLifeSection'),
        AsyncStorage.getItem('widgetRefreshInterval'),
      ]);
      setUseGeo(geo !== 'false');
      if (savedUnit) setUnit(savedUnit);
      if (savedWind) setWindUnit(savedWind);
      if (savedPressure) setPressureUnit(savedPressure);
      if (savedVisibility) setVisibilityUnit(savedVisibility);
      if (savedAutoRefresh) setAutoRefreshInterval(savedAutoRefresh);
      if (savedCardsLayout) setCardsLayout(savedCardsLayout);
      if (savedWidgetRefresh) setWidgetRefreshInterval(savedWidgetRefresh);
      setUseStaticIcons(savedIconType === 'true');
      setShowLifeSection(savedLifeSection !== 'false');
    })();
  }, []);

  const handleAutoLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Разрешение не получено', 'Разрешите доступ к геолокации в настройках устройства.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await AsyncStorage.removeItem('savedCity');
      await AsyncStorage.removeItem('savedCityName');
      try {
        const weather = await getCurrentWeather(location.coords.latitude, location.coords.longitude);
        const name = `${weather.name}, ${countries.getName(weather.country, 'ru') || weather.country}`;
        await AsyncStorage.setItem('geoLocationName', name);
        await AsyncStorage.setItem('shouldRefreshWeather', 'true');
        Alert.alert('Успешно', `Местоположение определено: ${name}`, [{ text: 'ОК', onPress: () => navigation.goBack() }]);
      } catch {
        const coords = `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
        await AsyncStorage.setItem('geoLocationName', coords);
        Alert.alert('Местоположение определено', 'Координаты определены, но название города недоступно.', [{ text: 'ОК', onPress: () => navigation.goBack() }]);
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось определить местоположение. Проверьте настройки геолокации.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleCitySelect = async (cityData) => {
    try {
      const name = `${cityData.local_names?.ru || cityData.name}, ${countries.getName(cityData.country, 'ru') || cityData.country}`;
      await AsyncStorage.setItem('savedCity', JSON.stringify({ lat: cityData.lat, lon: cityData.lon }));
      await AsyncStorage.setItem('savedCityName', name);
      await AsyncStorage.removeItem('geoLocationName');
      await AsyncStorage.setItem('shouldRefreshWeather', 'true');
      Alert.alert('Город изменен', `Выбран город: ${name}`, [{ text: 'ОК', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Ошибка', 'Не удалось выбрать город');
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      'Сброс приложения',
      'Вы уверены? Все данные будут удалены и приложение вернётся к начальному состоянию.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить', style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Сброс завершен', 'Все данные удалены.', [{
                text: 'ОК',
                onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] }),
              }]);
            } catch {
              Alert.alert('Ошибка', 'Не удалось выполнить сброс. Попробуйте ещё раз.');
            }
          },
        },
      ]
    );
  };

  const handleOpenGitHub = async () => {
    try {
      if (await Linking.canOpenURL(GITHUB_URL)) await Linking.openURL(GITHUB_URL);
      else Alert.alert('Ошибка', `Скопируйте адрес вручную: ${GITHUB_URL}`);
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть ссылку на GitHub');
    }
  };

  const handleShowPrivacyPolicy = () => {
    Alert.alert(
      'Политика конфиденциальности',
      'Приложение НЕ собирает персональные данные, НЕ отслеживает поведение и НЕ передаёт данные третьим лицам.\n\n' +
      'Все настройки хранятся локально. Геолокация используется только для прогноза погоды. ' +
      'Нет аналитики, трекеров или рекламных модулей.',
      [{ text: 'Понятно' }]
    );
  };

  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  const DROPDOWNS = [
    {
      key: 'unit', label: 'Температура',
      current: unit === 'metric' ? '°C (Цельсий)' : '°F (Фаренгейт)',
      items: [{ label: '°C (Цельсий)', value: 'metric' }, { label: '°F (Фаренгейт)', value: 'imperial' }],
      onSelect: v => { setUnit(v); saveSetting('unit', v); },
    },
    {
      key: 'wind', label: 'Скорость ветра',
      current: getWindSpeedFullLabel(windUnit),
      items: ['m/s', 'km/h', 'mph'].map(v => ({ label: getWindSpeedFullLabel(v), value: v })),
      onSelect: v => { setWindUnit(v); saveSetting('windUnit', v); },
    },
    {
      key: 'pressure', label: 'Атмосферное давление',
      current: getPressureFullLabel(pressureUnit),
      items: ['mmHg', 'hPa', 'bar', 'psi'].map(v => ({ label: getPressureFullLabel(v), value: v })),
      onSelect: v => { setPressureUnit(v); saveSetting('pressureUnit', v); },
    },
    {
      key: 'visibility', label: 'Видимость',
      current: getVisibilityFullLabel(visibilityUnit),
      items: ['km', 'm', 'mi'].map(v => ({ label: getVisibilityFullLabel(v), value: v })),
      onSelect: v => { setVisibilityUnit(v); saveSetting('visibilityUnit', v); },
    },
    {
      key: 'autoRefresh', label: 'Автообновление данных',
      current: getAutoRefreshLabel(autoRefreshInterval),
      items: ['30','60','120','240','480','720','1440'].map(v => ({ label: getAutoRefreshLabel(v), value: v })),
      onSelect: v => { setAutoRefreshInterval(v); saveSetting('autoRefreshInterval', v); },
    },
    {
      key: 'widgetRefresh', label: 'Автообновление виджетов',
      current: getAutoRefreshLabel(widgetRefreshInterval),
      items: ['30','60','120','240','480','720','1440'].map(v => ({ label: getAutoRefreshLabel(v), value: v })),
      onSelect: v => { setWidgetRefreshInterval(v); saveSetting('widgetRefreshInterval', v); },
    },
    {
      key: 'cardsLayout', label: 'Отображение деталей погоды',
      current: getCardsLayoutLabel(cardsLayout),
      items: ['horizontal','grid','horizontal_grid','compact'].map(v => ({ label: getCardsLayoutLabel(v), value: v })),
      onSelect: v => { setCardsLayout(v); saveSetting('cardsLayout', v); },
    },
  ];

  const TOGGLES = [
    { label: 'Тёмная тема',            value: isDark,          onToggle: toggleTheme },
    { label: 'Геолокация в поиске',     value: useGeo,          onToggle: v => { setUseGeo(v); saveSetting('useGeo', v.toString()); } },
    { label: 'Статичные иконки погоды', value: useStaticIcons,  onToggle: v => { setUseStaticIcons(v); saveSetting('useStaticIcons', v.toString()); } },
    { label: 'Рекомендации для жизни',  value: showLifeSection, onToggle: v => { setShowLifeSection(v); saveSetting('showLifeSection', v.toString()); } },
  ];

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover" blurRadius={70}>
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
        <SettingsHeader isDark={isDark} navigation={navigation} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} bounces={false}>

          <CitySelector
            isLoadingLocation={isLoadingLocation}
            isDark={isDark}
            onCitySelect={handleCitySelect}
            onAutoLocation={handleAutoLocation}
          />

          {TOGGLES.map(({ label, value, onToggle }) => (
            <View key={label} style={styles.settingRow}>
              <Text style={[styles.label, { color: textColor }]}>{label}</Text>
              <Switch value={value} onValueChange={onToggle} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
            </View>
          ))}

          <SettingsLinkButton
            label="Предварительный просмотр виджетов"
            hint="Просмотрите доступные виджеты погоды для главного экрана"
            iconLeft="grid-outline"
            iconRight="chevron-forward"
            color="#2196F3"
            bgColor={isDark ? 'rgba(33,150,243,0.1)' : 'rgba(33,150,243,0.1)'}
            borderColor={isDark ? 'rgba(33,150,243,0.3)' : '#2196F3'}
            onPress={() => navigation.navigate('WidgetPreview')}
            isDark={isDark}
          />

          {DROPDOWNS.map(({ key, label, current, items, onSelect }) => (
            <SettingsDropdown
              key={key}
              label={label}
              current={current}
              items={items}
              isOpen={activeDropdown === key}
              onToggle={() => openDropdown(key)}
              onSelect={onSelect}
              onClose={closeDropdown}
              isDark={isDark}
            />
          ))}

          <View style={styles.divider}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleResetApp}>
              <Text style={styles.resetBtnText}>Сбросить приложение</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <Text style={[styles.groupLabel, { color: textColor }]}>Исходный код приложения</Text>
            <SettingsLinkButton
              label="Посмотреть на GitHub"
              hint="Исходный код доступен для изучения и внесения предложений"
              iconLeft="logo-github"
              iconRight="open-outline"
              color={isDark ? '#fff' : '#24292e'}
              bgColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(36,41,46,0.1)'}
              borderColor={isDark ? 'rgba(255,255,255,0.3)' : '#24292e'}
              onPress={handleOpenGitHub}
              isDark={isDark}
            />
          </View>

          <View style={styles.divider}>
            <Text style={[styles.groupLabel, { color: textColor }]}>Конфиденциальность</Text>
            <SettingsLinkButton
              label="Политика конфиденциальности"
              hint="Независимая разработка без сбора данных и рекламы"
              iconLeft="shield-checkmark-outline"
              iconRight="information-circle-outline"
              color="#4CAF50"
              bgColor={isDark ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.1)'}
              borderColor={isDark ? 'rgba(76,175,80,0.3)' : '#4CAF50'}
              onPress={handleShowPrivacyPolicy}
              isDark={isDark}
            />
          </View>

          <Text style={[styles.version, { color: secondaryTextColor }]}>Версия 1.26.3</Text>
        </ScrollView>
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  blurOverlay: { flex: 1 },
  scroll: { flex: 1, marginTop: 105 },
  container: { flexGrow: 1, paddingHorizontal: 15, paddingTop: 0, paddingBottom: 80, gap: 25 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  label: { fontSize: 16, fontWeight: '500', flex: 1 },
  groupLabel: { fontSize: 16, fontWeight: '500' },
  divider: { gap: 12, paddingTop: 25, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  resetBtn: { backgroundColor: 'rgba(244,67,54,0.1)', borderColor: '#f44336', borderWidth: 1, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  resetBtnText: { color: '#f44336', fontSize: 16, fontWeight: '600', justifyContent: 'center', alignItems: 'center' },
  version: { fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
});
