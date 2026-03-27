/**
 * MapHeader
 *
 * Шапка экрана карты погоды: кнопка назад, название города, кнопка информации.
 * Рендерится поверх карты с размытым фоном.
 *
 * Props:
 * - cityName: string
 * - countryName: string
 * - isDark: boolean
 * - navigation: object
 * - backgroundImage: ImageSourcePropType
 */

import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function MapHeader({ cityName, countryName, isDark, navigation, backgroundImage }) {
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const iconColor = isDark ? '#fff' : '#333';
  const btnBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  return (
    <View style={styles.container}>
      <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.bg} blurRadius={70}>
        <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { backgroundColor: btnBg }]}>
            <Ionicons name="chevron-back" size={20} color={iconColor} />
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: textColor }]}>Карта погоды</Text>
            <Text style={[styles.subtitle, { color: secondaryTextColor }]}>{cityName}, {countryName}</Text>
          </View>

          <TouchableOpacity
            onPress={() => Alert.alert(
              'Информация о карте',
              'Данные карты предоставляются OpenWeatherMap. Цвета показывают интенсивность явлений в реальном времени. Единицы измерения соответствуют настройкам приложения.',
              [{ text: 'OK' }]
            )}
            style={[styles.btn, { backgroundColor: btnBg }]}
          >
            <Ionicons name="information-circle-outline" size={24} color={iconColor} />
          </TouchableOpacity>
        </BlurView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 },
  bg: { flex: 1 },
  blur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 15,
    gap: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  btn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  titleBlock: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 2, textAlign: 'center' },
});
