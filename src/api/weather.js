/**
 * weather.js
 *
 * Работа с OpenWeatherMap API: текущая погода, почасовой и дневной прогноз, поиск городов.
 * UV-индекс для текущей погоды берётся из отдельного эндпоинта OpenWeatherMap.
 * Утилиты: расчёт точки росы, времени восхода/заката.
 */

import axios from 'axios';
import SunCalc from 'suncalc';

const API_KEY  = process.env.EXPO_PUBLIC_OWM_API_KEY;
const BASE_URL = process.env.EXPO_PUBLIC_OWM_BASE_URL;
const GEO_URL  = process.env.EXPO_PUBLIC_OWM_GEO_URL;
const TIMEOUT  = 10000;

// Приводим ответ API к единому формату
const normalizeWeather = (raw, uvIndex = 0, dewPoint = null) => ({
  name:        raw.name,
  country:     raw.sys.country,
  lat:         raw.coord?.lat,
  lon:         raw.coord?.lon,
  temp:        raw.main.temp,
  feelsLike:   raw.main.feels_like,
  tempMin:     raw.main.temp_min,
  tempMax:     raw.main.temp_max,
  humidity:    raw.main.humidity,
  pressure:    raw.main.pressure,
  windSpeed:   raw.wind.speed,
  windDeg:     raw.wind.deg,
  clouds:      raw.clouds.all,
  visibility:  raw.visibility,
  description: raw.weather[0].description,
  main:        raw.weather[0].main,
  weatherId:   raw.weather[0].id,
  sunrise:     raw.sys.sunrise,
  sunset:      raw.sys.sunset,
  dt:          raw.dt,
  uvIndex,
  dewPoint,
});

const normalizeHourly = (item) => ({
  dt_txt:      item.dt_txt,
  temp:        item.main.temp,
  description: item.weather[0].description,
  main:        item.weather[0].main,
  weatherId:   item.weather[0].id,
  clouds:      item.clouds.all,
  pop:         item.pop,
});

const normalizeDaily = (date, dayTemp, nightTemp, description, main) => ({
  date, temp: dayTemp, nightTemp, description, main,
});

// UV-индекс на сегодня
const getCurrentUV = async (lat, lon) => {
  try {
    const res = await axios.get(`${BASE_URL}/uvi`, {
      params: { lat, lon, appid: API_KEY },
      timeout: TIMEOUT,
    });
    return typeof res.data?.value === 'number' ? Math.round(res.data.value) : 0;
  } catch {
    return 0;
  }
};

export const getCurrentWeather = async (lat, lon, lang = 'ru', units = 'metric') => {
  const [res, uvIndex] = await Promise.all([
    axios.get(`${BASE_URL}/weather`, {
      params: { lat, lon, appid: API_KEY, lang, units },
      timeout: TIMEOUT,
    }),
    getCurrentUV(lat, lon),
  ]);
  const raw = res.data;
  const dewPoint = calculateDewPoint(raw.main.temp, raw.main.humidity);
  return normalizeWeather(raw, uvIndex, dewPoint);
};

export const getHourlyForecast = async (lat, lon, lang = 'ru', units = 'metric') => {
  const res = await axios.get(`${BASE_URL}/forecast`, {
    params: { lat, lon, appid: API_KEY, lang, units },
    timeout: TIMEOUT,
  });
  const list = res.data.list.map(normalizeHourly);
  return { list };
};

export const getDailyForecast = async (lat, lon, lang = 'ru', units = 'metric') => {
  const res = await axios.get(`${BASE_URL}/forecast`, {
    params: { lat, lon, appid: API_KEY, lang, units },
    timeout: TIMEOUT,
  });
  const list      = res.data.list;
  const dailyData = {};

  list.forEach(item => {
    const [date, time] = item.dt_txt.split(' ');
    const hour = parseInt(time.split(':')[0]);

    if (!dailyData[date]) {
      dailyData[date] = { date, dayTemp: null, nightTemp: null, description: null, main: null, dayData: null, nightTemps: [] };
    }

    if (hour >= 9 && hour <= 15) {
      if (!dailyData[date].dayData || Math.abs(hour - 12) < Math.abs(dailyData[date].dayData.hour - 12)) {
        dailyData[date].dayTemp     = item.main.temp;
        dailyData[date].description = item.weather[0].description;
        dailyData[date].main        = item.weather[0].main;
        dailyData[date].dayData     = { hour };
      }
    }

    if (hour === 21 || hour === 0 || hour === 3) {
      dailyData[date].nightTemps.push(item.main.temp);
    }
  });

  Object.keys(dailyData).forEach(date => {
    const next    = new Date(date);
    next.setDate(next.getDate() + 1);
    const nextStr = next.toISOString().split('T')[0];
    const temps   = [...dailyData[date].nightTemps];

    if (dailyData[nextStr]) {
      const nextNight = list.filter(i => i.dt_txt.startsWith(nextStr) && [0, 3].includes(parseInt(i.dt_txt.split(' ')[1].split(':')[0])));
      temps.push(...dailyData[nextStr].nightTemps.slice(0, nextNight.length));
    }

    if (temps.length > 0) dailyData[date].nightTemp = Math.min(...temps);
  });

  return Object.values(dailyData)
    .filter(d => d.dayTemp !== null)
    .slice(0, 5)
    .map(({ date, dayTemp, nightTemp, description, main }) =>
      normalizeDaily(date, dayTemp, nightTemp, description, main)
    );
};

export const searchCityByName = async (query, limit = 5) => {
  const res = await axios.get(GEO_URL, {
    params: { q: query, limit, lang: 'ru', appid: API_KEY },
    timeout: TIMEOUT,
  });
  return res.data;
};

export const getSunTimes = (lat, lon, date = new Date()) => {
  try {
    const t = SunCalc.getTimes(date, lat, lon);
    return { sunrise: t.sunrise, sunset: t.sunset, solarNoon: t.solarNoon, goldenHour: t.goldenHour, goldenHourEnd: t.goldenHourEnd };
  } catch {
    return null;
  }
};

// Формула Магнуса для вычисления точки росы
export const calculateDewPoint = (temperature, humidity) => {
  if (typeof temperature !== 'number' || typeof humidity !== 'number') return null;
  if (humidity < 0 || humidity > 100) return null;
  try {
    const a = 17.27, b = 237.7;
    const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
    const dew   = (b * alpha) / (a - alpha);
    return isNaN(dew) || !isFinite(dew) ? null : Math.round(dew * 10) / 10;
  } catch {
    return null;
  }
};
