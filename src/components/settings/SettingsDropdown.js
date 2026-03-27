/**
 * SettingsDropdown
 *
 * Переиспользуемый блок настройки с выпадающим списком.
 *
 * Props:
 * - label: string — название настройки
 * - current: string — текущее значение (отображается в кнопке)
 * - items: [{ label, value }] — варианты выбора
 * - isOpen: boolean
 * - onToggle: () => void — открыть/закрыть
 * - onSelect: (value) => void — выбрать значение
 * - onClose: () => void — закрыть
 * - isDark: boolean
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

export default function SettingsDropdown({ label, current, items, isOpen, onToggle, onSelect, onClose, isDark }) {
  const textColor = isDark ? '#fff' : '#000';
  const borderColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.btn, { borderColor }]}
        onPress={onToggle}
      >
        <Text style={[styles.btnText, { color: textColor }]}>{current}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={[styles.dropdown, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={styles.dropdownContent}>
            {items.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { onSelect(item.value); onClose(); }}
                style={[
                  styles.dropdownItem,
                  { borderBottomWidth: i === items.length - 1 ? 0 : 1, borderBottomColor: isDark ? '#444' : '#eee' },
                ]}
              >
                <Text style={[styles.dropdownItemText, { color: textColor }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { fontSize: 16, fontWeight: '500' },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  btnText: { textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  dropdown: { borderRadius: 20, marginTop: 10, overflow: 'hidden', maxHeight: 350 },
  dropdownContent: { paddingVertical: 6 },
  dropdownItem: { paddingHorizontal: 15, paddingVertical: 12, justifyContent: 'center', minHeight: 44 },
  dropdownItemText: { textAlign: 'center', fontWeight: '500', fontSize: 15 },
});
