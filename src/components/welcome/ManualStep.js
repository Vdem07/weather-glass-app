/**
 * ManualStep
 *
 * Второй шаг экрана приветствия: поиск и выбор города вручную.
 *
 * Props:
 * - isDark: boolean
 * - onCitySelect: (cityData) => void
 * - onBack: () => void
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchCityByName } from '../../api/weather';
import countries from 'i18n-iso-countries';
import ruLocale from 'i18n-iso-countries/langs/ru.json';

countries.registerLocale(ruLocale);

export default function ManualStep({ isDark, onCitySelect, onBack }) {
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const placeholderColor = isDark ? 'lightgray' : '#999';
  const bgColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  const handleSearch = async (text) => {
    setSearchCity(text);
    if (text.length > 2) {
      try {
        setSearchResults((await searchCityByName(text)).slice(0, 5));
      } catch {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>Выберите город</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: bgColor }]}>
        <Ionicons name="search" size={20} color={secondaryTextColor} />
        <TextInput
          placeholder="Введите название города"
          placeholderTextColor={placeholderColor}
          value={searchCity}
          onChangeText={handleSearch}
          style={[styles.searchInput, { color: textColor }]}
          autoFocus
        />
      </View>

      {searchResults.length > 0 && (
        <View style={[styles.results, { backgroundColor: bgColor }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {searchResults.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => onCitySelect(item)}
                style={[
                  styles.resultItem,
                  { borderBottomWidth: i === searchResults.length - 1 ? 0 : 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                ]}
              >
                <View style={styles.resultInfo}>
                  <Text style={[styles.cityName, { color: textColor }]}>{item.local_names?.ru || item.name}</Text>
                  <Text style={[styles.countryName, { color: secondaryTextColor }]}>
                    {item.state ? `${item.state}, ` : ''}{countries.getName(item.country, 'ru') || item.country}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={secondaryTextColor} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={[styles.hint, { color: secondaryTextColor }]}>
        Введите название города для поиска подходящих вариантов
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, gap: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  results: { borderRadius: 16, overflow: 'hidden', maxHeight: 300 },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 10 },
  resultInfo: { flex: 1, gap: 2 },
  cityName: { fontSize: 16, fontWeight: '500' },
  countryName: { fontSize: 14 },
  hint: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 15 },
});
