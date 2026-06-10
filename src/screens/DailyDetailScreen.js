/**
 * DailyDetailScreen
 *
 * Почасовой прогноз на выбранный день (шаг 3 часа).
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { useThemeContext } from '../theme/ThemeContext';
import WeatherIcon from '../components/WeatherIcon';
import { convertTemperature, getTemperatureSymbol } from '../utils/weatherUnits';
import { Ionicons } from '@expo/vector-icons';

const PERIOD_LABELS = {
  0:  'Полночь',
  3:  'Ночь',
  6:  'Утро',
  9:  'Утро',
  12: 'День',
  15: 'День',
  18: 'Вечер',
  21: 'Вечер',
};

export default function DailyDetailScreen() {
  const { isDark } = useThemeContext();
  const route = useRoute();
  const navigation = useNavigation();
  const { date, hourlyForecast, tempUnit, useStaticIcons } = route.params;

  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const btnBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
  const bgImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  const hours = (hourlyForecast || []).filter(item => item.dt_txt?.startsWith(date));

  const title = new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', weekday: 'long',
  });

  const handleShowInfo = () => Alert.alert(
    'О почасовом прогнозе',
    'Прогноз предоставляется на 5 дней с шагом 3 часа — до 8 временных точек в сутки.\n\n' +
    'Для ближайших дней доступны все точки. Для дальних дней (или текущего дня) некоторые временные отрезки могут отсутствовать в зависимости от доступности данных.',
    [{ text: 'Понятно' }]
  );

  return (
    <ImageBackground source={bgImage} resizeMode="cover" style={styles.bg} blurRadius={70}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blur}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { backgroundColor: btnBg }]}>
            <Ionicons name="chevron-back" size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={handleShowInfo} style={[styles.btn, { backgroundColor: btnBg }]}>
            <Ionicons name="information-circle-outline" size={22} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} bounces={false}>
          {hours.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: secondaryTextColor }]}>Нет данных для этого дня</Text>
            </View>
          ) : (
            hours.map((item, index) => {
              const hour = parseInt(item.dt_txt.split(' ')[1].split(':')[0]);
              const timeStr = item.dt_txt.split(' ')[1].slice(0, 5);
              const periodLabel = PERIOD_LABELS[hour] || '';

              return (
                <View key={index} style={[styles.card, { backgroundColor: cardBg }]}>
                  <View style={styles.timeBlock}>
                    <Text style={[styles.time, { color: textColor }]}>{timeStr}</Text>
                    <Text style={[styles.period, { color: secondaryTextColor }]}>{periodLabel}</Text>
                  </View>

                  <WeatherIcon
                    weatherMain={item.main}
                    weatherDescription={item.description}
                    width={48}
                    height={48}
                    useStaticIcons={useStaticIcons}
                  />

                  <View style={styles.infoBlock}>
                    <Text style={[styles.description, { color: secondaryTextColor }]}>
                      {item.description}
                    </Text>
                    {item.pop > 0 && (
                      <View style={styles.popRow}>
                        <Ionicons name="rainy-outline" size={13} color="#64B5F6" />
                        <Text style={[styles.pop, { color: '#64B5F6' }]}>
                          {Math.round(item.pop * 100)}%
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.temp, { color: textColor }]}>
                    {Math.round(convertTemperature(item.temp, tempUnit))}{getTemperatureSymbol(tempUnit)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  blur: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingTop: 40, paddingBottom: 20,
  },
  btn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center', textTransform: 'capitalize' },
  list: { paddingHorizontal: 15, paddingBottom: 120, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, gap: 12 },
  timeBlock: { width: 52, alignItems: 'center' },
  time: { fontSize: 16, fontWeight: '600' },
  period: { fontSize: 11, marginTop: 2 },
  infoBlock: { flex: 1, gap: 4 },
  description: { fontSize: 13, textTransform: 'capitalize' },
  popRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pop: { fontSize: 12 },
  temp: { fontSize: 22, fontWeight: 'bold', minWidth: 52, textAlign: 'right' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16 },
});
