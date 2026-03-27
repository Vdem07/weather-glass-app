/**
 * weatherUnits
 *
 * Утилиты для конвертации и форматирования единиц измерения погодных данных.
 * Используется во всех экранах и компонентах приложения.
 */

// Температура
export const convertTemperature = (temp, unit) =>
  unit === 'imperial' ? (temp * 9 / 5) + 32 : temp;

export const getTemperatureSymbol = (unit) =>
  unit === 'imperial' ? '°F' : '°C';

// Ветер
export const convertWindSpeed = (speed, unit) => {
  switch (unit) {
    case 'km/h': return speed * 3.6;
    case 'mph':  return speed * 2.237;
    default:     return speed;
  }
};

export const getWindSpeedLabel = (unit) => {
  switch (unit) {
    case 'km/h': return 'км/ч';
    case 'mph':  return 'mph';
    default:     return 'м/с';
  }
};

export const getWindSpeedFullLabel = (unit) => {
  switch (unit) {
    case 'km/h': return 'км/ч (километры в час)';
    case 'mph':  return 'mph (мили в час)';
    default:     return 'м/с (метры в секунду)';
  }
};

// Давление
export const convertPressure = (pressure, unit) => {
  switch (unit) {
    case 'mmHg': return Math.round(pressure * 0.75);
    case 'hPa':  return Math.round(pressure);
    case 'bar':  return (pressure / 1000).toFixed(3);
    case 'psi':  return (pressure * 0.0145).toFixed(2);
    default:     return Math.round(pressure * 0.75);
  }
};

export const getPressureLabel = (unit) => {
  switch (unit) {
    case 'mmHg': return 'мм рт.ст';
    case 'hPa':  return 'гПа';
    case 'bar':  return 'бар';
    case 'psi':  return 'PSI';
    default:     return 'мм рт.ст';
  }
};

export const getPressureFullLabel = (unit) => {
  switch (unit) {
    case 'mmHg': return 'мм рт.ст. (миллиметры ртутного столба)';
    case 'hPa':  return 'гПа (гектопаскали)';
    case 'bar':  return 'бар';
    case 'psi':  return 'PSI (фунты на квадратный дюйм)';
    default:     return 'мм рт.ст. (миллиметры ртутного столба)';
  }
};

// Видимость
export const convertVisibility = (visibility, unit) => {
  if (!visibility) return 'Н/Д';
  switch (unit) {
    case 'm':  return `${visibility} м`;
    case 'mi': return `${(visibility / 1609.34).toFixed(1)} миль`;
    default:
      return visibility >= 1000
        ? `${(visibility / 1000).toFixed(1)} км`
        : `${(visibility / 1000).toFixed(2)} км`;
  }
};

export const getVisibilityLabel = (unit) => {
  switch (unit) {
    case 'm':  return 'м';
    case 'mi': return 'мили';
    default:   return 'км';
  }
};

export const getVisibilityFullLabel = (unit) => {
  switch (unit) {
    case 'm':  return 'м (метры)';
    case 'mi': return 'мили';
    default:   return 'км (километры)';
  }
};

// Направление ветра
export const getWindDirection = (degrees) => {
  if (degrees === undefined || degrees === null) return 'Не определено';
  const directions = [
    'Северный', 'Северо-северо-восточный', 'Северо-восточный', 'Востоко-северо-восточный',
    'Восточный', 'Востоко-юго-восточный', 'Юго-восточный', 'Юго-юго-восточный',
    'Южный', 'Юго-юго-западный', 'Юго-западный', 'Западо-юго-западный',
    'Западный', 'Западо-северо-западный', 'Северо-западный', 'Северо-северо-западный',
  ];
  return directions[Math.round(degrees / 22.5) % 16];
};
