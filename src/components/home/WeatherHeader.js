/**
 * WeatherHeader
 *
 * Шапка главного экрана: кнопка настроек, поле поиска города, кнопка поиска,
 * выпадающий список результатов и название текущего города.
 *
 * Props:
 * - weather: object — текущие данные погоды
 * - isDark: boolean
 * - navigation: object
 * - onCitySelect: (lat, lon) => void — колбэк при выборе города
 * - useGeo: boolean — показывать ли кнопку геолокации в списке
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { searchCityByName } from '../../api/weather';
import countries from 'i18n-iso-countries';
import ruLocale from 'i18n-iso-countries/langs/ru.json';

countries.registerLocale(ruLocale);

export default function WeatherHeader({ weather, isDark, navigation, onCitySelect, useGeo }) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);

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
      {/* Строка поиска */}
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

      {/* Результаты поиска */}
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

      {/* Название города */}
      {weather && (
        <View style={styles.cityBlock}>
          <Text style={[styles.city, { color: textColor }]}>{weather.name}</Text>
          <Text style={[styles.country, { color: secondaryTextColor }]}>
            {countries.getName(weather.sys.country, 'ru') || weather.sys.country}
          </Text>
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
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  suggestionList: {
    position: 'absolute',
    top: 95,
    left: 60,
    right: 60,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 10,
    zIndex: 20,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionText: { fontSize: 14 },
  cityBlock: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  city: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  country: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 2,
  },
});
