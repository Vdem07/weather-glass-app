/**
 * LazyMapWidget
 *
 * Виджет карты погоды с ленивой загрузкой WebView.
 * До появления в viewport показывает статичное превью.
 * Работает с нормализованными данными (WeatherData).
 *
 * Props:
 * - weather: WeatherData
 * - isDark: boolean
 * - textColor: string
 * - secondaryTextColor: string
 * - countries: object — i18n-iso-countries
 * - navigation: object
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';

// Фиксированные точки осадков — вне компонента, не пересоздаются при рендере
const PRECIPITATION_DOTS = Array.from({ length: 8 }, (_, i) => ({
  left: (i * 37 + 15) % 220,
  top:  (i * 23 + 10) % 100,
  opacity: 0.3 + (i % 4) * 0.1,
}));

const getWeatherEmoji = (main) => {
  switch (main) {
    case 'Rain':        return '🌧️ Дождь';
    case 'Snow':        return '❄️ Снег';
    case 'Thunderstorm':return '⛈️ Гроза';
    case 'Drizzle':     return '🌦️ Морось';
    case 'Clouds':      return '☁️ Облачно';
    default:            return '☀️ Ясно';
  }
};

const getPrecipitationLabel = (main) => {
  switch (main) {
    case 'Rain':        return 'Дождь';
    case 'Snow':        return 'Снег';
    case 'Thunderstorm':return 'Гроза';
    case 'Drizzle':     return 'Морось';
    default:            return 'Нет осадков';
  }
};

const hasPrecipitation = (main) =>
  ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(main);

const buildMapHTML = (lat, lon, main) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body { margin: 0; padding: 0; background: transparent; }
    #map { height: 120px; width: 100%; pointer-events: none; background: transparent; }
    .leaflet-control-container { display: none !important; }
    .leaflet-container { background: transparent; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    try {
      const map = L.map('map', {
        center: [${lat}, ${lon}], zoom: 10,
        zoomControl: false, attributionControl: false,
        dragging: false, touchZoom: false, doubleClickZoom: false,
        scrollWheelZoom: false, boxZoom: false, keyboard: false,
        fadeAnimation: false, zoomAnimation: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '', maxZoom: 12, keepBuffer: 1 }).addTo(map);
      const icon = L.divIcon({
        html: '<div style="background:#4CAF50;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: 'custom-marker', iconSize: [12, 12], iconAnchor: [6, 6],
      });
      L.marker([${lat}, ${lon}], { icon }).addTo(map);
      ${hasPrecipitation(main) ? `
      setTimeout(() => {
        L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=f24d4864f20da298fdd9ec2436343f99', { opacity: 0.6, maxZoom: 12 }).addTo(map);
      }, 500);` : ''}
      window.ReactNativeWebView?.postMessage('loaded');
    } catch (e) {
      window.ReactNativeWebView?.postMessage('error');
    }
  </script>
</body>
</html>`;

const StaticMapPreview = ({ main }) => (
  <View style={styles.staticPreview}>
    <View style={styles.staticBg}>
      <View style={styles.mapGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: i * 20 }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: i * 45 }]} />
        ))}
      </View>
      <View style={styles.centerMarker}>
        <View style={styles.markerDot} />
        <View style={styles.markerPulse} />
      </View>
      {hasPrecipitation(main) && (
        <View style={styles.precipLayer}>
          {PRECIPITATION_DOTS.map((dot, i) => (
            <View key={i} style={[styles.precipDot, {
              left: dot.left, top: dot.top, opacity: dot.opacity,
              backgroundColor: main === 'Rain' ? '#2196F3' : '#E3F2FD',
            }]} />
          ))}
        </View>
      )}
    </View>
  </View>
);

const LazyMapWidget = ({ weather, isDark, textColor, secondaryTextColor, countries, navigation }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const webViewRef = useRef(null);

  const lat = weather.lat || 55.7558;
  const lon = weather.lon || 37.6173;

  const handleLayout = useCallback(() => {
    if (!isInView) {
      setIsInView(true);
      setTimeout(() => setIsMapLoaded(true), 300);
    }
  }, [isInView]);

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Карта погоды</Text>
      <View style={styles.mapContainer}>
        <TouchableOpacity
          style={[styles.widget, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
          onPress={() => navigation.navigate('WeatherMap', {
            lat, lon,
            cityName:    weather.name,
            countryName: countries.getName(weather.country, 'ru') || weather.country,
          })}
          onLayout={handleLayout}
        >
          <View style={styles.widgetHeader}>
            <View style={styles.widgetTitleRow}>
              <Ionicons name="map" size={24} color={textColor} />
              <Text style={[styles.widgetTitle, { color: textColor }]}>Карта погодных условий</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
          </View>

          <View style={styles.preview}>
            {isMapLoaded ? (
              <WebView
                ref={webViewRef}
                source={{ html: buildMapHTML(lat, lon, weather.main) }}
                style={styles.webView}
                scrollEnabled={false}
                javaScriptEnabled
                cacheEnabled
                renderToHardwareTextureAndroid
                androidLayerType="hardware"
                originWhitelist={['*']}
                mixedContentMode="compatibility"
                onShouldStartLoadWithRequest={() => false}
                onMessage={() => {}}
              />
            ) : (
              <StaticMapPreview main={weather.main} />
            )}
            <View style={styles.overlay}>
              <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }]}>
                <Text style={[styles.badgeText, { color: textColor }]}>{getWeatherEmoji(weather.main)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.widgetInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={16} color={secondaryTextColor} />
              <Text style={[styles.infoText, { color: secondaryTextColor }]}>{weather.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="water" size={16} color={secondaryTextColor} />
              <Text style={[styles.infoText, { color: secondaryTextColor }]}>{getPrecipitationLabel(weather.main)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={secondaryTextColor} />
              <Text style={[styles.infoText, { color: secondaryTextColor }]}>Сейчас</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  mapContainer: { minHeight: 270 },
  widget: { marginHorizontal: 15, borderRadius: 20, padding: 20, overflow: 'hidden' },
  widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  widgetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  widgetTitle: { fontSize: 18, fontWeight: '600' },
  preview: { height: 120, borderRadius: 12, overflow: 'hidden', marginBottom: 15, position: 'relative' },
  webView: { height: 120, borderRadius: 12, backgroundColor: 'transparent' },
  staticPreview: { height: 120, borderRadius: 12, overflow: 'hidden' },
  staticBg: { flex: 1, position: 'relative', backgroundColor: '#e8f5e8' },
  mapGrid: { position: 'absolute', width: '100%', height: '100%' },
  gridLineH: { position: 'absolute', width: '100%', height: 1, backgroundColor: '#d0d0d0', opacity: 0.3 },
  gridLineV: { position: 'absolute', height: '100%', width: 1, backgroundColor: '#d0d0d0', opacity: 0.3 },
  centerMarker: { position: 'absolute', top: '50%', left: '50%', marginTop: -6, marginLeft: -6 },
  markerDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: 'white' },
  markerPulse: { position: 'absolute', top: -6, left: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: '#4CAF50', opacity: 0.3 },
  precipLayer: { position: 'absolute', width: '100%', height: '100%' },
  precipDot: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5 },
  overlay: { position: 'absolute', top: 8, right: 8, zIndex: 1000 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  widgetInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, fontWeight: '500' },
});

export default LazyMapWidget;
