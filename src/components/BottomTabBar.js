import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../theme/ThemeContext';

const TABS = [
  { name: 'Home',      label: 'Главная',   icon: 'home-outline',  iconActive: 'home'  },
  { name: 'Favorites', label: 'Избранное', icon: 'heart-outline', iconActive: 'heart' },
];

export default function BottomTabBar({ state, navigation }) {
  const { isDark } = useThemeContext();
  const slideAnim = useRef(new Animated.Value(state.index)).current;
  const [innerWidth, setInnerWidth] = useState(0);
  const tabW = innerWidth > 0 ? (innerWidth - 12) / 2 : 0;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index,
      useNativeDriver: true,
      tension: 120,
      friction: 14,
    }).start();
  }, [state.index]);

  const bgImage     = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');
  const activeColor   = isDark ? '#fff' : '#333';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
  const tintColor     = isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
  const pillBg        = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const borderColor   = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)';

  return (
    <View style={styles.wrapper}>
      <View style={styles.clipper}>
        <ImageBackground source={bgImage} resizeMode="cover" blurRadius={150} style={styles.imageBg}>
          <View style={[styles.tint, { backgroundColor: tintColor }]}>
            <View style={styles.inner} onLayout={e => setInnerWidth(e.nativeEvent.layout.width)}>
              {tabW > 0 && (
                <Animated.View
                  style={[
                    styles.pill,
                    { width: tabW, backgroundColor: pillBg },
                    { transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, tabW] }) }] },
                  ]}
                />
              )}
              {TABS.map((tab, i) => {
                const active = state.index === i;
                return (
                  <TouchableOpacity
                    key={tab.name}
                    onPress={() => navigation.navigate(tab.name)}
                    style={styles.tab}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={active ? tab.iconActive : tab.icon} size={22} color={active ? activeColor : inactiveColor} />
                    <Text style={[styles.label, { color: active ? activeColor : inactiveColor }]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: 50, left: 60, right: 60, zIndex: 100 },
  clipper: { borderRadius: 20, overflow: 'hidden' },
  imageBg: { width: '100%' },
  tint: {},
  inner: { flexDirection: 'row', position: 'relative', padding: 6 },
  pill: { position: 'absolute', top: 6, bottom: 6, left: 6, borderRadius: 16 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 2 },
  label: { fontSize: 10, fontWeight: '500' },
});
