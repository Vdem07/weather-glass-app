import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { searchCityByName } from '../../api/weather';
import countries from 'i18n-iso-countries';
import ruLocale from 'i18n-iso-countries/langs/ru.json';

countries.registerLocale(ruLocale);

export default function WeatherHeader({ weather, isDark, navigation, onCitySelect, useGeo, updateStatus, isFavorite, onToggleFavorite }) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [visibleStatus, setVisibleStatus] = useState(null);

  useEffect(() => {
    if (updateStatus) {
      setVisibleStatus(updateStatus);
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 250, useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0, duration: 250, useNativeDriver: true,
      }).start(() => setVisibleStatus(null));
    }
  }, [updateStatus]);

  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const placeholderColor = isDark ? 'lightgray' : '#999';
  const iconColor = isDark ? '#fff' : '#333';
  const btnBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  const handleSearch = async (text) => {
    setSearchCity(text);
    if (text.length > 2) {
      try {
        setSearchResults(await searchCityByName(text));
      } catch {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectGeo = async () => {
    setShowSearch(false);
    setSearchCity('');
    setSearchResults([]);
    await AsyncStorage.removeItem('savedCity');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const location = await Location.getCurrentPositionAsync({});
    onCitySelect(location.coords.latitude, location.coords.longitude);
  };

  const handleSelectCity = async (item) => {
    setShowSearch(false);
    setSearchCity('');
    setSearchResults([]);
    await AsyncStorage.setItem('savedCity', JSON.stringify({ lat: item.lat, lon: item.lon }));
    onCitySelect(item.lat, item.lon);
  };

  return (
    <View>
      <View style={styles.searchRow}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={[styles.btn, { backgroundColor: btnBg }]}
        >
          <Ionicons name="settings" size={24} color={iconColor} />
        </TouchableOpacity>

        <TextInput
          placeholder="Введите город"
          placeholderTextColor={placeholderColor}
          value={searchCity}
          onChangeText={handleSearch}
          editable={showSearch}
          pointerEvents={showSearch ? 'auto' : 'none'}
          style={[
            styles.input,
            {
              color: textColor,
              opacity: showSearch ? 1 : 0,
              backgroundColor: showSearch ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
            },
          ]}
        />

        <TouchableOpacity
          onPress={() => setShowSearch(!showSearch)}
          style={[styles.btn, { backgroundColor: btnBg }]}
        >
          <Ionicons name="search" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      {showSearch && searchResults.length > 0 && (
        <View style={[styles.suggestionList, { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5' }]}>
          {useGeo && (
            <TouchableOpacity
              onPress={handleSelectGeo}
              style={[styles.suggestionItem, { borderBottomColor: isDark ? '#777' : '#ccc' }]}
            >
              <View style={styles.suggestionRow}>
                <Ionicons name="location-outline" size={16} color={textColor} />
                <Text style={[styles.suggestionText, { color: textColor, fontWeight: 'bold' }]}>
                  Использовать геолокацию
                </Text>
              </View>
            </TouchableOpacity>
          )}
          {searchResults.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelectCity(item)}
              style={[styles.suggestionItem, { borderBottomColor: isDark ? '#444' : '#eee' }]}
            >
              <Text style={[styles.suggestionText, { color: textColor }]}>
                {item.local_names?.ru || item.name}
                {item.state ? `, ${item.state}` : ''}, {countries.getName(item.country, 'ru') || item.country}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {weather && (
        <View style={styles.cityBlock}>
          <Text style={[styles.city, { color: textColor }]}>{weather.name}</Text>
          <Text style={[styles.country, { color: secondaryTextColor }]}>
            {countries.getName(weather.country, 'ru') || weather.country}
          </Text>
          <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteBtn} hitSlop={8}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#f44336' : secondaryTextColor}
            />
          </TouchableOpacity>

          {/* Фиксированная высота чтобы не двигать контент */}
          <View style={styles.statusContainer}>
            <Animated.View style={[styles.statusRow, { opacity: fadeAnim }]}>
              {visibleStatus === 'loading' && (
                <>
                  <ActivityIndicator size="small" color={secondaryTextColor} />
                  <Text style={[styles.statusText, { color: secondaryTextColor }]}>Обновление...</Text>
                </>
              )}
              {visibleStatus === 'success' && (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={[styles.statusText, { color: '#4CAF50' }]}>Данные обновлены</Text>
                </>
              )}
              {visibleStatus === 'error' && (
                <>
                  <Ionicons name="cloud-offline-outline" size={16} color="#f44336" />
                  <Text style={[styles.statusText, { color: '#f44336' }]}>Ошибка обновления</Text>
                </>
              )}
            </Animated.View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    gap: 10,
    zIndex: 100,
  },
  btn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 20, fontSize: 16, textAlign: 'center' },
  suggestionList: { position: 'absolute', top: 95, left: 60, right: 60, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 10, zIndex: 20 },
  suggestionItem: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  suggestionText: { fontSize: 14 },
  cityBlock: { alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  city: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  country: { fontSize: 16, textAlign: 'center', marginTop: 2 },
  favoriteBtn: { marginTop: 6 },
  statusContainer: { height: 24, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 13 },
});
