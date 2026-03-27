/**
 * weatherInterpretation
 *
 * Утилиты для интерпретации погодных показателей:
 * текстовые описания и цвета индикаторов.
 * Работает с нормализованными данными (WeatherData).
 */

import {
  convertWindSpeed,
  convertPressure,
  convertTemperature,
  convertVisibility,
} from './weatherUnits';

export const getWeatherInterpretation = (type, value, weather, units = {}) => {
  const { tempUnit = 'metric', windUnit = 'm/s', pressureUnit = 'mmHg', visibilityUnit = 'km' } = units;

  switch (type) {
    case 'pressure': {
      const p = convertPressure(weather.pressure, pressureUnit);
      const thresholds = { mmHg: [740, 770], hPa: [987, 1027], bar: [0.987, 1.027], psi: [14.3, 14.9] };
      const [low, high] = thresholds[pressureUnit] || thresholds.mmHg;
      if (p < low) return 'Низкое давление';
      if (p > high) return 'Высокое давление';
      return 'Давление в норме';
    }
    case 'humidity':
      if (value < 30) return 'Воздух очень сухой';
      if (value < 40) return 'Воздух сухой';
      if (value > 80) return 'Влажность очень высокая';
      if (value > 70) return 'Влажность высокая';
      if (value > 60) return 'Влажность повышенная';
      return 'Влажность нормальная';
    case 'wind': {
      const w = convertWindSpeed(weather.windSpeed, windUnit);
      const thresholds = { 'm/s': [2, 5, 10, 15], 'km/h': [7.2, 18, 36, 54], 'mph': [4.5, 11.2, 22.4, 33.6] };
      const [l, m, f, s] = thresholds[windUnit] || thresholds['m/s'];
      if (w < l) return 'Штиль';
      if (w < m) return 'Легкий ветер';
      if (w < f) return 'Умеренный ветер';
      if (w < s) return 'Свежий ветер';
      if (w < s * 1.5) return 'Сильный ветер';
      return 'Очень сильный ветер';
    }
    case 'clouds':
      if (value < 10) return 'Ясно';
      if (value < 25) return 'Малооблачно';
      if (value < 50) return 'Переменная облачность';
      if (value < 75) return 'Облачно';
      return 'Пасмурно';
    case 'visibility': {
      if (!weather.visibility) return 'Видимость хорошая';
      const v = parseFloat(convertVisibility(weather.visibility, visibilityUnit));
      const thresholds = { km: [1, 5, 10], m: [1000, 5000, 10000], mi: [0.62, 3.11, 6.21] };
      const [poor, limited, good] = thresholds[visibilityUnit] || thresholds.km;
      if (v < poor) return 'Видимость очень плохая';
      if (v < limited) return 'Видимость ограничена';
      if (v < good) return 'Видимость хорошая';
      return 'Видимость отличная';
    }
    case 'precipitation': {
      const prob = parseInt(value);
      if (prob === 0) return 'Осадков не ожидается';
      if (prob < 20) return 'Осадки маловероятны';
      if (prob < 50) return 'Небольшая вероятность осадков';
      if (prob < 70) return 'Возможны осадки';
      if (prob < 90) return 'Осадки ожидаются';
      return 'Осадки неизбежны';
    }
    case 'temperature': {
      const temp = convertTemperature(value, tempUnit);
      const [fr, co, cl, wa, ho] = tempUnit === 'imperial' ? [32, 50, 68, 77, 86] : [0, 10, 20, 25, 30];
      if (temp < fr) return 'Заморозки';
      if (temp < co) return 'Холодно';
      if (temp < cl) return 'Прохладно';
      if (temp < wa) return 'Комфортно';
      if (temp < ho) return 'Тепло';
      return 'Жарко';
    }
    case 'uv': {
      const uv = parseInt(value);
      if (uv <= 2) return 'Низкий UV';
      if (uv <= 5) return 'Умеренный UV';
      if (uv <= 7) return 'Высокий UV';
      if (uv <= 10) return 'Очень высокий UV';
      return 'Экстремальный UV';
    }
    case 'dew_point': {
      if (!value) return 'Данные недоступны';
      const diff = weather.temp - value;
      if (diff < 2) return 'Очень высокая влажность - возможен туман';
      if (diff < 5) return 'Высокая влажность - дискомфорт';
      if (diff < 10) return 'Умеренная влажность';
      return 'Сухой воздух - комфортно';
    }
    default:
      return '';
  }
};

export const getIndicatorColor = (type, value, weather, units = {}) => {
  const { windUnit = 'm/s', pressureUnit = 'mmHg' } = units;

  switch (type) {
    case 'pressure': {
      const p = convertPressure(weather.pressure, pressureUnit);
      return pressureUnit === 'mmHg' && (p < 740 || p > 770) ? '#ff8800' : '#4CAF50';
    }
    case 'humidity':
      return value < 30 || value > 70 ? '#ff8800' : '#4CAF50';
    case 'wind': {
      const w = convertWindSpeed(weather.windSpeed, windUnit);
      if (w > 15) return '#ff4444';
      if (w > 10) return '#ff8800';
      return '#4CAF50';
    }
    case 'clouds':
      if (value > 70) return '#666';
      if (value > 30) return '#ff8800';
      return '#4CAF50';
    case 'precipitation': {
      const prob = parseInt(value);
      if (prob > 70) return '#2196F3';
      if (prob > 30) return '#ff8800';
      return '#4CAF50';
    }
    case 'uv': {
      const uv = parseInt(value) || 0;
      if (uv <= 2) return '#4CAF50';
      if (uv <= 5) return '#FFC107';
      if (uv <= 7) return '#FF9800';
      if (uv <= 10) return '#f44336';
      return '#9C27B0';
    }
    case 'dew_point': {
      if (!value || !weather?.temp) return '#999';
      const diff = weather.temp - value;
      if (diff < 2) return '#2196F3';
      if (diff < 5) return '#FF9800';
      if (diff < 10) return '#4CAF50';
      return '#FFC107';
    }
    default:
      return '#4CAF50';
  }
};

export const getPrecipitationProbability = (weather, hourlyForecast) => {
  if (weather.pop !== undefined && weather.pop !== null) return `${Math.round(weather.pop * 100)}%`;
  if (hourlyForecast?.length > 0 && hourlyForecast[0].pop !== undefined) return `${Math.round(hourlyForecast[0].pop * 100)}%`;

  const main = weather.main.toLowerCase();
  const desc = weather.description.toLowerCase();

  if (main.includes('thunderstorm') || desc.includes('гроза')) return '95%';
  if (main.includes('rain') || desc.includes('дождь')) return '90%';
  if (main.includes('snow') || desc.includes('снег')) return '85%';
  if (main.includes('drizzle') || desc.includes('морось')) return '70%';
  if (main.includes('clouds')) {
    const c = weather.clouds || 0;
    if (c > 80) return '30%';
    if (c > 50) return '15%';
    return '5%';
  }
  return '0%';
};
