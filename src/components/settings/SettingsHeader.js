import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsHeader({ isDark, navigation }) {
  const textColor = isDark ? '#fff' : '#000';
  const btnBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

  const handleShowApiInfo = () => Alert.alert(
    'Источник данных',
    'Данные о погоде предоставляются бесплатным API OpenWeatherMap 2.5: https://openweathermap.org/\n\n' +
    'Пожалуйста, учитывайте, что данные могут быть неточными.',
    [{ text: 'OK' }]
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { backgroundColor: btnBg }]}>
        <Ionicons name="chevron-back" size={20} color={textColor} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: textColor }]}>Настройки</Text>
      <TouchableOpacity onPress={handleShowApiInfo} style={[styles.btn, { backgroundColor: btnBg }]}>
        <Ionicons name="information-circle-outline" size={22} color={textColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 20,
  },
  btn: {
    width: 44, height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 26, fontWeight: 'bold' },
});
