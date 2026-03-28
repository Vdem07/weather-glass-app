/**
 * WelcomeStep
 *
 * Первый шаг экрана приветствия: анимация, заголовок и кнопки выбора способа определения города.
 *
 * Props:
 * - isDark: boolean
 * - onGeoSelect: () => void — выбрать геолокацию
 * - onManualSelect: () => void — выбрать город вручную
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

const OPTIONS = [
  { icon: 'location', color: '#4CAF50', title: 'Автоматически', desc: 'Использовать геолокацию устройства', key: 'geo' },
  { icon: 'search',   color: '#2196F3', title: 'Выбрать город',  desc: 'Найти и выбрать город вручную',      key: 'manual' },
];

export default function WelcomeStep({ isDark, onGeoSelect, onManualSelect }) {
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const optionBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  const handlers = { geo: onGeoSelect, manual: onManualSelect };

  return (
    <>
      <View style={styles.animationContainer}>
        <LottieView
          source={require('../../assets/lottie/weather-welcome.json')}
          autoPlay
          loop
          style={styles.animation}
        />
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Добро пожаловать!</Text>
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
          Настройте способ определения местоположения для получения точного прогноза погоды
        </Text>
      </View>

      <View style={styles.options}>
        {OPTIONS.map(({ icon, color, title, desc, key }) => (
          <TouchableOpacity key={key} style={[styles.optionBtn, { backgroundColor: optionBg }]} onPress={handlers[key]}>
            <View style={styles.optionIcon}>
              <Ionicons name={icon} size={30} color={color} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: textColor }]}>{title}</Text>
              <Text style={[styles.optionDesc, { color: secondaryTextColor }]}>{desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  animationContainer: { alignItems: 'center' },
  animation: { width: 200, height: 200 },
  header: { alignItems: 'center', gap: 10 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22, paddingHorizontal: 15 },
  options: { gap: 15, maxWidth: 500, alignSelf: 'center', width: '100%' },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, gap: 15 },
  optionIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  optionText: { flex: 1, gap: 4 },
  optionTitle: { fontSize: 18, fontWeight: '600' },
  optionDesc: { fontSize: 14, lineHeight: 18 },
});
