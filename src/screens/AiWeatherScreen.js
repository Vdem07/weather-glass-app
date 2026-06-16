import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ImageBackground, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useThemeContext } from '../theme/ThemeContext';
import { convertTemperature, getTemperatureSymbol } from '../utils/weatherUnits';
import { askAI } from '../api/openrouter';

const TOPICS = [
  { id: 'general',   label: 'Обзор',       icon: require('../assets/icons/sun.png'),        prompt: 'Опиши текущую погоду в общих чертах и как она влияет на самочувствие людей. Коротко и по делу.' },
  { id: 'allergy',   label: 'Аллергия',    icon: require('../assets/icons/allergy.png'),    prompt: 'Как текущая погода влияет на аллергиков? Укажи риски и рекомендации.' },
  { id: 'driving',   label: 'На дорогах',  icon: require('../assets/icons/driving.png'),    prompt: 'Каковы условия на дорогах при такой погоде? Что важно учесть водителям?' },
  { id: 'fishing',   label: 'Рыбалка',     icon: require('../assets/icons/fishing.png'),    prompt: 'Подходит ли такая погода для рыбалки? Дай советы рыболовам.' },
  { id: 'swimming',  label: 'У воды',      icon: require('../assets/icons/swimming.png'),   prompt: 'Как погода подходит для отдыха у воды? Есть ли риски?' },
  { id: 'gardening', label: 'Сад/огород',  icon: require('../assets/icons/gardening.png'),  prompt: 'Как погода влияет на садовые и огородные работы сегодня?' },
  { id: 'running',   label: 'Бег',         icon: require('../assets/icons/running.png'),    prompt: 'Подходит ли погода для пробежки? Дай рекомендации бегунам.' },
];

const buildSystemPrompt = (weather, tempUnit) => {
  const temp = Math.round(convertTemperature(weather.temp, tempUnit));
  const feelsLike = Math.round(convertTemperature(weather.feelsLike, tempUnit));
  const symbol = getTemperatureSymbol(tempUnit);
  return `Ты метеоролог-консультант. Отвечай кратко (3-5 предложений), по делу, на русском языке. Не используй markdown разметку и заголовки.

Текущая погода в городе ${weather.name}:
- Температура: ${temp}${symbol}, ощущается как ${feelsLike}${symbol}
- Условия: ${weather.description}
- Влажность: ${weather.humidity}%
- Ветер: ${weather.windSpeed.toFixed(1)} м/с
- Облачность: ${weather.clouds}%
- УФ-индекс: ${weather.uvIndex}

Отвечай только на вопросы о погоде и её влиянии на активности людей.`;
};

export default function AiWeatherScreen() {
  const { isDark } = useThemeContext();
  const navigation = useNavigation();
  const route = useRoute();
  const { weather, tempUnit } = route.params;
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState('general');

  const textColor = isDark ? '#fff' : '#333';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const btnBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
  const bgImage = isDark
    ? require('../assets/backgrounds/bg-blobs.png')
    : require('../assets/backgrounds/bg-blobs-white.png');

  const systemPrompt = buildSystemPrompt(weather, tempUnit);

  const sendMessage = async (topic) => {
    if (loading) return;
    setActiveTopic(topic.id);

    const userMsg = { role: 'user', content: topic.prompt };
    const updatedMessages = [...messages, userMsg];

    setMessages(prev => [...prev, { role: 'user', label: topic.label }]);
    setLoading(true);

    try {
      const reply = await askAI(systemPrompt, updatedMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка соединения. Попробуйте ещё раз.' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sendMessage(TOPICS[0]);
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  return (
    <ImageBackground source={bgImage} resizeMode="cover" style={styles.bg} blurRadius={70}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blur}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { backgroundColor: btnBg }]}>
            <Ionicons name="chevron-back" size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Нейросеть о погоде</Text>
          <TouchableOpacity
            onPress={() => Alert.alert(
              'Об ИИ-консультанте',
              'Ответы генерируются бесплатной языковой моделью через сервис OpenRouter.\n\nИнформация носит ознакомительный характер и не является профессиональной консультацией.',
              [{ text: 'Понятно' }]
            )}
            style={[styles.btn, { backgroundColor: btnBg }]}
          >
            <Ionicons name="information-circle-outline" size={22} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, i) => (
            msg.role === 'user' ? (
              <View key={i} style={[styles.bubble, styles.userBubble]}>
                <Text style={styles.userText}>{msg.label}</Text>
              </View>
            ) : (
              <View key={i} style={styles.aiRow}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={16} color="#4CAF50" />
                </View>
                <View style={[styles.bubble, styles.aiBubble]}>
                  <Text style={[styles.aiText, { color: textColor }]}>{msg.content}</Text>
                </View>
              </View>
            )
          ))}
          {loading && (
            <View style={styles.aiRow}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={16} color="#4CAF50" />
              </View>
              <View style={[styles.bubble, styles.aiBubble]}>
                <ActivityIndicator size="small" color={secondaryTextColor} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.topicsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topics}>
            {TOPICS.map(topic => (
              <TouchableOpacity
                key={topic.id}
                onPress={() => sendMessage(topic)}
                disabled={loading}
                style={[
                  styles.topicBtn,
                  { backgroundColor: activeTopic === topic.id
                    ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)')
                    : 'transparent' },
                ]}
              >
                <Image
                  source={topic.icon}
                  style={[styles.topicIcon, { opacity: activeTopic === topic.id ? 1 : 0.5 }]}
                />
                <Text style={[styles.topicLabel, { color: textColor, opacity: activeTopic === topic.id ? 1 : 0.5 }]}>
                  {topic.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  blur: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingTop: 40, paddingBottom: 16,
  },
  btn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  messages: { flex: 1 },
  messagesContent: { paddingHorizontal: 15, paddingBottom: 20, gap: 10 },
  bubble: { borderRadius: 18, padding: 14 },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  aiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(76,175,80,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2, flexShrink: 0,
  },
  aiBubble: { flex: 1, minHeight: 42, justifyContent: 'center' },
  userText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  aiText: { fontSize: 15, lineHeight: 22, paddingHorizontal: 4, paddingVertical: 4 },
  topicsWrapper: { paddingBottom: 64 },
  topics: { paddingHorizontal: 15, paddingVertical: 14, gap: 8 },
  topicBtn: { width: 80, paddingVertical: 10, borderRadius: 16, alignItems: 'center', gap: 6 },
  topicIcon: { width: 24, height: 24, tintColor: '#fff' },
  topicLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
});
