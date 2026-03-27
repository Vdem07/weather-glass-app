/**
 * ActivityRecommendations
 *
 * Блок рекомендаций для активности с цветными точками.
 *
 * Props:
 * - recommendations: string[]
 * - color: string — цвет точек (цвет активности)
 * - isDark: boolean
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ActivityRecommendations({ recommendations, color, isDark }) {
  const textColor = isDark ? '#fff' : '#333';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Рекомендации</Text>
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        {recommendations.map((rec, i) => (
          <View key={i} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.text, { color: textColor }]}>{rec}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 15,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
