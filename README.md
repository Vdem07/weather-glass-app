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
  <img src="https://github.com/user-attachments/assets/4e60646d-0b1a-475d-b327-a560fe471365" width="300" />
  <img src="https://github.com/user-attachments/assets/c5fe1042-bd43-477b-903e-661d0bac03b2" width="300" />
  <img src="https://github.com/user-attachments/assets/f62fa3b2-d310-4c2a-9269-fb321ad86ac5" width="300" />
  <img src="https://github.com/user-attachments/assets/b0220496-1c0c-497b-80cb-2d324d323298" width="300" />
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
