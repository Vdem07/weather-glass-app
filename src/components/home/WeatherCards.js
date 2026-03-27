/**
 * WeatherCards
 *
 * Блок детальных показателей погоды. Поддерживает 4 варианта отображения:
 * - horizontal — горизонтальная прокрутка 1×10
 * - grid — сетка 2×5
 * - horizontal_grid — сетка с горизонтальной прокруткой 5×2
 * - compact — компактный блок со всеми параметрами
 *
 * Работает с нормализованными данными (WeatherData).
 *
 * Props:
 * - weather: WeatherData
 * - hourlyForecast: HourlyForecast[]
 * - isDark: boolean
 * - layout: 'horizontal' | 'grid' | 'horizontal_grid' | 'compact'
 * - units: { tempUnit, windUnit, pressureUnit, visibilityUnit }
 */

import React from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import renderWeatherIcon from '../renderWeatherIcon';
import {
  convertTemperature, getTemperatureSymbol,
  convertWindSpeed, getWindSpeedLabel,
  convertPressure, getPressureLabel,
  convertVisibility, getWindDirection,
} from '../../utils/weatherUnits';
import {
  getWeatherInterpretation,
  getIndicatorColor,
  getPrecipitationProbability,
} from '../../utils/weatherInterpretation';

const buildCards = (weather, hourlyForecast, units) => {
  const { tempUnit, windUnit, pressureUnit, visibilityUnit } = units;
  const precipitation = getPrecipitationProbability(weather, hourlyForecast);

  return [
    {
      id: 'wind',
      title: 'Ветер',
      value: `${convertWindSpeed(weather.windSpeed, windUnit).toFixed(1)} ${getWindSpeedLabel(windUnit)}`,
      subtitle: getWindDirection(weather.windDeg),
      interpretation: getWeatherInterpretation('wind', weather.windSpeed, weather, units),
      color: getIndicatorColor('wind', weather.windSpeed, weather, units),
    },
    {
      id: 'humidity',
      title: 'Влажность',
      value: `${weather.humidity}%`,
      subtitle: 'Относительная влажность',
      interpretation: getWeatherInterpretation('humidity', weather.humidity, weather, units),
      color: getIndicatorColor('humidity', weather.humidity, weather, units),
    },
    {
      id: 'dew_point',
      title: 'Точка росы',
      value: weather.dewPoint ? `${Math.round(convertTemperature(weather.dewPoint, tempUnit))}${getTemperatureSymbol(tempUnit)}` : 'Н/Д',
      subtitle: 'Температура конденсации',
      interpretation: getWeatherInterpretation('dew_point', weather.dewPoint, weather, units),
      color: getIndicatorColor('dew_point', weather.dewPoint, weather, units),
    },
    {
      id: 'pressure',
      title: 'Давление',
      value: `${convertPressure(weather.pressure, pressureUnit)} ${getPressureLabel(pressureUnit)}`,
      subtitle: 'Атмосферное давление',
      interpretation: getWeatherInterpretation('pressure', weather.pressure, weather, units),
      color: getIndicatorColor('pressure', weather.pressure, weather, units),
    },
    {
      id: 'clouds',
      title: 'Облачность',
      value: `${weather.clouds || 0}%`,
      subtitle: 'Покрытие неба облаками',
      interpretation: getWeatherInterpretation('clouds', weather.clouds || 0, weather, units),
      color: getIndicatorColor('clouds', weather.clouds || 0, weather, units),
    },
    {
      id: 'uv',
      title: 'UV индекс',
      value: weather.uvIndex !== undefined ? `${weather.uvIndex}/11` : 'Н/Д',
      subtitle: 'Ультрафиолетовое излучение',
      interpretation: getWeatherInterpretation('uv', weather.uvIndex || 0, weather, units),
      color: getIndicatorColor('uv', weather.uvIndex || 0, weather, units),
    },
    {
      id: 'sunrise',
      title: 'Рассвет',
      value: new Date(weather.sunrise * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      subtitle: 'Восход солнца',
      interpretation: 'Начало светового дня',
      color: '#FF9800',
    },
    {
      id: 'sunset',
      title: 'Закат',
      value: new Date(weather.sunset * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      subtitle: 'Заход солнца',
      interpretation: 'Конец светового дня',
      color: '#FF5722',
    },
    {
      id: 'visibility',
      title: 'Видимость',
      value: convertVisibility(weather.visibility, visibilityUnit),
      subtitle: 'Дальность видимости',
      interpretation: getWeatherInterpretation('visibility', weather.visibility, weather, units),
      color: getIndicatorColor('visibility', weather.visibility, weather, units),
    },
    {
      id: 'precipitation',
      title: 'Осадки',
      value: precipitation,
      subtitle: 'Вероятность осадков',
      interpretation: getWeatherInterpretation('precipitation', precipitation, weather, units),
      color: getIndicatorColor('precipitation', precipitation, weather, units),
    },
  ];
};

const Card = ({ item, isDark, style }) => {
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <BlurView intensity={40} style={[style, { backgroundColor: cardBg }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={[styles.cardTitle, { color: textColor }]}>{item.title}</Text>
          <Text style={[styles.cardValue, { color: textColor }]}>{item.value}</Text>
          {item.subtitle && (
            <Text style={[styles.cardSubtitle, { color: secondaryTextColor }]}>{item.subtitle}</Text>
          )}
        </View>
        <View style={styles.cardIcon}>{renderWeatherIcon(item.id, 38)}</View>
      </View>
      <View style={styles.cardBottom}>
        <Text style={[styles.cardInterpretation, { color: secondaryTextColor }]}>{item.interpretation}</Text>
      </View>
    </BlurView>
  );
};

export default function WeatherCards({ weather, hourlyForecast, isDark, layout = 'horizontal', units = {} }) {
  const textColor = isDark ? '#fff' : '#333';
  const compactBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const cards = buildCards(weather, hourlyForecast, units);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Детали погоды</Text>

      {layout === 'compact' && (
        <BlurView intensity={40} style={[styles.compactContainer, { backgroundColor: compactBg }]}>
          <View style={styles.compactGrid}>
            {cards.map((item) => (
              <View key={item.id} style={styles.compactItem}>
                {renderWeatherIcon(item.id, 24)}
                <Text style={[styles.compactTitle, { color: textColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {item.title}
                </Text>
                <Text style={[styles.compactValue, { color: textColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </BlurView>
      )}

      {layout === 'grid' && (
        <View style={styles.grid}>
          {cards.map((item) => (
            <Card key={item.id} item={item} isDark={isDark} style={styles.gridCard} />
          ))}
        </View>
      )}

      {layout === 'horizontal_grid' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.horizontalGrid}>
            {cards.map((item) => (
              <Card key={item.id} item={item} isDark={isDark} style={styles.horizontalGridCard} />
            ))}
          </View>
        </ScrollView>
      )}

      {layout === 'horizontal' && (
        <FlatList
          data={cards}
          horizontal
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.horizontalList}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card item={item} isDark={isDark} style={styles.horizontalCard} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 15 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  horizontalList: { paddingHorizontal: 15, gap: 10 },
  horizontalCard: { width: 160, minHeight: 150, borderRadius: 16, padding: 16, justifyContent: 'space-between', overflow: 'hidden' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingHorizontal: 15 },
  gridCard: { width: '48%', minHeight: 150, borderRadius: 16, padding: 16, justifyContent: 'space-between', overflow: 'hidden' },
  horizontalGrid: { flexDirection: 'column', flexWrap: 'wrap', height: 320, paddingHorizontal: 15, gap: 10 },
  horizontalGridCard: { width: 160, height: 150, borderRadius: 16, padding: 16, justifyContent: 'center', overflow: 'hidden' },
  compactContainer: { marginHorizontal: 15, paddingVertical: 20, paddingHorizontal: 15, borderRadius: 20, overflow: 'hidden' },
  compactGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'flex-start', rowGap: 20, columnGap: 5 },
  compactItem: { width: '23%', minWidth: 65, alignItems: 'center', gap: 6 },
  compactTitle: { fontSize: 10, fontWeight: '600', textAlign: 'center', opacity: 0.8 },
  compactValue: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1 },
  cardLeft: { flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start' },
  cardIcon: { alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  cardValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  cardSubtitle: { fontSize: 11, fontWeight: '500', lineHeight: 13 },
  cardBottom: { alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  cardInterpretation: { fontSize: 11, fontWeight: '500', lineHeight: 13, textAlign: 'center' },
});
