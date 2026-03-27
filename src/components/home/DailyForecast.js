/**
 * DailyForecast
 *
 * Список прогноза погоды на 5 дней.
 *
 * Props:
 * - forecast: array — список дневных данных
 * - isDark: boolean
 * - tempUnit: string
 * - useStaticIcons: boolean
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WeatherIcon from '../WeatherIcon';
import { convertTemperature, getTemperatureSymbol } from '../../utils/weatherUnits';

export default function DailyForecast({ forecast, isDark, tempUnit, useStaticIcons }) {
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Прогноз на 5 дней</Text>
      <View style={styles.list}>
        {forecast.map((item, index) => (
          <View key={index} style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.left}>
              <Text style={[styles.date, { color: textColor }]}>
                {new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </Text>
              <Text style={[styles.weekday, { color: secondaryTextColor }]}>
                {new Date(item.date).toLocaleDateString('ru-RU', { weekday: 'long' })}
              </Text>
            </View>

            <View style={styles.center}>
              <WeatherIcon
                weatherMain={item.main}
                weatherDescription={item.description}
                width={50}
                height={50}
                useStaticIcons={useStaticIcons}
              />
            </View>

            <View style={styles.right}>
              <View style={styles.tempBlock}>
                <Text style={[styles.tempLabel, { color: secondaryTextColor }]}>День</Text>
                <Text style={[styles.tempDay, { color: textColor }]}>
                  {Math.round(convertTemperature(item.temp, tempUnit))}°
                </Text>
              </View>
              <View style={styles.tempBlock}>
                <Text style={[styles.tempLabel, { color: secondaryTextColor }]}>Ночь</Text>
                <Text style={[styles.tempNight, { color: secondaryTextColor }]}>
                  {Math.round(convertTemperature(item.nightTemp, tempUnit))}°
                </Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  list: {
    paddingHorizontal: 15,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  left: { flex: 1, alignItems: 'flex-start' },
  date: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  weekday: {
    fontSize: 14,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  right: {
    minWidth: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  tempBlock: { alignItems: 'center' },
  tempLabel: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  tempDay: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tempNight: {
    fontSize: 18,
    textAlign: 'center',
  },
});
