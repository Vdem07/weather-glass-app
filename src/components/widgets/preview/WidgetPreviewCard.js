/**
 * WidgetPreviewCard
 *
 * Блок предварительного просмотра одного виджета:
 * заголовок, описание и превью через WidgetPreview.
 *
 * Props:
 * - title: string
 * - desc: string
 * - width: number
 * - height: number
 * - Component: React component — виджет для рендера
 * - weatherData: object — данные для виджета
 * - isDark: boolean
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WidgetPreview } from 'react-native-android-widget';

export default function WidgetPreviewCard({ title, desc, width, height, Component, weatherData, isDark }) {
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <Text style={[styles.desc, { color: secondaryTextColor }]}>{desc}</Text>
      <View style={styles.preview}>
        <WidgetPreview
          renderWidget={() => <Component {...weatherData} />}
          width={width}
          height={height}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 5 },
  title: { fontSize: 18, fontWeight: 'bold' },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  preview: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 15,
  },
});
