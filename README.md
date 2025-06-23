# 🌤️ WeatherGlassApp

**WeatherGlassApp** — это современное мобильное приложение под **Android**, созданное на базе **React Native (Expo)**. Приложение отображает текущую погоду, почасовой прогноз, а также прогноз на неделю, используя анимированные иконки и поддержку тёмной темы.

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
git clone https://github.com/Vdem07/weather-glass-app.git
cd weather-glass-app
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
EXPO_PUBLIC_OPENWEATHER_API_KEY=ваш_ключ
```
---
## 📥 Установка APK

Скачать последнюю версию приложения в виде `.apk` можно прямо из [раздела релизов](https://github.com/Vdem07/weather-glass-app/releases) репозитория.

1. Перейти по ссылке: [Releases](https://github.com/Vdem07/weather-glass-app/releases)
2. Выбрать последний релиз
3. Скачать файл с расширением `.apk`
4. Установить его на Android-устройство (может потребоваться включить установку из неизвестных источников)
---

## 📷 Скриншоты
<p align="center">
  <img src="https://github.com/user-attachments/assets/f1a2acd6-ef38-42be-bf12-771e446b987c" width="300" />
  <img src="https://github.com/user-attachments/assets/0b49417c-b331-4233-bddf-070c1d8846d9" width="300" />
  <img src="https://github.com/user-attachments/assets/74a8b3bd-c9f2-4036-965f-9e4423f9644c" width="300" />
  <img src="https://github.com/user-attachments/assets/76f7297e-7f62-4743-b54f-689624ba586f" width="300" />
  <img src="https://github.com/user-attachments/assets/37ae7019-7c2a-4fe2-a3ef-9b5498463eee" width="300" />
  <img src="https://github.com/user-attachments/assets/3e96dbd4-b2b6-4a36-aa87-75b331895262" width="300" />
  <img src="https://github.com/user-attachments/assets/2d0542ff-18ab-4a30-8bcb-cd494df4e652" width="300" />
  <img src="https://github.com/user-attachments/assets/ced8992d-01c2-4d1d-a211-00092dbefee7" width="300" />
  <img src="https://github.com/user-attachments/assets/b909048f-0b38-4131-aff9-b561441d2760" width="300" />
</p>

---
## 🙌 Благодарности

- [Lottie](https://lottiefiles.com/) от Airbnb за потрясающие анимации
- [OpenWeatherMap](https://openweathermap.org/) за доступ к погодным данным
- [React Native](https://reactnative.dev/) Team за платформу для разработки
- [Code With Nomi](https://www.youtube.com/watch?v=953vyZMO4cM) за обучающее видео и идею дизайна приложения
---
## 📄 Лицензия

MIT License

---
## 👤 Автор

[Vdem07](https://github.com/Vdem07)

---
