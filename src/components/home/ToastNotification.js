/**
 * ToastNotification
 *
 * Всплывающее уведомление поверх экрана.
 * Показывается автоматически на 1 секунду при изменении visible.
 *
 * Props:
 * - message: string — текст уведомления
 * - type: 'info' | 'success' | 'warning' | 'error'
 * - visible: boolean
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CONFIG = {
  info:    { color: '#2196F3', bg: (dark) => `rgba(33, 150, 243, ${dark ? 0.2 : 0.1})`,  icon: 'information-circle-outline' },
  success: { color: '#4CAF50', bg: (dark) => `rgba(76, 175, 80, ${dark ? 0.2 : 0.1})`,   icon: 'checkmark-circle-outline' },
  warning: { color: '#FF6B35', bg: (dark) => `rgba(255, 107, 53, ${dark ? 0.2 : 0.1})`,  icon: 'cloud-offline-outline' },
  error:   { color: '#f44336', bg: (dark) => `rgba(244, 67, 54, ${dark ? 0.2 : 0.1})`,   icon: 'close-circle-outline' },
};

export default function ToastNotification({ message, type = 'info', visible, isDark }) {
  if (!visible) return null;

  const cfg = CONFIG[type] || CONFIG.info;

  return (
    <View style={[styles.container, { backgroundColor: cfg.bg(isDark) }]}>
      <Ionicons name={cfg.icon} size={16} color={cfg.color} />
      <Text style={[styles.text, { color: cfg.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: '20%',
    right: '20%',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1000,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
});
