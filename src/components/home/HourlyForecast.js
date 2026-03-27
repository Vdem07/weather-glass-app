/**
 * HourlyForecast
 *
 * Горизонтальный список почасового прогноза погоды.
 *
 * Props:
 * - hourlyForecast: array — список почасовых данных
 * - isDark: boolean
 * - tempUnit: string
 * - useStaticIcons: boolean
 */

import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import WeatherIcon from '../WeatherIcon';
import { convertTemperature, getTemperatureSymbol } from '../../utils/weatherUnits';

export default function HourlyForecast({ hourlyForecast, isDark, tempUnit, useStaticIcons }) {
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Почасовой прогноз</Text>
      <FlatList
        data={hourlyForecast.slice(0, 8)}
        horizontal
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.list}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.time, { color: textColor }]}>
              {new Date(item.dt_txt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <WeatherIcon
              weatherMain={item.weather[0].main}
              weatherDescription={item.weather[0].description}
              width={90}
              height={90}
              useStaticIcons={useStaticIcons}
            />
            <Text style={[styles.desc, { color: secondaryTextColor }]}>
              {item.weather[0].description}
            </Text>
            <Text style={[styles.temp, { color: textColor }]}>
              {Math.round(convertTemperature(item.main.temp, tempUnit))}{getTemperatureSymbol(tempUnit)}
            </Text>
          </View>
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
    borderRadius: 15,
    padding: 8,
    width: 110,
    minHeight: 160,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  desc: {
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'capitalize',
    marginVertical: 5,
    lineHeight: 16,
    minHeight: 32,
  },
  temp: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
});
