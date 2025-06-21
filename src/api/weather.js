import axios from 'axios';

const API_KEY = 'f24d4864f20da298fdd9ec2436343f99'; // вставь свой ключ от OpenWeather

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

// export const getDailyForecast = async (lat, lon, lang = 'ru', units = 'metric') => {
//   const res = await axios.get(`${BASE_URL}/forecast`, {
//     params: {
//       lat,
//       lon,
//       appid: API_KEY,
//       lang,
//       units,
//     },
//   });

//   const list = res.data.list;

//   // Фильтруем прогнозы, выбирая только записи на 12:00 каждого дня
//   const dailyForecast = list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);

//   // Преобразуем данные в нужный формат
//   const formatted = dailyForecast.map(item => ({
//     date: item.dt_txt.split(' ')[0],
//     temp: item.main.temp,
//     description: item.weather[0].description,
//     main: item.weather[0].main,
//   }));

//   return formatted;
// };

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
  
  // Группируем данные по дням
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
        nightTemps: []
      };
    }
    
    // Дневная температура - берем показания в 12:00 или ближайшие к полудню
    if (hour >= 9 && hour <= 15) {
      if (!dailyData[date].dayData || Math.abs(hour - 12) < Math.abs(dailyData[date].dayData.hour - 12)) {
        dailyData[date].dayTemp = item.main.temp;
        dailyData[date].description = item.weather[0].description;
        dailyData[date].main = item.weather[0].main;
        dailyData[date].dayData = { hour, temp: item.main.temp };
      }
    }
    
    // Ночная температура - собираем все ночные показания (21:00, 00:00, 03:00)
    if (hour === 21 || hour === 0 || hour === 3) {
      dailyData[date].nightTemps.push(item.main.temp);
    }
  });
  
  // Обрабатываем ночные температуры для каждого дня
  Object.keys(dailyData).forEach(date => {
    const currentDate = new Date(date);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    const nextDateStr = nextDate.toISOString().split('T')[0];
    
    // Собираем ночные температуры: 21:00 текущего дня + 00:00 и 03:00 следующего дня
    let nightTemps = [...dailyData[date].nightTemps];
    
    if (dailyData[nextDateStr]) {
      nightTemps = nightTemps.concat(
        dailyData[nextDateStr].nightTemps.filter((_, index) => {
          // Берем только 00:00 и 03:00 из следующего дня
          const nextDayList = list.filter(item => item.dt_txt.startsWith(nextDateStr));
          const nightHours = nextDayList.filter(item => {
            const hour = parseInt(item.dt_txt.split(' ')[1].split(':')[0]);
            return hour === 0 || hour === 3;
          });
          return index < nightHours.length;
        })
      );
    }
    
    // Находим минимальную ночную температуру
    if (nightTemps.length > 0) {
      dailyData[date].nightTemp = Math.min(...nightTemps);
    }
  });
  
  // Преобразуем в массив и берем первые 5 дней
  const result = Object.values(dailyData)
    .filter(day => day.dayTemp !== null) // Берем только дни с дневной температурой
    .slice(0, 5)
    .map(day => ({
      date: day.date,
      temp: day.dayTemp,
      nightTemp: day.nightTemp,
      description: day.description,
      main: day.main,
    }));
  
  return result;
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
  
  
