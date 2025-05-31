import axios from 'axios';
import Constants from 'expo-constants';

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY; // вставь свой ключ от OpenWeather

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const getCurrentWeather = async (lat, lon, lang = 'ru', units = 'metric') => {
  const res = await axios.get(`${BASE_URL}/weather`, {
    params: {
      lat,
      lon,
      appid: API_KEY,
      lang,
      units,
    },
  });
  return res.data;
};

export const getHourlyForecast = async (lat, lon, lang = 'ru', units = 'metric') => {
  const res = await axios.get(`${BASE_URL}/forecast`, {
    params: {
      lat,
      lon,
      appid: API_KEY,
      lang,
      units,
    },
  });
  return res.data;
};

export const getDailyForecast = async (lat, lon, lang = 'ru', units = 'metric') => {
    const res = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        lang,
        units,
      },
    });
  
    const list = res.data.list;
  
    // Группируем по дате (без времени)
    const dailyMap = {};
  
    list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = [];
      }
      dailyMap[date].push(item);
    });
  
    // Берем среднее по температуре и первую погоду для описания
    const grouped = Object.keys(dailyMap).map(date => {
      const items = dailyMap[date];
      const temps = items.map(i => i.main.temp);
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  
      return {
        date,
        temp: avgTemp,
        description: items[0].weather[0].description,
        main: items[0].weather[0].main,
      };
    });
  
    return grouped;
  };

  export const searchCityByName = async (query, limit = 5) => {
    const res = await axios.get(`https://api.openweathermap.org/geo/1.0/direct`, {
      params: {
        q: query,
        limit,
        lang: 'ru', // <== добавляем параметр языка
        appid: API_KEY,
      },
    });
    return res.data; // массив городов [{name, lat, lon, country, local_names, ...}]
  };
  
  