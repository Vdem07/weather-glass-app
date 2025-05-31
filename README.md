# 🌤️ WeatherGlass

**WeatherGlass** — это современное мобильное приложение под **Android**, созданное на базе **React Native (Expo)**. Приложение отображает текущую погоду, почасовой прогноз, а также прогноз на неделю, используя анимированные иконки и поддержку тёмной темы.

---

## 🚀 Возможности

- 🔍 Поиск города по названию
- 📍 Определение местоположения и погоды с помощью геолокации
- 🕒 Почасовой прогноз и 🌤️ недельный обзор
- 🎞️ Анимированные погодные иконки (Lottie)
- 🌗 Поддержка светлой и тёмной темы
- 📦 Кэширование погоды — работает офлайн
- ⚙️ Настройки: единицы температуры, ветра и включение/отключение геолокации

---

## 🛠️ Технологии

- React Native (через Expo)
- Lottie-анимации
- AsyncStorage
- OpenWeatherMap API
- Expo Location

---

## ⚙️ Установка

```bash
git clone https://github.com/your-name/WeatherGlass.git
cd WeatherGlass
npm install
npm start
```

> Для запуска на устройстве используйте [Expo Go](https://expo.dev/client)

---

## 📱 Сборка APK

Убедитесь, что установлен EAS CLI:

```bash
npm install -g eas-cli
```

Сборка:

```bash
eas build -p android --profile preview
```

---

## 🔑 OpenWeather API

1. Получите API-ключ на [openweathermap.org](https://openweathermap.org/api)
2. Создайте файл `.env` и добавьте:

```
OPENWEATHER_API_KEY=ваш_ключ
```

---

## 📂 Структура проекта

```
WeatherGlass/
├── assets/
│   ├── lottie/
│   └── backgrounds/
├── screens/
├── utils/
├── api/
├── theme/
└── App.js
```

---

## 📄 Лицензия

MIT License

---

## 👤 Автор

[Vdem07](https://github.com/Vdem07)
