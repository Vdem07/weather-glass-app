/**
 * MapLayersPanel
 *
 * Нижняя панель выбора слоёв карты погоды.
 * Рендерится поверх карты с размытым фоном.
 *
 * Props:
 * - layers: array — [{ id, name, iconType, color }]
 * - selectedLayer: string
 * - isDark: boolean
 * - backgroundImage: ImageSourcePropType
 * - onLayerChange: (layerId) => void
 */

import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ScrollView, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import renderWeatherIcon from '../renderWeatherIcon';

export default function MapLayersPanel({ layers, selectedLayer, isDark, backgroundImage, onLayerChange }) {
  const textColor = isDark ? '#fff' : '#333';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={styles.container}>
      <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.bg} blurRadius={70}>
        <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
            {layers.map((layer) => (
              <TouchableOpacity
                key={layer.id}
                onPress={() => onLayerChange(layer.id)}
                style={[styles.btn, { backgroundColor: selectedLayer === layer.id ? layer.color : cardBg }]}
              >
                {renderWeatherIcon(layer.iconType, 32)}
                <Text style={[styles.btnText, { color: selectedLayer === layer.id ? '#fff' : textColor }]}>
                  {layer.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BlurView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000 },
  bg: { flex: 1 },
  blur: { paddingVertical: 20, paddingBottom: 80, backgroundColor: 'rgba(0,0,0,0.2)' },
  list: { paddingHorizontal: 15, gap: 10 },
  btn: { minWidth: 120, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', gap: 6 },
  btnText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
