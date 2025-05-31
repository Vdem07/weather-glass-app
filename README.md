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
  ![photo_2025-05-31_11-45-01](https://github.com/user-attachments/assets/93acec1c-e321-4776-9e35-135632df610e)
  ![photo_2025-05-31_11-45-01 (2)](https://github.com/user-attachments/assets/cadc2243-d43c-4567-8484-d7bd5d91735f)
  ![photo_2025-05-31_11-45-02](https://github.com/user-attachments/assets/67f94b31-6d1c-4ce6-b5c1-1afbd8fb7dc7)
  ![photo_2025-05-31_11-45-02 (2)](https://github.com/user-attachments/assets/2018df3f-8731-462b-be23-58dc30ba2ec8)
</p>
---
## 📄 Лицензия

MIT License

---

## 👤 Автор

[Vdem07](https://github.com/Vdem07)
