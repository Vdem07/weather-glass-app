/**
 * CitySelector
 *
 * Блок выбора местоположения на экране настроек.
 * Читает название текущего города из AsyncStorage — без сетевых запросов.
 * Обновляет название после выбора города или автолокации.
 *
 * Props:
 * - isLoadingLocation: boolean
 * - isDark: boolean
 * - onCitySelect: (cityData) => void
 * - onAutoLocation: () => void
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchCityByName } from '../../api/weather';
import countries from 'i18n-iso-countries';
import ruLocale from 'i18n-iso-countries/langs/ru.json';

countries.registerLocale(ruLocale);

const loadCityFromStorage = async () => {
  const savedCity = await AsyncStorage.getItem('savedCity');
  if (savedCity) {
    const name = await AsyncStorage.getItem('savedCityName');
    return name || 'Местоположение недоступно';
  }
  const geoName = await AsyncStorage.getItem('geoLocationName');
  return geoName ? `${geoName} (по геолокации)` : 'Геолокация не настроена';
};

export default function CitySelector({ isLoadingLocation, isDark, onCitySelect, onAutoLocation }) {
  const [currentCity, setCurrentCity] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);

  const textColor = isDark ? '#fff' : '#000';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const borderColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';

  useEffect(() => {
    loadCityFromStorage().then(setCurrentCity).catch(() => setCurrentCity('Местоположение недоступно'));
  }, []);

  const handleSearch = async (text) => {
    setSearchText(text);
    if (text.length > 2) {
      try { setResults(await searchCityByName(text)); }
      catch { setResults([]); }
    } else {
      setResults([]);
    }
  };

  const handleSelect = (item) => {
    const name = `${item.local_names?.ru || item.name}${item.state ? `, ${item.state}` : ''}, ${countries.getName(item.country, 'ru') || item.country}`;
    setCurrentCity(name);
    setSearchText('');
    setResults([]);
    setShowSearch(false);
    onCitySelect(item);
  };

  // Обновить название после автолокации
  const handleAutoLocation = async () => {
    await onAutoLocation();
    loadCityFromStorage().then(setCurrentCity).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.groupLabel, { color: textColor }]}>Текущее местоположение</Text>

      <View style={[styles.cityInfo, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderColor }]}>
        <Text style={[styles.cityText, { color: textColor }]}>{currentCity || '...'}</Text>
      </View>

      <View style={styles.btns}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: isDark ? 'rgba(33,150,243,0.2)' : 'rgba(33,150,243,0.1)' }]}
          onPress={() => setShowSearch(v => !v)}
        >
          <Ionicons name="search" size={16} color="#2196F3" />
          <Text style={[styles.btnText, { color: '#2196F3' }]}>Выбрать город</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: isDark ? 'rgba(76,175,80,0.2)' : 'rgba(76,175,80,0.1)', opacity: isLoadingLocation ? 0.6 : 1 }]}
          onPress={handleAutoLocation}
          disabled={isLoadingLocation}
        >
          <Ionicons name={isLoadingLocation ? 'time' : 'location'} size={16} color="#4CAF50" />
          <Text style={[styles.btnText, { color: '#4CAF50' }]}>{isLoadingLocation ? 'Определение...' : 'Автолокация'}</Text>
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Введите название города"
            placeholderTextColor={secondaryTextColor}
            value={searchText}
            onChangeText={handleSearch}
            style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: textColor, borderColor }]}
          />
          {results.length > 0 && (
            <View style={[styles.results, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 150 }}>
                {results.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleSelect(item)}
                    style={[styles.resultItem, { borderBottomWidth: i === results.length - 1 ? 0 : 1, borderBottomColor: isDark ? '#444' : '#eee' }]}
                  >
                    <Text style={[styles.resultText, { color: textColor }]}>
                      {item.local_names?.ru || item.name}
                      {item.state ? `, ${item.state}` : ''}, {countries.getName(item.country, 'ru') || item.country}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  groupLabel: { fontSize: 16, fontWeight: '500' },
  cityInfo: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 15, minHeight: 50, justifyContent: 'center' },
  cityText: { textAlign: 'center', fontSize: 16, fontWeight: '600' },
  btns: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, gap: 6 },
  btnText: { fontSize: 14, fontWeight: '600' },
  searchContainer: { gap: 10 },
  input: { borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, borderWidth: 1, minHeight: 50 },
  results: { borderRadius: 10, overflow: 'hidden' },
  resultItem: { paddingHorizontal: 15, paddingVertical: 12, justifyContent: 'center' },
  resultText: { fontSize: 14, fontWeight: '500' },
});
