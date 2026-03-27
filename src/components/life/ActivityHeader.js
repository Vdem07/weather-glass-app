/**
 * ActivityHeader
 *
 * Шапка экрана активности: кнопка назад, иконка с названием, кнопка настроек.
 *
 * Props:
 * - activityType: string
 * - title: string
 * - color: string
 * - isDark: boolean
 * - navigation: object
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ACTIVITY_ICONS } from '../../utils/activityData';

export default function ActivityHeader({ activityType, title, color, isDark, navigation }) {
  const textColor = isDark ? '#fff' : '#333';
  const btnBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { backgroundColor: btnBg }]}>
        <Ionicons name="chevron-back" size={20} color={textColor} />
      </TouchableOpacity>

      <View style={styles.center}>
        <View style={[styles.iconWrapper, { backgroundColor: color }]}>
          <Image
            source={ACTIVITY_ICONS[activityType] || ACTIVITY_ICONS.allergy}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.btn, { backgroundColor: btnBg }]}>
        <Ionicons name="settings" size={20} color={textColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 20,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 15,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
