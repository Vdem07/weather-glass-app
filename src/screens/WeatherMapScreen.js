import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ImageBackground,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeContext } from '../theme/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import WebView from 'react-native-webview';
import renderWeatherIcon from '../components/renderWeatherIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WeatherMapScreen({ navigation, route }) {
  const { lat, lon, cityName, countryName } = route.params;
  const { isDark } = useThemeContext();
  
  const [selectedLayer, setSelectedLayer] = useState('precipitation');
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef(null);

  // Состояния для единиц измерения
  const [units, setUnits] = useState({
    temperature: 'metric', // metric (°C) или imperial (°F)
    wind: 'm/s', // m/s, km/h, mph
    pressure: 'mmHg', // mmHg, hPa, bar, psi
  });

  // Цвета для адаптации под тему
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const iconColor = isDark ? '#fff' : '#333';
  const cardBackgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  
  // Фон точно как в HomeScreen
  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  // Загружаем настройки единиц измерения
  useEffect(() => {
    const loadUnits = async () => {
      try {
        const savedTempUnit = await AsyncStorage.getItem('unit');
        const savedWindUnit = await AsyncStorage.getItem('windUnit');
        const savedPressureUnit = await AsyncStorage.getItem('pressureUnit');

        setUnits({
          temperature: savedTempUnit || 'metric',
          wind: savedWindUnit || 'm/s',
          pressure: savedPressureUnit || 'mmHg',
        });
      } catch (error) {
        console.error('Ошибка загрузки единиц измерения:', error);
      }
    };

    loadUnits();
  }, []);

  // Слои карты с обновленными контрастными цветами
  const mapLayers = [
    {
      id: 'precipitation',
      name: 'Осадки',
      iconType: 'precipitation',
      color: '#1414ff',
      description: 'Дождь и снег'
    },
    {
      id: 'clouds',
      name: 'Облачность',
      iconType: 'clouds',
      color: '#6b6b6b',
      description: 'Облачный покров'
    },
    {
      id: 'temperature',
      name: 'Температура',
      iconType: 'temperature',
      color: '#fc8014',
      description: 'Температурная карта'
    },
    {
      id: 'wind',
      name: 'Ветер',  
      iconType: 'wind',
      color: '#7b4cac',
      description: 'Направление и скорость'
    },
    {
      id: 'pressure',
      name: 'Давление',
      iconType: 'pressure',
      color: '#f3363b',
      description: 'Атмосферное давление'
    }
  ];

  // HTML для WebView с интегрированной картой OpenStreetMap и контрастными слоями
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weather Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            body { 
                margin: 0; 
                padding: 0; 
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                background: transparent;
            }
            #map { 
                height: 100vh; 
                width: 100vw; 
                border-radius: 0;
            }
            .legend {
                position: absolute;
                bottom: 185px;
                right: 10px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                padding: 12px;
                border-radius: 12px;
                font-size: 11px;
                z-index: 1000;
                max-width: 180px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .leaflet-control-zoom {
                margin-top: 120px !important;
            }
            .legend-title {
                font-weight: 600;
                margin-bottom: 8px;
                color: #1a1a1a;
                font-size: 12px;
                text-align: center;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                padding-bottom: 6px;
            }
            .legend-item {
                display: flex;
                align-items: center;
                margin-bottom: 3px;
                font-size: 10px;
            }
            .legend-color {
                width: 14px;
                height: 14px;
                margin-right: 6px;
                border-radius: 3px;
                border: 1px solid rgba(0, 0, 0, 0.1);
                flex-shrink: 0;
            }
            .legend-item span {
                color: #333;
                font-weight: 500;
                line-height: 1.2;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <div class="legend" id="legend"></div>
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            const API_KEY = 'f24d4864f20da298fdd9ec2436343f99';
            let map;
            let currentLayer = null;
            let marker = null;
            
            // Настройки единиц измерения (будут обновлены из React Native)
            let currentUnits = {
                temperature: '${units.temperature}',
                wind: '${units.wind}',
                pressure: '${units.pressure}'
            };
            
            // Функции конвертации единиц измерения
            function convertTemperature(celsius, unit) {
                if (unit === 'imperial') {
                    return Math.round((celsius * 9/5) + 32);
                }
                return Math.round(celsius);
            }
            
            function getTemperatureUnit(unit) {
                return unit === 'imperial' ? '°F' : '°C';
            }
            
            function convertWindSpeed(ms, unit) {
                switch (unit) {
                    case 'km/h':
                        return Math.round(ms * 3.6);
                    case 'mph':
                        return Math.round(ms * 2.237);
                    default: // m/s
                        return Math.round(ms);
                }
            }
            
            function getWindSpeedUnit(unit) {
                switch (unit) {
                    case 'km/h': return 'км/ч';
                    case 'mph': return 'mph';
                    default: return 'м/с';
                }
            }
            
            function convertPressure(hPa, unit) {
                switch (unit) {
                    case 'mmHg':
                        return Math.round(hPa * 0.750062);
                    case 'bar':
                        return (hPa / 1000).toFixed(2);
                    case 'psi':
                        return (hPa * 0.0145038).toFixed(1);
                    default: // hPa
                        return Math.round(hPa);
                }
            }
            
            function getPressureUnit(unit) {
                switch (unit) {
                    case 'mmHg': return 'мм рт.ст.';
                    case 'bar': return 'бар';
                    case 'psi': return 'PSI';
                    default: return 'гПа';
                }
            }
            
            function initMap() {
                map = L.map('map').setView([${lat}, ${lon}], 10);
                
                // Базовая карта
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                
                // Маркер текущего местоположения
                marker = L.marker([${lat}, ${lon}])
                    .addTo(map)
                    .bindPopup('<b>${cityName}</b><br>${countryName}')
                    .openPopup();
                
                // Загружаем слой по умолчанию
                updateLayer('${selectedLayer}');
            }
            
            function updateLayer(layerType) {
                // Удаляем предыдущий слой
                if (currentLayer) {
                    map.removeLayer(currentLayer);
                }
                
                let layerUrl = '';
                
                switch(layerType) {
                    case 'precipitation':
                        layerUrl = \`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=\${API_KEY}\`;
                        break;
                    case 'clouds':
                        layerUrl = \`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=\${API_KEY}\`;
                        break;
                    case 'temperature':
                        layerUrl = \`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=\${API_KEY}\`;
                        break;
                    case 'wind':
                        layerUrl = \`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=\${API_KEY}\`;
                        break;
                    case 'pressure':
                        layerUrl = \`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=\${API_KEY}\`;
                        break;
                }
                
                // Добавляем новый слой с повышенной прозрачностью для лучшей контрастности
                currentLayer = L.tileLayer(layerUrl, {
                    opacity: 0.8
                }).addTo(map);
                
                // Обновляем легенду
                updateLegend(layerType);
            }
            
            function updateLegend(layerType) {
                const legend = document.getElementById('legend');
                const layerNames = {
                    precipitation: 'Осадки',
                    clouds: 'Облачность', 
                    temperature: 'Температура',
                    wind: 'Ветер',
                    pressure: 'Давление'
                };
                
                // Обновленные более контрастные цвета на основе официальной документации
                let legendData = [];
                
                switch(layerType) {
                    case 'precipitation':
                        legendData = [
                            { color: '#e1c864', label: '0.1 мм/ч' },
                            { color: '#9696aa', label: '0.5 мм/ч' }, 
                            { color: '#7878bd', label: '1 мм/ч' },
                            { color: '#6e6ecd', label: '10 мм/ч' },
                            { color: '#5050e1', label: '50 мм/ч' },
                            { color: '#1414ff', label: '140+ мм/ч' }
                        ];
                        break;
                    case 'clouds':
                        legendData = [
                            { color: 'rgba(255,255,255,0.2)', label: '10%', border: true },
                            { color: 'rgba(250,250,255,0.4)', label: '30%', border: true },
                            { color: 'rgba(247,247,255,0.6)', label: '50%', border: true },
                            { color: 'rgba(244,244,255,0.8)', label: '70%', border: true },
                            { color: 'rgba(242,241,255,1)', label: '90%', border: true },
                            { color: 'rgba(240,240,255,1)', label: '100%', border: true }
                        ];
                        break;
                    case 'temperature':
                        const tempUnit = getTemperatureUnit(currentUnits.temperature);
                        legendData = [
                            { color: '#821692', label: convertTemperature(-40, currentUnits.temperature) + tempUnit },
                            { color: '#8257db', label: convertTemperature(-30, currentUnits.temperature) + tempUnit },
                            { color: '#208cec', label: convertTemperature(-20, currentUnits.temperature) + tempUnit },
                            { color: '#20c4e8', label: convertTemperature(-10, currentUnits.temperature) + tempUnit },
                            { color: '#23dddd', label: convertTemperature(0, currentUnits.temperature) + tempUnit },
                            { color: '#c2ff28', label: convertTemperature(10, currentUnits.temperature) + tempUnit },
                            { color: '#fff028', label: convertTemperature(20, currentUnits.temperature) + tempUnit },
                            { color: '#ffc228', label: convertTemperature(25, currentUnits.temperature) + tempUnit },
                            { color: '#fc8014', label: convertTemperature(30, currentUnits.temperature) + '+' + tempUnit }
                        ];
                        break;
                    case 'wind':
                        const windUnit = getWindSpeedUnit(currentUnits.wind);
                        legendData = [
                            { color: 'rgba(255,255,255,0.3)', label: \`0-\${convertWindSpeed(1, currentUnits.wind)} \${windUnit}\`, border: true },
                            { color: 'rgba(238,206,206,0.6)', label: \`\${convertWindSpeed(1, currentUnits.wind)}-\${convertWindSpeed(5, currentUnits.wind)} \${windUnit}\`, border: true },
                            { color: 'rgba(179,100,188,0.8)', label: \`\${convertWindSpeed(5, currentUnits.wind)}-\${convertWindSpeed(15, currentUnits.wind)} \${windUnit}\` },
                            { color: 'rgba(63,33,59,0.9)', label: \`\${convertWindSpeed(15, currentUnits.wind)}-\${convertWindSpeed(25, currentUnits.wind)} \${windUnit}\` },
                            { color: 'rgba(116,76,172,1)', label: \`\${convertWindSpeed(25, currentUnits.wind)}-\${convertWindSpeed(50, currentUnits.wind)} \${windUnit}\` },
                            { color: 'rgba(70,0,175,1)', label: \`\${convertWindSpeed(50, currentUnits.wind)}-\${convertWindSpeed(100, currentUnits.wind)} \${windUnit}\` },
                            { color: 'rgba(13,17,38,1)', label: \`\${convertWindSpeed(100, currentUnits.wind)}+ \${windUnit}\` }
                        ];
                        break;
                    case 'pressure':
                        const pressureUnit = getPressureUnit(currentUnits.pressure);
                        legendData = [
                            { color: '#0073ff', label: \`\${convertPressure(940, currentUnits.pressure)} \${pressureUnit}\` },
                            { color: '#00aaff', label: \`\${convertPressure(960, currentUnits.pressure)} \${pressureUnit}\` },
                            { color: '#4bd0d6', label: \`\${convertPressure(980, currentUnits.pressure)} \${pressureUnit}\` },
                            { color: '#8de7c7', label: \`\${convertPressure(1000, currentUnits.pressure)} \${pressureUnit}\` },
                            { color: '#b0f720', label: \`\${convertPressure(1010, currentUnits.pressure)} \${pressureUnit}\` },
                            { color: '#f0b800', label: \`\${convertPressure(1020, currentUnits.pressure)} \${pressureUnit}\` },
                            { color: '#fb5515', label: \`\${convertPressure(1040, currentUnits.pressure)} \${pressureUnit}\` },
                            { color: '#f3363b', label: \`\${convertPressure(1060, currentUnits.pressure)} \${pressureUnit}\` },
                            { color: '#c60000', label: \`\${convertPressure(1080, currentUnits.pressure)}+ \${pressureUnit}\` }
                        ];
                        break;
                }
                
                legend.innerHTML = \`
                    <div class="legend-title">\${layerNames[layerType]}</div>
                    \${legendData.map(item => \`
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: \${item.color}; \${item.border ? 'border: 1.5px solid #666;' : ''}"></div>
                            <span>\${item.label}</span>
                        </div>
                    \`).join('')}
                \`;
            }
            
            // Функция для обработки сообщений от React Native
            window.addEventListener('message', function(event) {
                const data = JSON.parse(event.data);
                if (data.action === 'changeLayer') {
                    updateLayer(data.layer);
                } else if (data.action === 'updateUnits') {
                    // Обновляем единицы измерения
                    currentUnits = data.units;
                    // Перерисовываем текущую легенду с новыми единицами
                    updateLegend(data.currentLayer || 'precipitation');
                }
            });
            
            // Инициализируем карту после загрузки DOM
            document.addEventListener('DOMContentLoaded', initMap);
        </script>
    </body>
    </html>
  `;

  const changeLayer = (layerId) => {
    setSelectedLayer(layerId);
    if (webViewRef.current) {
      const message = JSON.stringify({
        action: 'changeLayer',
        layer: layerId
      });
      webViewRef.current.postMessage(message);
    }
  };

  // Функция для обновления единиц измерения в WebView
  const updateUnitsInWebView = () => {
    if (webViewRef.current) {
      const message = JSON.stringify({
        action: 'updateUnits',
        units: units,
        currentLayer: selectedLayer
      });
      webViewRef.current.postMessage(message);
    }
  };

  // Обновляем единицы в WebView когда они изменяются
  useEffect(() => {
    if (!isLoading) {
      updateUnitsInWebView();
    }
  }, [units, isLoading]);

  // Обработчик сообщений от WebView
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.action === 'disableScroll') {
        setScrollEnabled(false);
      } else if (data.action === 'enableScroll') {
        // Добавляем небольшую задержку для плавности
        setTimeout(() => {
          setScrollEnabled(true);
        }, 100);
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  };

  // Функция для обработки загрузки WebView
  const handleWebViewLoadEnd = () => {
    setIsLoading(false);
    // Отправляем единицы измерения после загрузки
    setTimeout(() => {
      updateUnitsInWebView();
    }, 500);
  };

  return (
    <ImageBackground
      source={backgroundImage}
      resizeMode="cover"
      style={styles.background}
      blurRadius={70}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
        
        {/* Карта на весь экран */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML }}
            style={styles.webView}
            onLoadEnd={handleWebViewLoadEnd}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlaybook={true}
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={['*']}
            mixedContentMode={'compatibility'}
            allowsProtectedMedia={false}
          />
          
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <Text style={[styles.loadingText, { color: textColor }]}>
                Загрузка карты...
              </Text>
            </View>
          )}
        </View>

        {/* Заголовок поверх карты */}
        <View style={styles.header}>
          <ImageBackground
            source={backgroundImage}
            resizeMode="cover"
            style={styles.headerBackground}
            blurRadius={70}
          >
            <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.headerBlur}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
              >
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="chevron-back" size={20} color={iconColor} />
                </View>
              </TouchableOpacity>
              
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: textColor }]}>
                  Карта погоды
                </Text>
                <Text style={[styles.headerSubtitle, { color: secondaryTextColor }]}>
                  {cityName}, {countryName}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Информация о карте",
                    "Данные карты предоставляются OpenWeatherMap. Цвета показывают интенсивность явлений в реальном времени. Единицы измерения соответствуют настройкам приложения.",
                    [{ text: "OK", style: "default" }]
                  );
                }}
                style={[styles.infoButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
              >
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="information-circle-outline" size={24} color={iconColor} />
                </View>
              </TouchableOpacity>
            </BlurView>
          </ImageBackground>
        </View>

        {/* Панель выбора слоев поверх карты снизу */}
        <View style={styles.layersPanel}>
          <ImageBackground
            source={backgroundImage}
            resizeMode="cover"
            style={styles.layersPanelBackground}
            blurRadius={70}
          >
            <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.layersPanelBlur}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.layersContainer}
              >
                {mapLayers.map((layer) => (
                  <TouchableOpacity
                    key={layer.id}
                    onPress={() => changeLayer(layer.id)}
                    style={[
                      styles.layerButton,
                      {
                        backgroundColor: selectedLayer === layer.id 
                          ? layer.color 
                          : cardBackgroundColor,
                      }
                    ]}
                  >
                    {renderWeatherIcon(
                      layer.iconType, 
                      32, 
                    )}
                    <Text
                      style={[
                        styles.layerButtonText,
                        {
                          color: selectedLayer === layer.id ? '#fff' : textColor,
                        }
                      ]}
                    >
                      {layer.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </BlurView>
          </ImageBackground>
        </View>
        
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // Базовые контейнеры (точно как в HomeScreen)
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  blurOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)', // Точно как в HomeScreen
  },
  mapContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerBackground: {
    flex: 1,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 15,
    gap: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
  },
  layersPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  layersPanelBackground: {
    flex: 1,
  },
  layersPanelBlur: {
    paddingVertical: 20,
    paddingBottom: 80,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  layersContainer: {
    paddingHorizontal: 15,
    gap: 10,
  },
  layerButton: {
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  layerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});