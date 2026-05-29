import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useThemeContext } from '../theme/ThemeContext';
import { useWeatherSettings } from '../hooks/useWeatherSettings';
import WeatherIcon from '../components/WeatherIcon';
import { convertTemperature, getTemperatureSymbol } from '../utils/weatherUnits';
import countries from 'i18n-iso-countries';
import ruLocale from 'i18n-iso-countries/langs/ru.json';
countries.registerLocale(ruLocale);

const getCachedWeather = async (lat, lon) => {
  try {
    const key = `weather_cache_${parseFloat(lat).toFixed(4)}_${parseFloat(lon).toFixed(4)}`;
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached).weather : null;
  } catch {
    return null;
  }
};

export default function FavoritesScreen({ navigation }) {
  const { isDark } = useThemeContext();
  const { settings, loadSettings } = useWeatherSettings();
  const [favorites, setFavorites] = useState([]);
  const [weatherCache, setWeatherCache] = useState({});

  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const btnBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
  const bgImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  useFocusEffect(useCallback(() => {
    (async () => {
      await loadSettings();
      const data = await AsyncStorage.getItem('favoriteCities');
      const favs = data ? JSON.parse(data) : [];
      setFavorites(favs);

      const cache = {};
      await Promise.all(favs.map(async item => {
        const w = await getCachedWeather(item.lat, item.lon);
        if (w) cache[`${item.lat}_${item.lon}`] = w;
      }));
      setWeatherCache(cache);
    })();
  }, [loadSettings]));

  const handleRemove = async (index) => {
    const updated = favorites.filter((_, i) => i !== index);
    setFavorites(updated);
    await AsyncStorage.setItem('favoriteCities', JSON.stringify(updated));
  };

  const handleShowInfo = () => Alert.alert(
    'Об избранных городах',
    'Избранные города сохраняются локально на вашем устройстве.\n\nПри переустановке приложения или сбросе данных через настройки они будут удалены.',
    [{ text: 'Понятно' }]
  );

  return (
    <ImageBackground source={bgImage} resizeMode="cover" style={styles.bg} blurRadius={70}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blur}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.btn, { backgroundColor: btnBg }]}>
            <Ionicons name="settings" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>Избранное</Text>
          <TouchableOpacity onPress={handleShowInfo} style={[styles.btn, { backgroundColor: btnBg }]}>
            <Ionicons name="information-circle-outline" size={22} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} bounces={false}>
          {favorites.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={48} color={secondaryTextColor} />
              <Text style={[styles.emptyText, { color: secondaryTextColor }]}>Нет избранных городов</Text>
              <Text style={[styles.emptyHint, { color: secondaryTextColor }]}>
                Добавьте город, нажав ♡ на главном экране
              </Text>
            </View>
          ) : (
            favorites.map((item, index) => {
              const w = weatherCache[`${item.lat}_${item.lon}`];
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                  onPress={async () => {
                    await AsyncStorage.setItem('savedCity', JSON.stringify({ lat: item.lat, lon: item.lon }));
                    navigation.navigate('Home', { lat: item.lat, lon: item.lon });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardLeft}>
                    <Text style={[styles.cityName, { color: textColor }]}>{item.name}</Text>
                    <Text style={[styles.countryName, { color: secondaryTextColor }]}>
                      {countries.getName(item.country, 'ru') || item.country}
                    </Text>
                    {w && (
                    <WeatherIcon
                      weatherMain={w.main}
                      weatherDescription={w.description}
                      width={48}
                      height={48}
                      useStaticIcons={settings.useStaticIcons}
                    />
                  )}
                  {w && (
                      <Text style={[styles.description, { color: secondaryTextColor }]}>
                        {w.description}
                      </Text>
                    )}
                  </View>
                  {w && (
                    <Text style={[styles.temp, { color: textColor }]}>
                      {Math.round(convertTemperature(w.temp, settings.tempUnit))}{getTemperatureSymbol(settings.tempUnit)}
                    </Text>
                  )}
                  <TouchableOpacity onPress={() => handleRemove(index)} style={styles.removeBtn} hitSlop={8}>
                    <Ionicons name="heart" size={22} color="#f44336" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  blur: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingTop: 40, paddingBottom: 20,
  },
  btn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold' },
  list: { paddingHorizontal: 15, paddingBottom: 120, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12 },
  cardLeft: { flex: 1 },
  cityName: { fontSize: 18, fontWeight: '600' },
  countryName: { fontSize: 14, marginTop: 2 },
  description: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  temp: { fontSize: 26, fontWeight: 'bold' },
  removeBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '500' },
  emptyHint: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
