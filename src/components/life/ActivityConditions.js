/**
 * ActivityConditions
 *
 * Сетка карточек текущих условий для активности (2×2).
 *
 * Props:
 * - conditions: array — [{ title, value, color, icon }]
 * - isDark: boolean
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ActivityConditions({ conditions, isDark }) {
  const textColor = isDark ? '#fff' : '#333';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Текущие условия</Text>
      <View style={styles.grid}>
        {conditions.map((cond, i) => (
          <View key={i} style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <Ionicons name={cond.icon} size={24} color={cond.color} />
              <Text style={[styles.cardTitle, { color: textColor }]}>{cond.title}</Text>
            </View>
            <View style={[styles.valueWrapper, { backgroundColor: cond.color }]}>
              <Text style={styles.value}>{cond.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 10,
    gap: 10,
    minHeight: 110,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
  },
  valueWrapper: {
    borderRadius: 18,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 20,
    color: '#fff',
    textAlign: 'center',
  },
});
