import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WeatherIcon from '../WeatherIcon';
import { convertTemperature, getTemperatureSymbol } from '../../utils/weatherUnits';

const getLastUpdateTime = (dt) => {
  if (!dt) return 'неизвестно';
  const diffMinutes = Math.floor((Date.now() - dt * 1000) / 60000);
  if (diffMinutes < 1) return 'только что';
  if (diffMinutes < 60) return `${diffMinutes} мин назад`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  return `${Math.floor(diffHours / 24)} д назад`;
};

export default function WeatherMain({ weather, isDark, tempUnit, useStaticIcons }) {
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';

  return (
    <View style={styles.container}>
      <WeatherIcon
        weatherMain={weather.main}
        weatherDescription={weather.description}
        width={160}
        height={160}
        useStaticIcons={useStaticIcons}
      />
      <Text style={[styles.temp, { color: textColor }]}>
        {Math.round(convertTemperature(weather.temp, tempUnit))}{getTemperatureSymbol(tempUnit)}
      </Text>
      <Text style={[styles.description, { color: secondaryTextColor }]}>
        {weather.description}
      </Text>
      <Text style={[styles.updated, { color: secondaryTextColor }]}>
        Обновлено {getLastUpdateTime(weather.dt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 15 },
  temp: { fontSize: 60, fontWeight: 'bold', textAlign: 'center', marginTop: -10 },
  description: { fontSize: 18, textAlign: 'center', textTransform: 'capitalize', marginTop: -10, lineHeight: 26, paddingBottom: 2 },
  updated: { fontSize: 12, textAlign: 'center', marginTop: 15 },
});
