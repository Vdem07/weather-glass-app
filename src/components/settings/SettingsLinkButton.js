/**
 * SettingsLinkButton
 *
 * Переиспользуемая кнопка-ссылка для экрана настроек.
 * Используется для виджетов, GitHub и политики конфиденциальности.
 *
 * Props:
 * - label: string — текст кнопки
 * - hint: string — подпись под кнопкой
 * - iconLeft: string — имя иконки слева (Ionicons)
 * - iconRight: string — имя иконки справа (Ionicons)
 * - color: string — цвет текста и иконок
 * - bgColor: string — цвет фона кнопки
 * - borderColor: string — цвет рамки
 * - onPress: () => void
 * - isDark: boolean
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsLinkButton({ label, hint, iconLeft, iconRight, color, bgColor, borderColor, onPress, isDark }) {
  const secondaryTextColor = isDark ? '#aaa' : '#666';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.btn, { backgroundColor: bgColor, borderColor }]} onPress={onPress}>
        <Ionicons name={iconLeft} size={20} color={color} />
        <Text style={[styles.label, { color }]}>{label}</Text>
        {iconRight && <Ionicons name={iconRight} size={16} color={color} />}
      </TouchableOpacity>
      {hint && <Text style={[styles.hint, { color: secondaryTextColor }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  btn: {
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    gap: 8,
  },
  label: { fontSize: 16, fontWeight: '600', flex: 1 },
  hint: { fontSize: 12, textAlign: 'center', lineHeight: 16, fontStyle: 'italic' },
});
