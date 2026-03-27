/**
 * ActivityForecast
 *
 * Прогноз условий активности на 5 дней.
 *
 * Props:
 * - forecast: array — [{ date, temp, weather, description, condition, conditionColor }]
 * - isDark: boolean
 * - tempUnit: string
 * - useStaticIcons: boolean
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WeatherIcon from '../WeatherIcon';
import { convertTemperature } from '../../utils/weatherUnits';

export default function ActivityForecast({ forecast, isDark, tempUnit, useStaticIcons }) {
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Прогноз условий</Text>
      <View style={styles.list}>
        {forecast.map((item, i) => (
          <View key={i} style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.left}>
              <Text style={[styles.date, { color: textColor }]}>
                {new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </Text>
              <Text style={[styles.weekday, { color: secondaryTextColor }]}>
                {new Date(item.date).toLocaleDateString('ru-RU', { weekday: 'short' })}
              </Text>
            </View>

            <View style={styles.center}>
              <WeatherIcon
                weatherMain={item.weather}
                weatherDescription={item.description}
                width={40}
                height={40}
                useStaticIcons={useStaticIcons}
              />
              <Text style={[styles.temp, { color: textColor }]}>
                {Math.round(convertTemperature(item.temp, tempUnit))}°
              </Text>
            </View>

            <View style={styles.right}>
              <View style={[styles.badge, { backgroundColor: item.conditionColor }]}>
                <Text style={styles.badgeText}>{item.condition}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  left: { alignItems: 'flex-start', minWidth: 50 },
  date: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  weekday: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  center: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' },
  temp: { fontSize: 16, fontWeight: '600' },
  right: { alignItems: 'flex-end', minWidth: 80 },
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 18,
    minHeight: 30,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
