/**
 * LifeSection
 *
 * Горизонтальный список карточек активностей "Для жизни".
 * При нажатии переходит на LifeActivityScreen с данными о погоде.
 *
 * Props:
 * - weather: object
 * - forecast: array
 * - hourlyForecast: array
 * - dewPoint: number | null
 * - isDark: boolean
 * - navigation: object
 * - tempUnit: string
 * - windUnit: string
 * - pressureUnit: string
 * - visibilityUnit: string
 */

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';

const ACTIVITIES = [
  { id: 'allergy',          icon: require('../../assets/icons/allergy.png'),   title: 'Аллергия',     color: '#FF9800' },
  { id: 'driving',          icon: require('../../assets/icons/driving.png'),   title: 'На дорогах',   color: '#2196F3' },
  { id: 'fishing',          icon: require('../../assets/icons/fishing.png'),   title: 'Рыбалка',      color: '#00BCD4' },
  { id: 'water_recreation', icon: require('../../assets/icons/swimming.png'),  title: 'Отдых у воды', color: '#03A9F4' },
  { id: 'gardening',        icon: require('../../assets/icons/gardening.png'), title: 'Сад и огород', color: '#4CAF50' },
  { id: 'running',          icon: require('../../assets/icons/running.png'),   title: 'Бег',          color: '#F44336' },
];

export default function LifeSection({
  weather, forecast, hourlyForecast, dewPoint,
  isDark, navigation,
  tempUnit, windUnit, pressureUnit, visibilityUnit,
}) {
  const textColor = isDark ? '#fff' : '#333';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Для жизни</Text>
      <FlatList
        data={ACTIVITIES}
        horizontal
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: cardBg }]}
            onPress={() => navigation.navigate('LifeActivity', {
              activityType: item.id,
              title: item.title,
              color: item.color,
              weather,
              forecast,
              hourlyForecast,
              uvIndex: weather.uv_index || 0,
              dewPoint,
              tempUnit,
              windUnit,
              pressureUnit,
              visibilityUnit,
            })}
          >
            <View style={[styles.iconWrapper, { backgroundColor: item.color }]}>
              <Image source={item.icon} style={styles.icon} resizeMode="contain" />
            </View>
            <Text style={[styles.label, { color: textColor }]}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 15 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  list: {
    paddingHorizontal: 15,
    gap: 10,
    alignItems: 'flex-start',
  },
  card: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    width: 110,
    minHeight: 130,
    gap: 10,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});
