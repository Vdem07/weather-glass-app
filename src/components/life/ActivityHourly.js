/**
 * ActivityHourly
 *
 * Почасовой прогноз условий активности на сегодня.
 * Работает с нормализованными данными (HourlyForecast[]).
 *
 * Props:
 * - hourlyForecast: HourlyForecast[]
 * - activityType: string
 * - isDark: boolean
 * - tempUnit: string
 * - useStaticIcons: boolean
 */

import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import WeatherIcon from '../WeatherIcon';
import { convertTemperature } from '../../utils/weatherUnits';
import { scoreHour } from '../../utils/activityData';

export default function ActivityHourly({ hourlyForecast, activityType, isDark, tempUnit, useStaticIcons }) {
  const textColor = isDark ? '#fff' : '#333';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const data = hourlyForecast.slice(0, 8);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Сегодня по часам</Text>
      <FlatList
        data={data}
        horizontal
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.list}
        showsHorizontalScrollIndicator={false}
        style={styles.flatList}
        renderItem={({ item, index }) => {
          const score = scoreHour(activityType, item.temp, item.main);
          const indicatorColor = score >= 2 ? '#4CAF50' : score >= 1 ? '#FFC107' : '#FF9800';
          return (
            <View style={[
              styles.card,
              {
                backgroundColor: cardBg,
                marginRight: index === data.length - 1 ? 15 : 10,
              },
            ]}>
              <Text style={[styles.time, { color: textColor }]}>
                {new Date(item.dt_txt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <WeatherIcon
                weatherMain={item.main}
                weatherDescription={item.description}
                width={30}
                height={30}
                useStaticIcons={useStaticIcons}
              />
              <Text style={[styles.temp, { color: textColor }]}>
                {Math.round(convertTemperature(item.temp, tempUnit))}°
              </Text>
              <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },
  flatList: { marginHorizontal: -15 },
  list: { paddingLeft: 15 },
  card: { alignItems: 'center', borderRadius: 12, padding: 12, width: 70, gap: 8 },
  time: { fontSize: 12, fontWeight: '600' },
  temp: { fontSize: 14, fontWeight: '600' },
  indicator: { width: 20, height: 3, borderRadius: 1.5 },
});
