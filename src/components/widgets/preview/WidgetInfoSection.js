/**
 * WidgetInfoSection
 *
 * Блок с информацией о виджетах.
 *
 * Props:
 * - isDark: boolean
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const INFO_ITEMS = [
  'Данные синхронизируются с основным приложением',
  'Работают в офлайн режиме с кэшированными данными',
  'Меняют цвет фона в зависимости от времени суток',
  'Адаптируются под настройки единиц измерения',
];

export default function WidgetInfoSection({ isDark }) {
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: textColor }]}>Информация о виджетах</Text>
      <Text style={[styles.text, { color: secondaryTextColor }]}>
        {INFO_ITEMS.map(item => `• ${item}`).join('\n')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, borderRadius: 12 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  text: { fontSize: 14, lineHeight: 20 },
});
