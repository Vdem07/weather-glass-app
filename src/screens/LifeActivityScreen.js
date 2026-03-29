import React from 'react';
import { ImageBackground, ScrollView, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeContext } from '../theme/ThemeContext';
import { useWeatherSettings } from '../hooks/useWeatherSettings';
import { getActivityData, scoreDay, getConditionLabel } from '../utils/activityData';

import ActivityHeader          from '../components/life/ActivityHeader';
import ActivityConditions      from '../components/life/ActivityConditions';
import ActivityRecommendations from '../components/life/ActivityRecommendations';
import ActivityForecast        from '../components/life/ActivityForecast';
import ActivityHourly          from '../components/life/ActivityHourly';

export default function LifeActivityScreen({ navigation, route }) {
  const { activityType, title, color, weather, forecast, hourlyForecast } = route.params;
  const { isDark } = useThemeContext();
  const { settings, loadSettings } = useWeatherSettings();

  useFocusEffect(React.useCallback(() => { loadSettings(); }, [loadSettings]));

  const { tempUnit, windUnit, pressureUnit, visibilityUnit, useStaticIcons } = settings;
  const units = { tempUnit, windUnit, pressureUnit, visibilityUnit };

  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  const activityData = getActivityData(activityType, weather, units);

  const forecastData = forecast.slice(0, 5).map(day => {
    const score = scoreDay(activityType, day.temp, day.main);
    const { label, color: conditionColor } = getConditionLabel(score, [3, 2, 1]);
    return { ...day, condition: label, conditionColor };
  });

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.background} blurRadius={70}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
        <ActivityHeader
          activityType={activityType}
          title={title}
          color={color}
          isDark={isDark}
          navigation={navigation}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <ActivityConditions conditions={activityData.conditions} isDark={isDark} />
          <ActivityRecommendations recommendations={activityData.recommendations} color={color} isDark={isDark} />
          <ActivityForecast forecast={forecastData} isDark={isDark} tempUnit={tempUnit} useStaticIcons={useStaticIcons} />
          <ActivityHourly hourlyForecast={hourlyForecast} activityType={activityType} isDark={isDark} tempUnit={tempUnit} useStaticIcons={useStaticIcons} />
        </ScrollView>
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  blurOverlay: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 15, paddingBottom: 90, gap: 20 },
});
