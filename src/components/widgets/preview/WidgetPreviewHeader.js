/**
 * WidgetPreviewHeader
 *
 * Шапка экрана предварительного просмотра виджетов.
 * Кнопка назад, заголовок, кнопка справки.
 *
 * Props:
 * - isDark: boolean
 * - navigation: object
 * - onHelp: () => void
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WidgetPreviewHeader({ isDark, navigation, onHelp }) {
  const textColor = isDark ? '#fff' : '#333';
  const btnBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { backgroundColor: btnBg }]}>
        <Ionicons name="chevron-back" size={20} color={textColor} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: textColor }]}>Виджеты погоды</Text>
      <TouchableOpacity onPress={onHelp} style={[styles.btn, { backgroundColor: btnBg }]}>
        <Ionicons name="help-circle-outline" size={20} color={textColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 15,
  },
  btn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
});
