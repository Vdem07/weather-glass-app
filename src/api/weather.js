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

  // Фильтруем прогнозы, выбирая только записи на 12:00 каждого дня
  const dailyForecast = list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);

  // Преобразуем данные в нужный формат
  const formatted = dailyForecast.map(item => ({
    date: item.dt_txt.split(' ')[0],
    temp: item.main.temp,
    description: item.weather[0].description,
    main: item.weather[0].main,
  }));

  return formatted;
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
  
  
