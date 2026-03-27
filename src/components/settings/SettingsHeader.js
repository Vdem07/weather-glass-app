/**
 * SettingsHeader
 *
 * Фиксированная шапка экрана настроек: кнопка назад и заголовок.
 *
 * Props:
 * - isDark: boolean
 * - navigation: object
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsHeader({ isDark, navigation }) {
  const textColor = isDark ? '#fff' : '#000';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}
      >
        <Ionicons name="chevron-back" size={20} color={textColor} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: textColor }]}>Настройки</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
});
