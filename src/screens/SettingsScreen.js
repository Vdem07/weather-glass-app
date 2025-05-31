import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import {
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useThemeContext } from '../theme/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { isDark, toggleTheme } = useThemeContext();
  const [useGeo, setUseGeo] = useState(true);
  const [city, setCity] = useState('');
  const [unit, setUnit] = useState('metric');
  const [windUnit, setWindUnit] = useState('m/s');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showWindDropdown, setShowWindDropdown] = useState(false);

  useEffect(() => {
    (async () => {
      const geo = await AsyncStorage.getItem('useGeo');
      const citySaved = await AsyncStorage.getItem('city');
      const savedUnit = await AsyncStorage.getItem('unit');
      const savedWind = await AsyncStorage.getItem('windUnit');

      setUseGeo(geo !== 'false');
      if (citySaved) setCity(citySaved);
      if (savedUnit) setUnit(savedUnit);
      if (savedWind) setWindUnit(savedWind);
    })();
  }, []);

  const updateSetting = async (key, value) => {
    await AsyncStorage.setItem(key, value);
  };

  const getWindUnitLabel = (unit) => {
    switch (unit) {
      case 'm/s': return 'м/с (метры в секунду)';
      case 'km/h': return 'км/ч (километры в час)';
      case 'mph': return 'mph (мили в час)';
      default: return unit;
    }
  };

  const DropdownList = ({ items, onSelect, onClose }) => (
    <View style={[styles.suggestionList, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            onSelect(item.value);
            onClose();
          }}
          style={styles.suggestionItem}
        >
          <Text style={[styles.suggestionItemText, { color: isDark ? '#fff' : '#000' }]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const backgroundImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover" blurRadius={70}>
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blurOverlay}>
        <View style={styles.container}>

          {/* Назад */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.backButtonCircle,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>

          <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Темная тема</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
          />

          <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Использовать геолокацию</Text>
          <Switch
            value={useGeo}
            onValueChange={(value) => {
              setUseGeo(value);
              updateSetting('useGeo', value.toString());
            }}
            color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
          />

          {/* Температура */}
          <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Температура</Text>
          <TouchableOpacity
            style={[styles.grayButton, { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]}
            onPress={() => setShowUnitDropdown(!showUnitDropdown)}
          >
            <Text style={[styles.grayLabel, { color: isDark ? '#fff' : '#000' }]}>
              {unit === 'metric' ? '°C (Цельсий)' : '°F (Фаренгейт)'}
            </Text>
          </TouchableOpacity>
          {showUnitDropdown && (
            <DropdownList
              items={[
                { label: '°C (Цельсий)', value: 'metric' },
                { label: '°F (Фаренгейт)', value: 'imperial' },
              ]}
              onSelect={(value) => {
                setUnit(value);
                updateSetting('unit', value);
              }}
              onClose={() => setShowUnitDropdown(false)}
            />
          )}

          {/* Скорость ветра */}
          <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Скорость ветра</Text>
          <TouchableOpacity
            style={[styles.grayButton, { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]}
            onPress={() => setShowWindDropdown(!showWindDropdown)}
          >
            <Text style={[styles.grayLabel, { color: isDark ? '#fff' : '#000' }]}>
              {getWindUnitLabel(windUnit)}
            </Text>
          </TouchableOpacity>
          {showWindDropdown && (
            <DropdownList
              items={[
                { label: 'м/с', value: 'm/s' },
                { label: 'км/ч', value: 'km/h' },
                { label: 'mph', value: 'mph' },
              ]}
              onSelect={(value) => {
                setWindUnit(value);
                updateSetting('windUnit', value);
              }}
              onClose={() => setShowWindDropdown(false)}
            />
          )}
        </View>
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  blurOverlay: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
  },
  backButtonCircle: {
    width: 42,
    height: 42,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  label: {
    marginTop: 20,
    fontSize: 16,
  },
  input: {
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  grayButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 10,
    height: 50,
    justifyContent: 'center',
  },
  grayLabel: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  suggestionList: {
    position: 'relative',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 10,
    zIndex: 20,
    marginTop: 10,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomColor: '#444',
    borderBottomWidth: 1,
  },
  suggestionItemText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
