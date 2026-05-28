import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export default function WeatherMain({ weather, isDark, isOffline, tempUnit, useStaticIcons, onRefresh }) {
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const iconColor = isDark ? '#fff' : '#333';
  const btnBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  return (
    <View style={styles.container}>
      <View style={styles.side}>
        <TouchableOpacity onPress={onRefresh} style={[styles.btn, { backgroundColor: btnBg }]}>
          <Ionicons name="refresh-outline" size={24} color={iconColor} />
          {isOffline && <View style={styles.offlineDot} />}
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <WeatherIcon
          weatherMain={weather.main}
          weatherDescription={weather.description}
          style={styles.icon}
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

      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  side: { width: 44, paddingTop: 20 },
  btn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  offlineDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35' },
  center: { flex: 1, alignItems: 'center' },
  icon: { width: 160, height: 160 },
  temp: { fontSize: 60, fontWeight: 'bold', textAlign: 'center', marginTop: -10 },
  description: { fontSize: 18, textAlign: 'center', textTransform: 'capitalize', marginTop: -10, lineHeight: 26, paddingBottom: 2 },
  updated: { fontSize: 12, textAlign: 'center', marginTop: 15 },
});
