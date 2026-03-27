/**
 * WeatherMapScreen
 *
 * Экран интерактивной карты погоды.
 * Управляет WebView, слоями карты и передачей единиц измерения в HTML.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import WebView from 'react-native-webview';
import { useThemeContext } from '../theme/ThemeContext';
import { useWeatherSettings } from '../hooks/useWeatherSettings';
import { buildMapHTML } from '../utils/mapHTML';
import MapHeader from '../components/map/MapHeader';
import MapLayersPanel from '../components/map/MapLayersPanel';

const MAP_LAYERS = [
  { id: 'precipitation', name: 'Осадки',     iconType: 'precipitation', color: '#1414ff' },
  { id: 'clouds',        name: 'Облачность',  iconType: 'clouds',        color: '#6b6b6b' },
  { id: 'temperature',   name: 'Температура', iconType: 'temperature',   color: '#fc8014' },
  { id: 'wind',          name: 'Ветер',       iconType: 'wind',          color: '#7b4cac' },
  { id: 'pressure',      name: 'Давление',    iconType: 'pressure',      color: '#f3363b' },
];

export default function WeatherMapScreen({ navigation, route }) {
  const { lat, lon, cityName, countryName } = route.params;
  const { isDark } = useThemeContext();
  const { settings } = useWeatherSettings();

  const [selectedLayer, setSelectedLayer] = useState('precipitation');
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef(null);

  const units = {
    temperature: settings.tempUnit,
    wind: settings.windUnit,
    pressure: settings.pressureUnit,
  };

  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  const postMessage = (data) => webViewRef.current?.postMessage(JSON.stringify(data));

  const handleLayerChange = (layerId) => {
    setSelectedLayer(layerId);
    postMessage({ action: 'changeLayer', layer: layerId });
  };

  const handleWebViewLoadEnd = () => {
    setIsLoading(false);
    setTimeout(() => postMessage({ action: 'updateUnits', units, currentLayer: selectedLayer }), 500);
  };

  useEffect(() => {
    if (!isLoading) postMessage({ action: 'updateUnits', units, currentLayer: selectedLayer });
  }, [settings.tempUnit, settings.windUnit, settings.pressureUnit, isLoading]);

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.background} blurRadius={70}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>

        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: buildMapHTML(lat, lon, cityName, countryName, selectedLayer, units) }}
            style={styles.webView}
            onLoadEnd={handleWebViewLoadEnd}
            onMessage={() => {}}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="compatibility"
          />
        </View>

        <MapHeader
          cityName={cityName}
          countryName={countryName}
          isDark={isDark}
          navigation={navigation}
          backgroundImage={backgroundImage}
        />

        <MapLayersPanel
          layers={MAP_LAYERS}
          selectedLayer={selectedLayer}
          isDark={isDark}
          backgroundImage={backgroundImage}
          onLayerChange={handleLayerChange}
        />

      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'center' },
  blurOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  mapContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  webView: { flex: 1, backgroundColor: 'transparent' },
});
