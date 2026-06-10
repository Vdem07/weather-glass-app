import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AiSection({ weather, isDark, navigation, tempUnit }) {
  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>ИИ</Text>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cardBg }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('AiWeather', { weather, tempUnit })}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="sparkles" size={28} color="#fff" />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.label, { color: textColor }]}>Нейросеть о погоде</Text>
          <Text style={[styles.hint, { color: secondaryTextColor }]}>
            Советы по активностям на основе текущей погоды
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 15 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 15, borderRadius: 20,
    padding: 16, gap: 14,
  },
  iconWrapper: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
  },
  textBlock: { flex: 1, gap: 4 },
  label: { fontSize: 17, fontWeight: '600' },
  hint: { fontSize: 13, lineHeight: 18 },
});
