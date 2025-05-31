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
## 📷 Скриншоты

<p align="center">
![photo_2025-05-31_11-45-01](https://github.com/user-attachments/assets/d5a75819-d7f7-4277-987c-4d2d4adfa2e0)
![photo_2025-05-31_11-45-01 (2)](https://github.com/user-attachments/assets/452bcf75-49da-4e97-b802-3256f4222863)
![photo_2025-05-31_11-45-02](https://github.com/user-attachments/assets/19dc96e2-ad60-46a1-ac98-d1af5b921215)
![photo_2025-05-31_11-45-02 (2)](https://github.com/user-attachments/assets/872ba964-c1d9-46f4-8e4c-9c856c46f17b)

</p>
---
## 📄 Лицензия

MIT License

---

## 👤 Автор

[Vdem07](https://github.com/Vdem07)
