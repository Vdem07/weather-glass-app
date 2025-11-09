import axios from 'axios';
import SunCalc from 'suncalc';

const API_KEY = 'f24d4864f20da298fdd9ec2436343f99';
const WEATHER_API_KEY = 'ba3cbfe7a32246f1aa0201941252905'; // Добавьте ваш ключ WeatherAPI
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const WEATHER_API_URL = 'https://api.weatherapi.com/v1';

// Функция получения UV индекса из WeatherAPI
export const getUVFromWeatherAPI = async (lat, lon) => {
  try {
    const location = `${lat},${lon}`;
    const response = await axios.get(`${WEATHER_API_URL}/current.json`, {
      params: {
        key: WEATHER_API_KEY,
        q: location,
        aqi: 'no'
      }
    });
    
    return {
      uv: response.data.current.uv,
      location: response.data.location,
      timestamp: response.data.current.last_updated,
      localTime: response.data.location.localtime
    };
  } catch (error) {
    console.error('Ошибка получения UV из WeatherAPI:', error);
    return null;
  }
};

// Функция получения прогноза UV из WeatherAPI
export const getUVForecastFromWeatherAPI = async (lat, lon, days = 3) => {
  try {
    const location = `${lat},${lon}`;
    const response = await axios.get(`${WEATHER_API_URL}/forecast.json`, {
      params: {
        key: WEATHER_API_KEY,
        q: location,
        days: Math.min(days, 10), // WeatherAPI поддерживает до 10 дней
        aqi: 'no',
        alerts: 'no'
      }
    });
    
    return {
      location: response.data.location,
      current: {
        uv: response.data.current.uv,
        timestamp: response.data.current.last_updated
      },
      forecast: response.data.forecast.forecastday.map(day => ({
        date: day.date,
        maxUV: day.day.maxuv || day.day.uv,
        hourly: day.hour.map(hour => ({
          time: hour.time,
          uv: hour.uv,
          temperature: hour.temp_c,
          condition: hour.condition.text
        }))
      }))
    };
  } catch (error) {
    console.error('Ошибка получения прогноза UV из WeatherAPI:', error);
    return null;
  }
};

// Гибридная функция получения UV (WeatherAPI + fallback на расчет)
export const getUVIndex = async (lat, lon, weather = null, date = new Date()) => {
  try {
    // Сначала пытаемся получить из WeatherAPI
    const weatherAPIData = await getUVFromWeatherAPI(lat, lon);
    
    if (weatherAPIData && weatherAPIData.uv !== undefined) {
      return {
        value: Math.round(weatherAPIData.uv),
        source: 'WeatherAPI',
        timestamp: weatherAPIData.timestamp,
        location: weatherAPIData.location,
        lat,
        lon
      };
    }
  } catch (error) {
    console.warn('WeatherAPI недоступен, используем fallback:', error.message);
  }
  
  // Fallback 1: Пытаемся получить из OpenWeather UV API
  try {
    const response = await axios.get(`${BASE_URL}/uvi`, {
      params: {
        lat,
        lon,
        appid: API_KEY
      }
    });
    
    if (response.data.value !== undefined) {
      return {
        value: Math.round(response.data.value),
        source: 'OpenWeather UV API',
        timestamp: new Date(response.data.date * 1000).toISOString(),
        lat,
        lon
      };
    }
  } catch (error) {
    console.warn('OpenWeather UV API недоступен:', error.message);
  }
  
  // Fallback 2: Используем расчетный метод
  if (weather) {
    const calculatedUV = calculateUVIndex(lat, lon, weather, date);
    return {
      value: calculatedUV,
      source: 'Calculated',
      timestamp: date.toISOString(),
      lat,
      lon
    };
  }
  
  // Fallback 3: Простой расчет без данных о погоде
  const simpleUV = calculateSimpleUV(date);
  return {
    value: simpleUV,
    source: 'Simple calculation',
    timestamp: date.toISOString(),
    lat,
    lon
  };
};

// Обновленная функция getCurrentWeather с UV из WeatherAPI
export const getCurrentWeatherWithUV = async (lat, lon, lang = 'ru', units = 'metric') => {
  try {
    // Получаем основные данные о погоде из OpenWeather
    const weatherResponse = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        lang,
        units,
      },
    });
    
    const weatherData = weatherResponse.data;
    
    // Получаем UV индекс из WeatherAPI
    const uvData = await getUVIndex(lat, lon, weatherData);
    weatherData.uv_index = uvData.value;
    weatherData.uv_source = uvData.source;
    weatherData.uv_timestamp = uvData.timestamp;
    
    // Если UV получен из WeatherAPI, добавляем дополнительную информацию
    if (uvData.source === 'WeatherAPI' && uvData.location) {
      weatherData.weather_api_location = uvData.location;
    }
    
    // Добавляем точку росы
    try {
      const oneCallResponse = await axios.get(`${BASE_URL}/onecall`, {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units
        }
      });
      
      if (oneCallResponse.data.current?.dew_point) {
        weatherData.dew_point = oneCallResponse.data.current.dew_point;
      }
    } catch (oneCallError) {
      // Рассчитываем точку росы
      if (weatherData.main?.temp && weatherData.main?.humidity) {
        weatherData.dew_point = calculateDewPoint(weatherData.main.temp, weatherData.main.humidity);
      }
    }
    
    // Добавляем времена восхода/заката
    const sunTimes = getSunTimes(lat, lon);
    if (sunTimes) {
      weatherData.sun_times = sunTimes;
    }
    
    return weatherData;
    
  } catch (error) {
    console.error('Ошибка получения данных о погоде:', error);
    throw error;
  }
};

// Обновленная функция getHourlyForecast с UV из WeatherAPI
export const getHourlyForecastWithUV = async (lat, lon, lang = 'ru', units = 'metric') => {
  try {
    // Получаем основной прогноз из OpenWeather
    const forecastResponse = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        lang,
        units,
      },
    });
    
    const forecastData = forecastResponse.data;
    
    // Пытаемся получить UV прогноз из WeatherAPI
    let uvForecastData = null;
    try {
      uvForecastData = await getUVForecastFromWeatherAPI(lat, lon, 5);
    } catch (error) {
      console.warn('Не удалось получить UV прогноз из WeatherAPI:', error.message);
    }
    
    // Добавляем UV индекс для каждого часового прогноза
    forecastData.list = forecastData.list.map(item => {
      const forecastDate = new Date(item.dt * 1000);
      let uvValue = 0;
      let uvSource = 'Calculated';
      
      // Пытаемся найти соответствующий UV из WeatherAPI
      if (uvForecastData) {
        const itemDateStr = forecastDate.toISOString().split('T')[0];
        const itemHour = forecastDate.getHours();
        
        const dayForecast = uvForecastData.forecast.find(day => day.date === itemDateStr);
        if (dayForecast) {
          const hourForecast = dayForecast.hourly.find(hour => {
            const hourTime = new Date(hour.time);
            return hourTime.getHours() === itemHour;
          });
          
          if (hourForecast && hourForecast.uv !== undefined) {
            uvValue = Math.round(hourForecast.uv);
            uvSource = 'WeatherAPI';
          }
        }
      }
      
      // Fallback на расчетный метод
      if (uvValue === 0) {
        const mockWeather = {
          clouds: { all: item.clouds.all },
          weather: item.weather
        };
        uvValue = calculateUVIndex(lat, lon, mockWeather, forecastDate);
      }
      
      item.uv_index = uvValue;
      item.uv_source = uvSource;
      
      return item;
    });
    
    // Добавляем информацию об источнике UV данных
    forecastData.uv_forecast_source = uvForecastData ? 'WeatherAPI' : 'Calculated';
    
    return forecastData;
    
  } catch (error) {
    console.error('Ошибка получения почасового прогноза:', error);
    throw error;
  }
};

// Обновленная функция getDailyForecast с UV из WeatherAPI
export const getDailyForecastWithUV = async (lat, lon, lang = 'ru', units = 'metric') => {
  try {
    // Получаем основной прогноз
    const forecastResponse = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        lang,
        units,
      },
    });
    
    const list = forecastResponse.data.list;
    
    // Получаем UV прогноз из WeatherAPI
    let uvForecastData = null;
    try {
      uvForecastData = await getUVForecastFromWeatherAPI(lat, lon, 5);
    } catch (error) {
      console.warn('UV прогноз из WeatherAPI недоступен:', error.message);
    }
    
    const dailyData = {};
    
    list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      const time = item.dt_txt.split(' ')[1];
      const hour = parseInt(time.split(':')[0]);
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          dayTemp: null,
          nightTemp: null,
          description: null,
          main: null,
          dayData: null,
          nightTemps: [],
          uvIndex: null,
          uvSource: 'Calculated'
        };
      }
      
      // Дневная температура - берем показания в 12:00 или ближайшие к полудню
      if (hour >= 9 && hour <= 15) {
        if (!dailyData[date].dayData || Math.abs(hour - 12) < Math.abs(dailyData[date].dayData.hour - 12)) {
          dailyData[date].dayTemp = item.main.temp;
          dailyData[date].description = item.weather[0].description;
          dailyData[date].main = item.weather[0].main;
          dailyData[date].dayData = { hour, temp: item.main.temp };
          
          // Получаем UV для этого дня
          if (uvForecastData) {
            const dayForecast = uvForecastData.forecast.find(day => day.date === date);
            if (dayForecast && dayForecast.maxUV !== undefined) {
              dailyData[date].uvIndex = Math.round(dayForecast.maxUV);
              dailyData[date].uvSource = 'WeatherAPI';
            }
          }
          
          // Fallback на расчетный метод
          if (dailyData[date].uvIndex === null) {
            const forecastDate = new Date(item.dt * 1000);
            const mockWeather = {
              clouds: { all: item.clouds.all },
              weather: item.weather
            };
            dailyData[date].uvIndex = calculateUVIndex(lat, lon, mockWeather, forecastDate);
          }
        }
      }
      
      // Ночная температура
      if (hour === 21 || hour === 0 || hour === 3) {
        dailyData[date].nightTemps.push(item.main.temp);
      }
    });
    
    // Обрабатываем ночные температуры
    Object.keys(dailyData).forEach(date => {
      const currentDate = new Date(date);
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      
      let nightTemps = [...dailyData[date].nightTemps];
      
      if (dailyData[nextDateStr]) {
        nightTemps = nightTemps.concat(
          dailyData[nextDateStr].nightTemps.filter((_, index) => {
            const nextDayList = list.filter(item => item.dt_txt.startsWith(nextDateStr));
            const nightHours = nextDayList.filter(item => {
              const hour = parseInt(item.dt_txt.split(' ')[1].split(':')[0]);
              return hour === 0 || hour === 3;
            });
            return index < nightHours.length;
          })
        );
      }
      
      if (nightTemps.length > 0) {
        dailyData[date].nightTemp = Math.min(...nightTemps);
      }
    });
    
    // Преобразуем в массив
    const result = Object.values(dailyData)
      .filter(day => day.dayTemp !== null)
      .slice(0, 5)
      .map(day => ({
        date: day.date,
        temp: day.dayTemp,
        nightTemp: day.nightTemp,
        description: day.description,
        main: day.main,
        uvIndex: day.uvIndex || 0,
        uvSource: day.uvSource
      }));
    
    return result;
    
  } catch (error) {
    console.error('Ошибка получения ежедневного прогноза:', error);
    throw error;
  }
};

// Функция для получения детальной UV информации из WeatherAPI
export const getDetailedUVInfo = async (lat, lon) => {
  try {
    const uvData = await getUVFromWeatherAPI(lat, lon);
    
    if (!uvData) {
      throw new Error('Не удалось получить UV данные');
    }
    
    const uvLevel = getUVLevel(uvData.uv);
    
    return {
      current: {
        uv: uvData.uv,
        level: uvLevel.level,
        risk: uvLevel.risk,
        recommendation: uvLevel.recommendation,
        color: uvLevel.color
      },
      location: uvData.location,
      timestamp: uvData.timestamp,
      localTime: uvData.localTime
    };
    
  } catch (error) {
    console.error('Ошибка получения детальной UV информации:', error);
    throw error;
  }
};

// Функция интерпретации UV индекса
export const getUVLevel = (uvIndex) => {
  const info = {
    level: '',
    risk: '',
    recommendation: '',
    color: ''
  };

  if (uvIndex <= 2) {
    info.level = 'Низкий';
    info.risk = 'Минимальный риск';
    info.recommendation = 'Можно находиться на солнце без защиты';
    info.color = '#289500';
  } else if (uvIndex <= 5) {
    info.level = 'Умеренный';
    info.risk = 'Низкий риск';
    info.recommendation = 'Рекомендуется солнцезащитный крем';
    info.color = '#F7E400';
  } else if (uvIndex <= 7) {
    info.level = 'Высокий';
    info.risk = 'Умеренный риск';
    info.recommendation = 'Обязательна защита от солнца';
    info.color = '#F85900';
  } else if (uvIndex <= 10) {
    info.level = 'Очень высокий';
    info.risk = 'Высокий риск';
    info.recommendation = 'Избегайте солнца в полуденные часы';
    info.color = '#D8001D';
  } else {
    info.level = 'Экстремальный';
    info.risk = 'Крайне высокий риск';
    info.recommendation = 'Избегайте пребывания на солнце';
    info.color = '#6B49C8';
  }

  return info;
};

// Обратная совместимость - оставляем старые функции
export const getCurrentWeather = getCurrentWeatherWithUV;
export const getHourlyForecast = getHourlyForecastWithUV;
export const getDailyForecast = getDailyForecastWithUV;

// Остальные функции остаются без изменений
export const getCurrentWeatherWithDewPoint = async (lat, lon) => {
  try {
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`
    );
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json();
    
    try {
      const oneCallResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      
      if (oneCallResponse.ok) {
        const oneCallData = await oneCallResponse.json();
        weatherData.dew_point = oneCallData.current?.dew_point || null;
      }
    } catch (oneCallError) {
      console.log('One Call API недоступен, используем расчет точки росы');
    }
    
    if (!weatherData.dew_point && weatherData.main?.temp && weatherData.main?.humidity) {
      weatherData.dew_point = calculateDewPoint(weatherData.main.temp, weatherData.main.humidity);
    }
    
    // Получаем UV из WeatherAPI
    const uvData = await getUVIndex(lat, lon, weatherData);
    weatherData.uv_index = uvData.value;
    weatherData.uv_source = uvData.source;
    
    const sunTimes = getSunTimes(lat, lon);
    if (sunTimes) {
      weatherData.sun_times = sunTimes;
    }
    
    return weatherData;
    
  } catch (error) {
    console.error('Ошибка получения данных о погоде:', error);
    throw error;
  }
};

// Все остальные функции остаются без изменений
export const calculateUVIndex = (lat, lon, weather, date = new Date()) => {
  try {
    const sunPos = SunCalc.getPosition(date, lat, lon);
    const sunElevation = (sunPos.altitude * 180) / Math.PI;
    
    if (sunElevation <= 0) {
      return 0;
    }
    
    const maxUV = getMaxUVForLocation(lat, date);
    const elevationRadians = sunPos.altitude;
    let solarFactor = Math.sin(elevationRadians);
    
    const airMass = getAirMass(sunElevation);
    const atmosphericTransmission = Math.pow(0.7, airMass);
    
    let baseUV = maxUV * solarFactor * atmosphericTransmission;
    
    if (sunElevation < 10) {
      baseUV *= 0.1;
    } else if (sunElevation < 20) {
      baseUV *= 0.4;
    } else if (sunElevation < 30) {
      baseUV *= 0.7;
    }
    
    const cloudFactor = getCloudFactor(weather.clouds?.all || 0);
    const weatherFactor = getWeatherFactor(weather);
    const ozoneFactor = getOzoneFactor(lat, date);
    const altitudeFactor = 1.0;
    
    let finalUV = baseUV * cloudFactor * weatherFactor * ozoneFactor * altitudeFactor;
    finalUV = Math.max(0, Math.min(finalUV, 15));
    
    return Math.round(finalUV);
    
  } catch (error) {
    console.error('Ошибка расчета UV индекса:', error);
    return calculateSimpleUV(date);
  }
};

const getMaxUVForLocation = (lat, date) => {
  const absLat = Math.abs(lat);
  const month = date.getMonth() + 1;
  
  let baseMax;
  if (absLat <= 10) baseMax = 11;
  else if (absLat <= 23.5) baseMax = 10;
  else if (absLat <= 30) baseMax = 8;
  else if (absLat <= 40) baseMax = 6;
  else if (absLat <= 50) baseMax = 4;
  else if (absLat <= 60) baseMax = 2;
  else baseMax = 1;
  
  let seasonalMultiplier = 1.0;
  
  if (lat >= 0) {
    if (month >= 5 && month <= 8) {
      seasonalMultiplier = 1.0;
    } else if (month >= 3 && month <= 4 || month >= 9 && month <= 10) {
      seasonalMultiplier = 0.8;
    } else {
      seasonalMultiplier = 0.5;
    }
  } else {
    if (month >= 11 || month <= 2) {
      seasonalMultiplier = 1.0;
    } else if (month >= 3 && month <= 4 || month >= 9 && month <= 10) {
      seasonalMultiplier = 0.8;
    } else {
      seasonalMultiplier = 0.5;
    }
  }
  
  return baseMax * seasonalMultiplier;
};

const getAirMass = (elevation) => {
  if (elevation <= 0) return 40;
  
  const zenithAngle = 90 - elevation;
  const zenithRadians = zenithAngle * Math.PI / 180;
  
  const cosZenith = Math.cos(zenithRadians);
  if (cosZenith <= 0) return 40;
  
  const airMass = 1 / (cosZenith + 0.50572 * Math.pow(96.07995 - zenithAngle, -1.6364));
  
  return Math.min(airMass, 40);
};

const getCloudFactor = (cloudiness) => {
  if (cloudiness <= 5) return 1.0;
  else if (cloudiness <= 15) return 0.95;
  else if (cloudiness <= 25) return 0.85;
  else if (cloudiness <= 40) return 0.7;
  else if (cloudiness <= 55) return 0.5;
  else if (cloudiness <= 70) return 0.35;
  else if (cloudiness <= 85) return 0.2;
  else if (cloudiness <= 95) return 0.1;
  else return 0.05;
};

const getWeatherFactor = (weather) => {
  const main = weather.weather[0].main.toLowerCase();
  const description = weather.weather[0].description.toLowerCase();
  
  if (main.includes('thunderstorm')) return 0.05;
  else if (main.includes('rain')) {
    if (description.includes('heavy') || description.includes('сильный')) return 0.1;
    else if (description.includes('moderate') || description.includes('умеренный')) return 0.15;
    else return 0.25;
  }
  else if (main.includes('drizzle')) return 0.3;
  else if (main.includes('snow')) {
    if (description.includes('heavy') || description.includes('сильный')) return 0.15;
    else return 0.25;
  }
  else if (main.includes('mist') || main.includes('fog')) return 0.2;
  else if (main.includes('haze') || main.includes('dust')) return 0.6;
  else if (main.includes('smoke')) return 0.4;
  
  return 1.0;
};

const getOzoneFactor = (lat, date) => {
  const month = date.getMonth() + 1;
  const absLat = Math.abs(lat);
  
  if (absLat > 50) {
    if (lat > 0) {
      if (month >= 3 && month <= 5) return 1.1;
      else if (month >= 10 && month <= 11) return 1.05;
    } else {
      if (month >= 9 && month <= 11) return 1.1;
      else if (month >= 4 && month <= 5) return 1.05;
    }
  }
  
  return 1.0;
};

const calculateSimpleUV = (date = new Date()) => {
  const hour = date.getHours();
  const month = date.getMonth() + 1;
  
  let baseUV = 0;
  
  if (hour >= 11 && hour <= 13) baseUV = 3;
  else if (hour >= 10 && hour <= 14) baseUV = 2;
  else if (hour >= 9 && hour <= 15) baseUV = 1;
  else baseUV = 0;
  
  if (month >= 11 || month <= 2) baseUV *= 0.3;
  else if (month >= 3 && month <= 5) baseUV *= 0.7;
  else if (month >= 9 && month <= 10) baseUV *= 0.7;
  
  return Math.round(baseUV);
};

export const getSunTimes = (lat, lon, date = new Date()) => {
  try {
    const times = SunCalc.getTimes(date, lat, lon);
    return {
      sunrise: times.sunrise,
      sunset: times.sunset,
      solarNoon: times.solarNoon,
      goldenHour: times.goldenHour,
      goldenHourEnd: times.goldenHourEnd
    };
  } catch (error) {
    console.error('Ошибка получения времени солнца:', error);
    return null;
  }
};

export const calculateDewPoint = (temperature, humidity) => {
  if (typeof temperature !== 'number' || typeof humidity !== 'number') {
    console.warn('Некорректные данные для расчета точки росы:', { temperature, humidity });
    return null;
  }
  
  if (humidity < 0 || humidity > 100) {
    console.warn('Некорректная влажность для расчета точки росы:', humidity);
    return null;
  }
  
  try {
    const a = 17.27;
    const b = 237.7;
    
    const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
    const dewPoint = (b * alpha) / (a - alpha);
    
    if (isNaN(dewPoint) || !isFinite(dewPoint)) {
      console.warn('Некорректный результат расчета точки росы:', dewPoint);
      return null;
    }
    
    return Math.round(dewPoint * 10) / 10;
  } catch (error) {
    console.error('Ошибка расчета точки росы:', error);
    return null;
  }
};

export const searchCityByName = async (query, limit = 5) => {
  const res = await axios.get(`https://api.openweathermap.org/geo/1.0/direct`, {
    params: {
      q: query,
      limit,
      lang: 'ru',
      appid: API_KEY,
    },
  });
  return res.data;
};