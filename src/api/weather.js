/**
 * weather.js
 *
 * Работа с OpenWeatherMap API: текущая погода, почасовой и дневной прогноз, поиск городов.
 * Утилиты: расчёт UV-индекса, точки росы, времени восхода/заката.
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

const normalizeHourly = (item, uvIndex = 0) => ({
  dt_txt:      item.dt_txt,
  temp:        item.main.temp,
  description: item.weather[0].description,
  main:        item.weather[0].main,
  weatherId:   item.weather[0].id,
  clouds:      item.clouds.all,
  pop:         item.pop,
  uvIndex,
});

const normalizeDaily = (date, dayTemp, nightTemp, description, main, uvIndex = 0) => ({
  date, temp: dayTemp, nightTemp, description, main, uvIndex,
});

const getUVIndex = (lat, lon, rawWeather = null, date = new Date()) => {
  if (rawWeather) return calculateUVIndex(lat, lon, rawWeather, date);
  return calculateSimpleUV(date);
};

export const getCurrentWeather = async (lat, lon, lang = 'ru', units = 'metric') => {
  const res = await axios.get(`${BASE_URL}/weather`, {
    params: { lat, lon, appid: API_KEY, lang, units },
    timeout: TIMEOUT,
  });
  const raw      = res.data;
  const uvIndex  = getUVIndex(lat, lon, raw);
  const dewPoint = calculateDewPoint(raw.main.temp, raw.main.humidity);
  return normalizeWeather(raw, uvIndex, dewPoint);
};

export const getCurrentWeatherWithDewPoint = getCurrentWeather;

export const getHourlyForecast = async (lat, lon, lang = 'ru', units = 'metric') => {
  const res = await axios.get(`${BASE_URL}/forecast`, {
    params: { lat, lon, appid: API_KEY, lang, units },
    timeout: TIMEOUT,
  });
  const list = res.data.list.map(item => {
    const date = new Date(item.dt * 1000);
    const uv   = calculateUVIndex(lat, lon, { clouds: { all: item.clouds.all }, weather: item.weather }, date);
    return normalizeHourly(item, uv);
  });
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
      dailyData[date] = { date, dayTemp: null, nightTemp: null, description: null, main: null, dayData: null, nightTemps: [], uvIndex: null };
    }

    if (hour >= 9 && hour <= 15) {
      if (!dailyData[date].dayData || Math.abs(hour - 12) < Math.abs(dailyData[date].dayData.hour - 12)) {
        dailyData[date].dayTemp     = item.main.temp;
        dailyData[date].description = item.weather[0].description;
        dailyData[date].main        = item.weather[0].main;
        dailyData[date].dayData     = { hour };
        dailyData[date].uvIndex     = calculateUVIndex(lat, lon, { clouds: { all: item.clouds.all }, weather: item.weather }, new Date(item.dt * 1000));
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
    .map(({ date, dayTemp, nightTemp, description, main, uvIndex }) =>
      normalizeDaily(date, dayTemp, nightTemp, description, main, uvIndex || 0)
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

// UV на основе положения солнца, облачности и погодных условий
export const calculateUVIndex = (lat, lon, weather, date = new Date()) => {
  try {
    const sunPos    = SunCalc.getPosition(date, lat, lon);
    const elevation = (sunPos.altitude * 180) / Math.PI;
    if (elevation <= 0) return 0;

    const maxUV = getMaxUVForLocation(lat, date);
    let base    = maxUV * Math.sin(sunPos.altitude) * Math.pow(0.7, getAirMass(elevation));

    if (elevation < 10)      base *= 0.1;
    else if (elevation < 20) base *= 0.4;
    else if (elevation < 30) base *= 0.7;

    const uv = base * getCloudFactor(weather.clouds?.all || 0) * getWeatherFactor(weather) * getOzoneFactor(lat, date);
    return Math.round(Math.max(0, Math.min(uv, 15)));
  } catch {
    return calculateSimpleUV(date);
  }
};

const getMaxUVForLocation = (lat, date) => {
  const absLat = Math.abs(lat);
  const month  = date.getMonth() + 1;
  const base   = absLat <= 10 ? 11 : absLat <= 23.5 ? 10 : absLat <= 30 ? 8 : absLat <= 40 ? 6 : absLat <= 50 ? 4 : absLat <= 60 ? 2 : 1;
  const isSummer     = lat >= 0 ? (month >= 5 && month <= 8)  : (month >= 11 || month <= 2);
  const isTransition = (month >= 3 && month <= 4) || (month >= 9 && month <= 10);
  return base * (isSummer ? 1.0 : isTransition ? 0.8 : 0.5);
};

const getAirMass = (elevation) => {
  if (elevation <= 0) return 40;
  const z   = (90 - elevation) * Math.PI / 180;
  const cos = Math.cos(z);
  return cos <= 0 ? 40 : Math.min(1 / (cos + 0.50572 * Math.pow(96.07995 - (90 - elevation), -1.6364)), 40);
};

const getCloudFactor = (c) =>
  c <= 5 ? 1.0 : c <= 15 ? 0.95 : c <= 25 ? 0.85 : c <= 40 ? 0.7 : c <= 55 ? 0.5 : c <= 70 ? 0.35 : c <= 85 ? 0.2 : c <= 95 ? 0.1 : 0.05;

const getWeatherFactor = (weather) => {
  const main = weather.weather[0].main.toLowerCase();
  const desc = weather.weather[0].description.toLowerCase();
  if (main.includes('thunderstorm')) return 0.05;
  if (main.includes('rain'))    return desc.includes('heavy') || desc.includes('сильный') ? 0.1 : desc.includes('moderate') || desc.includes('умеренный') ? 0.15 : 0.25;
  if (main.includes('drizzle')) return 0.3;
  if (main.includes('snow'))    return desc.includes('heavy') || desc.includes('сильный') ? 0.15 : 0.25;
  if (main.includes('mist') || main.includes('fog'))  return 0.2;
  if (main.includes('haze') || main.includes('dust')) return 0.6;
  if (main.includes('smoke')) return 0.4;
  return 1.0;
};

const getOzoneFactor = (lat, date) => {
  const month  = date.getMonth() + 1;
  const absLat = Math.abs(lat);
  if (absLat > 50) {
    if (lat > 0 && month >= 3  && month <= 5)  return 1.1;
    if (lat > 0 && month >= 10 && month <= 11) return 1.05;
    if (lat < 0 && month >= 9  && month <= 11) return 1.1;
    if (lat < 0 && month >= 4  && month <= 5)  return 1.05;
  }
  return 1.0;
};

// Грубый запасной расчёт UV по времени суток и сезону
const calculateSimpleUV = (date = new Date()) => {
  const hour     = date.getHours();
  const month    = date.getMonth() + 1;
  const base     = hour >= 11 && hour <= 13 ? 3 : hour >= 10 && hour <= 14 ? 2 : hour >= 9 && hour <= 15 ? 1 : 0;
  const seasonal = (month >= 11 || month <= 2) ? 0.3 : (month >= 3 && month <= 5) || (month >= 9 && month <= 10) ? 0.7 : 1.0;
  return Math.round(base * seasonal);
};
