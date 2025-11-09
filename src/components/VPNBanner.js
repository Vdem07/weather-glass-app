import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Вариант 1: Простой баннер (как в предыдущем примере)
const SimpleVpnBanner = ({ isDark }) => (
  <View style={[styles.vpnBanner, { 
    backgroundColor: isDark ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255, 193, 7, 0.1)',
    borderColor: isDark ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 193, 7, 0.25)'
  }]}>
    <View style={styles.vpnBannerContent}>
      <Ionicons 
        name="shield-outline" 
        size={16} 
        color={isDark ? '#FFD700' : '#FF8F00'} 
        style={styles.vpnIcon}
      />
      <Text style={[styles.vpnBannerText, { 
        color: isDark ? '#FFE082' : '#F57C00' 
      }]}>
        При долгой загрузке обновления погодных данных воспользуйтесь VPN
      </Text>
    </View>
  </View>
);

// Вариант 2: Баннер с возможностью закрытия
const DismissibleVpnBanner = ({ isDark }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  if (!isVisible) return null;
  
  return (
    <View style={[styles.vpnBannerDismissible, { 
      backgroundColor: isDark ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255, 193, 7, 0.1)',
      borderColor: isDark ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 193, 7, 0.25)'
    }]}>
      <View style={styles.vpnBannerContent}>
        <Ionicons 
          name="shield-outline" 
          size={16} 
          color={isDark ? '#FFD700' : '#FF8F00'} 
          style={styles.vpnIcon}
        />
        <Text style={[styles.vpnBannerTextDismissible, { 
          color: isDark ? '#FFE082' : '#F57C00' 
        }]}>
          При долгой загрузке воспользуйтесь VPN
        </Text>
        <TouchableOpacity 
          onPress={() => setIsVisible(false)}
          style={styles.closeButton}
        >
          <Ionicons 
            name="close" 
            size={14} 
            color={isDark ? '#FFE082' : '#F57C00'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Вариант 3: Компактный баннер
const CompactVpnBanner = ({ isDark }) => (
  <View style={[styles.vpnBannerCompact, { 
    backgroundColor: isDark ? 'rgba(255, 193, 7, 0.12)' : 'rgba(255, 193, 7, 0.08)',
  }]}>
    <Ionicons 
          name="shield-outline" 
          size={12} 
          color={isDark ? '#FFD700' : '#FF8F00'} 
          style={styles.vpnIcon}
        />
    <Text style={[styles.vpnBannerTextCompact, { 
      color: isDark ? '#FFE082' : '#F57C00' 
    }]}>
      При проблемах с загрузкой используйте VPN
    </Text>
  </View>
);

// Вариант 4: Баннер с анимацией появления
const AnimatedVpnBanner = ({ isDark, visible = true }) => {
  if (!visible) return null;
  
  return (
    <View style={[
      styles.vpnBannerAnimated, 
      { 
        backgroundColor: isDark ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255, 193, 7, 0.1)',
        borderColor: isDark ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 193, 7, 0.25)',
      }
    ]}>
      <View style={styles.vpnBannerContent}>
        <View style={styles.blinkingDot}>
          <View style={[styles.dot, { 
            backgroundColor: isDark ? '#FFD700' : '#FF8F00' 
          }]} />
        </View>
        <Text style={[styles.vpnBannerText, { 
          color: isDark ? '#FFE082' : '#F57C00' 
        }]}>
          При долгой загрузке воспользуйтесь VPN
        </Text>
      </View>
    </View>
  );
};

// Использование в основном компоненте:
const WeatherMainContentWithBanner = ({ 
  weather, 
  isDark, 
  textColor, 
  secondaryTextColor, 
  tempUnit,
  useStaticIcons,
  convertTemperature,
  getTemperatureSymbol,
  getLastUpdateTime 
}) => (
  <View style={styles.weatherMainContent}>
    <WeatherIcon
      weatherMain={weather.weather[0].main}
      weatherDescription={weather.weather[0].description}
      style={styles.weatherAnimation}
      width={160}
      height={160}
      useStaticIcons={useStaticIcons}
    />
    <Text style={[styles.temp, { color: textColor }]}>
      {Math.round(convertTemperature(weather.main.temp, tempUnit))}{getTemperatureSymbol(tempUnit)}
    </Text>
    <Text style={[styles.description, { color: secondaryTextColor }]}>
      {weather.weather[0].description}
    </Text>
    
    <View style={styles.timeInfoContainer}>
      <Text style={[styles.lastUpdateText, { color: secondaryTextColor }]}>
        Обновлено {getLastUpdateTime(weather)}
      </Text>
      
      {/* Выберите один из вариантов баннера: */}
      <SimpleVpnBanner isDark={isDark} />
      {/* <DismissibleVpnBanner isDark={isDark} /> */}
      {/* <CompactVpnBanner isDark={isDark} /> */}
      {/* <AnimatedVpnBanner isDark={isDark} /> */}
    </View>
  </View>
);

const styles = StyleSheet.create({
  // Основные стили
  weatherMainContent: {
    flex: 1,
    alignItems: 'center',
  },
  weatherAnimation: {
    width: 160,
    height: 160,
  },
  temp: {
    fontSize: 60,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: -10,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    textTransform: 'capitalize',
    marginTop: -10,
  },
  timeInfoContainer: {
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
    gap: 8,
  },
  lastUpdateText: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Стили для простого баннера
  vpnBanner: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
  },
  vpnBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vpnIcon: {
    marginRight: 6,
  },
  vpnBannerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    flex: 1,
    fontWeight: '500',
  },

  // Стили для баннера с закрытием
  vpnBannerDismissible: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
  },
  vpnBannerTextDismissible: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    flex: 1,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 8,
    padding: 2,
  },

  // Стили для компактного баннера
  vpnBannerCompact: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    maxWidth: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vpnBannerTextCompact: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
    fontWeight: '500',
    flexWrap: 'wrap',
    flexShrink: 1,
  },

  // Стили для анимированного баннера
  vpnBannerAnimated: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
  },
  blinkingDot: {
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export { 
  SimpleVpnBanner, 
  DismissibleVpnBanner, 
  CompactVpnBanner, 
  AnimatedVpnBanner,
  WeatherMainContentWithBanner 
};