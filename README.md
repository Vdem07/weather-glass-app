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

## 📷 Скриншоты
<p align="center">
![image](https://github.com/user-attachments/assets/4e60646d-0b1a-475d-b327-a560fe471365)
![image](https://github.com/user-attachments/assets/c5fe1042-bd43-477b-903e-661d0bac03b2)
![image](https://github.com/user-attachments/assets/f62fa3b2-d310-4c2a-9269-fb321ad86ac5)
![image](https://github.com/user-attachments/assets/b0220496-1c0c-497b-80cb-2d324d323298)
</p>

## 📄 Лицензия

MIT License

## 👤 Автор

[Vdem07](https://github.com/Vdem07)
