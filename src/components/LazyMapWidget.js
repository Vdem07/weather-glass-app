import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';

// Компонент ленивой загрузки карты
const LazyMapWidget = ({ weather, isDark, textColor, secondaryTextColor, countries, navigation }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const webViewRef = useRef(null);

  // HTML для карты - выносим в константу для оптимизации
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            body { margin: 0; padding: 0; background: transparent; }
            #map { 
                height: 120px; 
                width: 100%; 
                border-radius: 0;
                pointer-events: none;
                background: transparent;
            }
            .leaflet-control-container {
                display: none !important;
            }
            .leaflet-marker-icon {
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }
            .leaflet-container {
                background: transparent;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            try {
                const map = L.map('map', {
                    center: [${weather.coord?.lat || 55.7558}, ${weather.coord?.lon || 37.6173}],
                    zoom: 10,
                    zoomControl: false,
                    attributionControl: false,
                    dragging: false,
                    touchZoom: false,
                    doubleClickZoom: false,
                    scrollWheelZoom: false,
                    boxZoom: false,
                    keyboard: false,
                    fadeAnimation: false,
                    zoomAnimation: false,
                    markerZoomAnimation: false
                });
                
                // Базовая карта с оптимизацией
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '',
                    maxZoom: 12,
                    keepBuffer: 1
                }).addTo(map);
                
                // Простой маркер без лишних эффектов
                const customIcon = L.divIcon({
                    html: '<div style="background: #4CAF50; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    className: 'custom-marker',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                });
                
                L.marker([${weather.coord?.lat || 55.7558}, ${weather.coord?.lon || 37.6173}], {
                    icon: customIcon
                }).addTo(map);
                
                // Добавляем слой осадков только если есть осадки
                ${weather.weather[0].main === 'Rain' || weather.weather[0].main === 'Drizzle' || weather.weather[0].main === 'Thunderstorm' || weather.weather[0].main === 'Snow' ? `
                setTimeout(() => {
                    const weatherLayer = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=f24d4864f20da298fdd9ec2436343f99', {
                        opacity: 0.6,
                        maxZoom: 12
                    }).addTo(map);
                }, 500);
                ` : ''}
                
                // Уведомляем о готовности
                window.ReactNativeWebView?.postMessage('loaded');
                
            } catch (error) {
                console.error('Map error:', error);
                window.ReactNativeWebView?.postMessage('error');
            }
        </script>
    </body>
    </html>
  `;

  // Обработчик появления элемента в viewport
  const handleLayout = useCallback((event) => {
    if (!isInView) {
      setIsInView(true);
      // Задержка для плавности
      setTimeout(() => {
        setIsMapLoaded(true);
      }, 300);
    }
  }, [isInView]);

  // Fallback превью без WebView
  const StaticMapPreview = () => (
    <View style={styles.staticPreview}>
      <View style={styles.staticMapBackground}>
        {/* Сетка для имитации карты */}
        <View style={styles.mapGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={`h-${i}`} style={[styles.mapGridLine, { top: i * 20 }]} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={`v-${i}`} style={[styles.mapGridLineVertical, { left: i * 45 }]} />
          ))}
        </View>
        
        {/* Центральная точка */}
        <View style={styles.centerMarker}>
          <View style={styles.markerDot} />
          <View style={styles.markerPulse} />
        </View>
        
        {/* Индикатор погоды */}
        {(weather.weather[0].main === 'Rain' || weather.weather[0].main === 'Snow') && (
          <View style={styles.weatherIndicators}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.precipitationDot,
                  {
                    left: Math.random() * 220,
                    top: Math.random() * 100,
                    backgroundColor: weather.weather[0].main === 'Rain' ? '#2196F3' : '#E3F2FD',
                    opacity: 0.3 + Math.random() * 0.4
                  }
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Карта погоды
      </Text>
      <View style={styles.MapContainer}>
        <TouchableOpacity
          style={[
            styles.mapWidget,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]}
          onPress={() => navigation.navigate('WeatherMap', {
            lat: weather.coord?.lat,
            lon: weather.coord?.lon,
            cityName: weather.name,
            countryName: countries.getName(weather.sys.country, 'ru') || weather.sys.country
          })}
          onLayout={handleLayout}
        >
          {/* Заголовок виджета */}
          <View style={styles.mapWidgetHeader}>
            <View style={styles.mapWidgetTitleContainer}>
              <Ionicons name="map" size={24} color={textColor} />
              <Text style={[styles.mapWidgetTitle, { color: textColor }]}>
                Карта погодных условий
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
          </View>
          
          {/* Превью карты */}
          <View style={styles.mapWidgetPreview}>
            {isMapLoaded ? (
              <WebView
                ref={webViewRef}
                source={{ html: mapHTML }}
                style={styles.webViewStyle}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={false}
                startInLoadingState={false}
                originWhitelist={['*']}
                mixedContentMode={'compatibility'}
                onShouldStartLoadWithRequest={() => false}
                onMessage={(event) => {
                  const message = event.nativeEvent.data;
                  if (message === 'loaded') {
                    console.log('Map loaded successfully');
                  } else if (message === 'error') {
                    console.log('Map failed to load');
                  }
                }}
                // Оптимизации для производительности
                cacheEnabled={true}
                incognito={false}
                renderToHardwareTextureAndroid={true}
                androidLayerType="hardware"
                // Отключаем ненужные функции
                allowsInlineMediaPlayback={false}
                mediaPlaybackRequiresUserAction={true}
                allowsBackForwardNavigationGestures={false}
                bounces={false}
                // Настройки сети
                cacheMode="LOAD_CACHE_ELSE_NETWORK"
              />
            ) : (
              <StaticMapPreview />
            )}
            
            {/* Оверлей с информацией о погоде */}
            <View style={styles.mapOverlay}>
              <View style={[
                styles.weatherBadge,
                { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }
              ]}>
                <Text style={[styles.weatherBadgeText, { color: textColor }]}>
                  {weather.weather[0].main === 'Rain' ? '🌧️ Дождь' :
                   weather.weather[0].main === 'Snow' ? '❄️ Снег' :
                   weather.weather[0].main === 'Thunderstorm' ? '⛈️ Гроза' :
                   weather.weather[0].main === 'Drizzle' ? '🌦️ Морось' :
                   weather.weather[0].main === 'Clouds' ? '☁️ Облачно' :
                   '☀️ Ясно'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Информация о карте */}
          <View style={styles.mapWidgetInfo}>
            <View style={styles.mapInfoItem}>
              <Ionicons name="location" size={16} color={secondaryTextColor} />
              <Text style={[styles.mapInfoText, { color: secondaryTextColor }]}>
                {weather.name}
              </Text>
            </View>
            
            <View style={styles.mapInfoItem}>
              <Ionicons name="water" size={16} color={secondaryTextColor} />
              <Text style={[styles.mapInfoText, { color: secondaryTextColor }]}>
                {weather.weather[0].main === 'Rain' ? 'Дождь' :
                 weather.weather[0].main === 'Snow' ? 'Снег' :
                 weather.weather[0].main === 'Thunderstorm' ? 'Гроза' :
                 weather.weather[0].main === 'Drizzle' ? 'Морось' :
                 'Нет осадков'}
              </Text>
            </View>
            
            <View style={styles.mapInfoItem}>
              <Ionicons name="time" size={16} color={secondaryTextColor} />
              <Text style={[styles.mapInfoText, { color: secondaryTextColor }]}>
                Сейчас
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Стили для нового компонента
const styles = {
  sectionContainer: {
    gap: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  MapContainer: {
    minHeight: 270,
  },
  mapWidget: {
    marginHorizontal: 15,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  mapWidgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  mapWidgetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapWidgetTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  mapWidgetPreview: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
  },
  webViewStyle: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  // Стили для статичного превью
  staticPreview: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  staticMapBackground: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e8f5e8',
  },
  mapGrid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  mapGridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#d0d0d0',
    opacity: 0.3,
  },
  mapGridLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: '#d0d0d0',
    opacity: 0.3,
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -6,
    marginLeft: -6,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerPulse: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    opacity: 0.3,
  },
  weatherIndicators: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  precipitationDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  // Остальные стили остаются прежними
  mapOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1000,
  },
  weatherBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weatherBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapWidgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapInfoText: {
    fontSize: 12,
    fontWeight: '500',
  },
};

export default LazyMapWidget;