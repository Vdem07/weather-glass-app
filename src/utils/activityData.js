/**
 * activityData
 *
 * Логика расчёта условий и рекомендаций для каждого типа активности.
 * Используется в LifeActivityScreen и компонентах life/.
 */

import {
  convertTemperature, getTemperatureSymbol,
  convertWindSpeed, getWindSpeedLabel,
  convertPressure, getPressureLabel,
  convertVisibility,
} from './weatherUnits';

// Пороговые значения по единицам измерения
export const WIND_THRESHOLDS = {
  'm/s':  { low: 3,    mid: 5,    high: 6,    danger: 10,   caution: 15   },
  'km/h': { low: 10.8, mid: 18,   high: 21.6, danger: 36,   caution: 54   },
  'mph':  { low: 6.7,  mid: 11.2, high: 13.4, danger: 22.4, caution: 33.6 },
};

export const PRESSURE_THRESHOLDS = {
  mmHg: { optMin: 750,   optMax: 770,   goodMin: 740,   goodMax: 780   },
  hPa:  { optMin: 1000,  optMax: 1027,  goodMin: 987,   goodMax: 1040  },
  bar:  { optMin: 1.000, optMax: 1.027, goodMin: 0.987, goodMax: 1.040 },
  psi:  { optMin: 14.5,  optMax: 14.9,  goodMin: 14.3,  goodMax: 15.1  },
};

export const VISIBILITY_THRESHOLDS = {
  km: { poor: 1,    moderate: 5    },
  m:  { poor: 1000, moderate: 5000 },
  mi: { poor: 0.62, moderate: 3.11 },
};

// Маппинг иконок активностей
export const ACTIVITY_ICONS = {
  allergy:          require('../assets/icons/allergy.png'),
  driving:          require('../assets/icons/driving.png'),
  fishing:          require('../assets/icons/fishing.png'),
  water_recreation: require('../assets/icons/swimming.png'),
  gardening:        require('../assets/icons/gardening.png'),
  running:          require('../assets/icons/running.png'),
};

// Единая функция определения уровня условий по score
export const getConditionLabel = (score, thresholds) => {
  const levels = [
    { min: thresholds[0], label: 'Отличные',          color: '#4CAF50' },
    { min: thresholds[1], label: 'Хорошие',            color: '#8BC34A' },
    { min: thresholds[2], label: 'Удовлетворительные', color: '#FFC107' },
  ];
  for (const level of levels) {
    if (score >= level.min) return { label: level.label, color: level.color };
  }
  return { label: 'Неподходящие', color: '#f44336' };
};

// Приблизительный расчёт UV если данные недоступны
export const approximateUV = (weather) => {
  const hour = new Date().getHours();
  const cloudiness = weather.clouds?.all || 0;
  const base = hour >= 10 && hour <= 16 ? 7 : hour >= 8 && hour <= 18 ? 4 : 1;
  return Math.max(0, Math.min(11, Math.round(base * (100 - cloudiness) / 100)));
};

export const getUVIndex = (weather) =>
  weather?.uv_index ?? approximateUV(weather);

// Оценка условий для дневного прогноза
export const scoreDay = (activityType, dayTemp, main) => {
  switch (activityType) {
    case 'allergy':          return (dayTemp > 15 ? 1 : 0) + (main !== 'Rain' ? 1 : 0);
    case 'driving':          return main !== 'Rain' && main !== 'Snow' ? 2 : 0;
    case 'fishing':          return (dayTemp >= 15 && dayTemp <= 25 ? 1 : 0) + (main === 'Clouds' ? 1 : 0);
    case 'water_recreation': return (dayTemp >= 25 ? 2 : dayTemp >= 20 ? 1 : 0) + (main === 'Clear' ? 1 : 0);
    case 'gardening':        return (dayTemp >= 15 && dayTemp <= 28 ? 1 : 0) + (main !== 'Rain' ? 1 : 0);
    case 'running':          return (dayTemp >= 10 && dayTemp <= 20 ? 2 : dayTemp >= 5 && dayTemp <= 25 ? 1 : 0) + (main !== 'Rain' ? 1 : 0);
    default:                 return 0;
  }
};

// Оценка условий для почасового прогноза
export const scoreHour = (activityType, hourTemp, main) => {
  switch (activityType) {
    case 'allergy':          return (hourTemp > 15 ? 1 : 0) + (!main.includes('Rain') ? 1 : 0);
    case 'driving':          return !main.includes('Rain') && !main.includes('Snow') ? 2 : 0;
    case 'fishing':          return hourTemp >= 15 && hourTemp <= 25 ? 2 : 0;
    case 'water_recreation': return hourTemp >= 25 ? 2 : hourTemp >= 20 ? 1 : 0;
    case 'gardening':        return (hourTemp >= 15 && hourTemp <= 28 ? 1 : 0) + (!main.includes('Rain') ? 1 : 0);
    case 'running':          return (hourTemp >= 10 && hourTemp <= 20 ? 2 : 0) + (!main.includes('Rain') ? 1 : 0);
    default:                 return 0;
  }
};

// Данные условий и рекомендаций для каждой активности
export const getActivityData = (activityType, weather, units) => {
  const { tempUnit, windUnit, pressureUnit, visibilityUnit } = units;
  const windSpeed = convertWindSpeed(weather.wind.speed, windUnit);
  const wt = WIND_THRESHOLDS[windUnit] || WIND_THRESHOLDS['m/s'];
  const tempC = weather.main.temp;
  const humidity = weather.main.humidity;

  switch (activityType) {
    case 'allergy': {
      let score = 0;
      if (weather.wind.speed > 3) score += 2;
      if (humidity < 50) score += 1;
      if (weather.weather[0].main === 'Clear') score += 2;
      if (tempC > 15) score += 1;
      const pollenLabel = score >= 5 ? 'Очень высокий' : score >= 4 ? 'Высокий' : score >= 2 ? 'Средний' : 'Низкий';
      const pollenColor = score >= 5 ? '#f44336' : score >= 4 ? '#FF9800' : score >= 2 ? '#FFC107' : '#4CAF50';
      const vt = VISIBILITY_THRESHOLDS[visibilityUnit] || VISIBILITY_THRESHOLDS.km;
      const visVal = parseFloat(convertVisibility(weather.visibility || 10000, visibilityUnit));
      return {
        conditions: [
          { title: 'Индекс\nпыльцы', value: pollenLabel, color: pollenColor, icon: 'flower-outline' },
          { title: 'Ветер',          value: `${windSpeed.toFixed(1)} ${getWindSpeedLabel(windUnit)}`, color: windSpeed > wt.mid ? '#FF9800' : '#4CAF50', icon: 'flag-outline' },
          { title: 'Влажность',      value: `${humidity}%`, color: humidity < 40 ? '#FF9800' : humidity > 80 ? '#FFC107' : '#4CAF50', icon: 'water-outline' },
          { title: 'Видимость',      value: convertVisibility(weather.visibility, visibilityUnit), color: visVal < vt.poor ? '#FF9800' : '#4CAF50', icon: 'eye-outline' },
        ],
        recommendations: [
          score >= 5 ? 'Крайне высокий риск - оставайтесь дома' : score >= 4 ? 'Избегайте длительного пребывания на улице' : score >= 2 ? 'Можно гулять, но будьте осторожны' : 'Можно гулять без опасений',
          windSpeed > wt.mid ? 'Сильный ветер усиливает распространение аллергенов' : windSpeed > wt.low ? 'Умеренный ветер может разносить пыльцу' : 'Слабый ветер благоприятен для аллергиков',
          humidity < 40 ? 'Низкая влажность повышает концентрацию пыльцы' : humidity > 80 ? 'Высокая влажность может способствовать росту плесени' : 'Влажность в норме для аллергиков',
          'Принимайте антигистаминные препараты при необходимости',
        ],
      };
    }

    case 'driving': {
      const visibility = weather.visibility || 10000;
      const isRain = weather.weather[0].main.includes('Rain');
      const isSnow = weather.weather[0].main.includes('Snow');
      const isFog  = weather.weather[0].main.includes('Mist') || weather.weather[0].main.includes('Fog');
      let dScore = 5;
      if (visibility < 1000) dScore -= 3; else if (visibility < 5000) dScore -= 2; else if (visibility < 10000) dScore -= 1;
      if (windSpeed > wt.caution) dScore -= 2; else if (windSpeed > wt.danger) dScore -= 1;
      if (isSnow) dScore -= 3; else if (isRain || isFog) dScore -= 2;
      const dLabel = dScore <= 1 ? 'Опасные' : dScore <= 2 ? 'Сложные' : dScore <= 3 ? 'Удовлетворительные' : dScore <= 4 ? 'Хорошие' : 'Отличные';
      const dColor = dScore <= 1 ? '#f44336' : dScore <= 2 ? '#FF9800' : dScore <= 3 ? '#FFC107' : dScore <= 4 ? '#8BC34A' : '#4CAF50';
      const vt = VISIBILITY_THRESHOLDS[visibilityUnit] || VISIBILITY_THRESHOLDS.km;
      const visVal = parseFloat(convertVisibility(visibility, visibilityUnit));
      return {
        conditions: [
          { title: 'Условия\nвождения', value: dLabel, color: dColor, icon: 'car-outline' },
          { title: 'Видимость',         value: convertVisibility(visibility, visibilityUnit), color: visVal < vt.poor ? '#f44336' : visVal < vt.moderate ? '#FF9800' : '#4CAF50', icon: 'eye-outline' },
          { title: 'Ветер',             value: `${windSpeed.toFixed(1)} ${getWindSpeedLabel(windUnit)}`, color: windSpeed > wt.caution ? '#f44336' : windSpeed > wt.danger ? '#FF9800' : '#4CAF50', icon: 'flag-outline' },
          { title: 'Осадки',            value: isRain ? 'Дождь' : isSnow ? 'Снег' : 'Нет', color: isSnow ? '#f44336' : isRain ? '#FF9800' : '#4CAF50', icon: 'umbrella-outline' },
        ],
        recommendations: [
          dScore <= 1 ? 'Крайне опасные условия - избегайте поездок' : dScore <= 2 ? 'Рекомендуется избегать поездок' : dScore <= 3 ? 'Соблюдайте повышенную осторожность' : 'Соблюдайте обычную осторожность',
          visibility < 1000 ? 'Очень плохая видимость - включите противотуманные фары' : visibility < 5000 ? 'Ограниченная видимость - снизьте скорость' : 'Видимость в норме',
          windSpeed > wt.caution ? 'Сильный ветер - держите руль крепче' : windSpeed > wt.danger ? 'Умеренный ветер - будьте осторожны' : 'Ветровые условия нормальные',
          isSnow ? 'Используйте зимнюю резину и цепи' : isRain ? 'Снизьте скорость на мокрой дороге' : isFog ? 'Туман - включите противотуманные фары' : 'Дорожные условия благоприятные',
        ],
      };
    }

    case 'fishing': {
      const pressure = convertPressure(weather.main.pressure, pressureUnit);
      const pt = PRESSURE_THRESHOLDS[pressureUnit] || PRESSURE_THRESHOLDS.mmHg;
      const cloudiness = weather.clouds?.all || 0;
      const waterTempC = tempC - 2;
      let fScore = 0;
      if (pressure >= pt.optMin && pressure <= pt.optMax) fScore += 2; else if (pressure >= pt.goodMin && pressure <= pt.goodMax) fScore += 1;
      if (windSpeed >= wt.low && windSpeed <= wt.mid) fScore += 2; else if (windSpeed <= wt.high) fScore += 1;
      if (cloudiness >= 20 && cloudiness <= 70) fScore += 2; else if (cloudiness <= 80) fScore += 1;
      if (waterTempC >= 15 && waterTempC <= 25) fScore += 1;
      const { label: fLabel, color: fColor } = getConditionLabel(fScore, [6, 4, 2]);
      return {
        conditions: [
          { title: 'Условия для\nрыбалки',  value: fLabel, color: fColor, icon: 'fish-outline' },
          { title: 'Давление',               value: `${pressure} ${getPressureLabel(pressureUnit)}`, color: pressure >= pt.optMin && pressure <= pt.optMax ? '#4CAF50' : '#FFC107', icon: 'speedometer-outline' },
          { title: 'Ветер',                  value: `${windSpeed.toFixed(1)} ${getWindSpeedLabel(windUnit)}`, color: windSpeed >= wt.low && windSpeed <= wt.mid ? '#4CAF50' : windSpeed <= wt.high ? '#FFC107' : '#FF9800', icon: 'flag-outline' },
          { title: 'Температура\nводы',      value: `~${Math.round(convertTemperature(waterTempC, tempUnit))}${getTemperatureSymbol(tempUnit)}`, color: waterTempC >= 15 && waterTempC <= 25 ? '#4CAF50' : '#FFC107', icon: 'thermometer-outline' },
        ],
        recommendations: [
          fScore >= 4 ? 'Отличное время для рыбалки!' : 'Клев может быть слабым',
          pressure >= pt.optMin && pressure <= pt.optMax ? 'Стабильное давление благоприятно для клева' : 'Перепады давления могут влиять на активность рыбы',
          windSpeed >= wt.low && windSpeed <= wt.mid ? 'Легкий ветер создает рябь - хорошо для рыбалки' : windSpeed > wt.high ? 'Сильный ветер затруднит рыбалку' : windSpeed > wt.mid ? 'Умеренный ветер - приемлемо для рыбалки' : 'Штиль - рыба может быть менее активна',
          'Лучшее время клева: рассвет и закат',
        ],
      };
    }

    case 'water_recreation': {
      const uv = getUVIndex(weather);
      const waterTempC = tempC - 2;
      let rScore = 0;
      if (tempC >= 25) rScore += 2; else if (tempC >= 20) rScore += 1;
      if (windSpeed <= wt.low) rScore += 2; else if (windSpeed <= wt.high) rScore += 1;
      if (weather.weather[0].main === 'Clear') rScore += 2;
      else if (weather.weather[0].main === 'Clouds' && weather.clouds?.all < 50) rScore += 1;
      const { label: rLabel, color: rColor } = getConditionLabel(rScore, [5, 3, 1]);
      return {
        conditions: [
          { title: 'Условия\nдля отдыха',   value: rLabel, color: rColor, icon: 'water-outline' },
          { title: 'Температура\nвоздуха',   value: `${Math.round(convertTemperature(tempC, tempUnit))}${getTemperatureSymbol(tempUnit)}`, color: tempC >= 25 ? '#4CAF50' : tempC >= 20 ? '#FFC107' : '#FF9800', icon: 'thermometer-outline' },
          { title: 'Температура\nводы',      value: `~${Math.round(convertTemperature(waterTempC, tempUnit))}${getTemperatureSymbol(tempUnit)}`, color: waterTempC >= 22 ? '#4CAF50' : waterTempC >= 18 ? '#FFC107' : '#FF9800', icon: 'water-outline' },
          { title: 'UV индекс',              value: `${uv}/11`, color: uv <= 2 ? '#4CAF50' : uv <= 5 ? '#FFC107' : uv <= 7 ? '#FF9800' : '#f44336', icon: 'sunny-outline' },
        ],
        recommendations: [
          tempC >= 25 ? 'Отличная погода для купания и загара' : tempC >= 20 ? 'Прохладно, но можно загорать' : tempC >= 15 ? 'Прохладно - лучше активный отдых без купания' : 'Слишком прохладно для водных процедур',
          windSpeed <= wt.low ? 'Спокойные условия на воде' : windSpeed <= wt.high ? 'Легкий ветерок - комфортно' : 'Ветрено - возможны волны и прохлада',
          uv > 7 ? 'Очень высокий UV - обязательно используйте солнцезащитный крем SPF 30+' : uv > 5 ? 'Высокий UV - используйте крем и избегайте солнца в полдень' : uv > 3 ? 'Умеренный UV - защита от солнца рекомендуется' : 'Низкий UV - безопасно загорать',
          tempC > 30 && uv > 5 ? 'Жарко и высокий UV - пейте больше воды и прячьтесь в тени' : windSpeed > wt.high && tempC < 20 ? 'Ветрено и прохладно - возьмите теплую одежду' : tempC > 30 ? 'Жарко - не забывайте пить достаточно воды' : 'Приятного отдыха у воды!',
        ],
      };
    }

    case 'gardening': {
      const isRain = weather.weather[0].main.includes('Rain');
      let gScore = 0;
      if (tempC >= 15 && tempC <= 28) gScore += 2; else if (tempC >= 10 && tempC <= 32) gScore += 1;
      if (humidity >= 40 && humidity <= 70) gScore += 2; else if (humidity >= 30 && humidity <= 80) gScore += 1;
      if (windSpeed <= wt.mid) gScore += 1;
      if (!isRain) gScore += 1;
      const { label: gLabel, color: gColor } = getConditionLabel(gScore, [5, 3, 1]);
      return {
        conditions: [
          { title: 'Условия для\nсадоводства', value: gLabel, color: gColor, icon: 'leaf-outline' },
          { title: 'Температура',               value: `${Math.round(convertTemperature(tempC, tempUnit))}${getTemperatureSymbol(tempUnit)}`, color: tempC >= 15 && tempC <= 28 ? '#4CAF50' : tempC >= 10 && tempC <= 32 ? '#FFC107' : '#FF9800', icon: 'thermometer-outline' },
          { title: 'Влажность',                 value: `${humidity}%`, color: humidity >= 40 && humidity <= 70 ? '#4CAF50' : humidity >= 30 && humidity <= 80 ? '#FFC107' : '#FF9800', icon: 'water-outline' },
          { title: 'Полив',                     value: isRain ? 'Не требуется' : 'Рекомендуется', color: isRain ? '#4CAF50' : '#2196F3', icon: 'umbrella-outline' },
        ],
        recommendations: [
          tempC >= 15 && tempC <= 28 ? 'Идеальная температура для работы в саду' : tempC < 5 ? 'Очень холодно - защитите растения от заморозков' : tempC < 15 ? 'Прохладно - защитите теплолюбивые растения' : tempC > 35 ? 'Очень жарко - поливайте растения утром и вечером' : 'Жарко - поливайте растения чаще',
          humidity >= 40 && humidity <= 70 ? 'Оптимальная влажность для растений' : humidity < 30 ? 'Очень сухой воздух - значительно увеличьте полив' : humidity < 40 ? 'Сухой воздух - увеличьте полив' : humidity > 80 ? 'Очень высокая влажность - усильте контроль за грибковыми заболеваниями' : 'Высокая влажность - следите за грибковыми заболеваниями',
          windSpeed <= wt.mid ? 'Спокойные условия - отличное время для работы в саду' : windSpeed <= wt.mid * 1.5 ? 'Умеренный ветер - отложите опрыскивание растений' : 'Сильный ветер - отложите работы с химикатами',
          isRain ? tempC < 10 ? 'Дождь и холодно - лучшее время для планирования работ в помещении' : 'Дождь обеспечит естественный полив' : tempC > 28 && humidity < 40 ? 'Жарко и сухо - полив утром и вечером обязателен' : tempC > 28 ? 'Жаркая погода - работайте в утренние или вечерние часы' : 'Хорошее время для полива и прополки',
        ],
      };
    }

    case 'running': {
      const uv = getUVIndex(weather);
      const isRain = weather.weather[0].main.includes('Rain');
      const isSnow = weather.weather[0].main.includes('Snow');
      let rnScore = 0;
      if (tempC >= 10 && tempC <= 20) rnScore += 2; else if (tempC >= 5 && tempC <= 25) rnScore += 1;
      if (humidity <= 60) rnScore += 2; else if (humidity <= 75) rnScore += 1;
      if (windSpeed <= wt.low) rnScore += 1;
      if (!isRain && !isSnow) rnScore += 2;
      const { label: rnLabel, color: rnColor } = getConditionLabel(rnScore, [6, 4, 2]);
      return {
        conditions: [
          { title: 'Условия\nдля бега', value: rnLabel, color: rnColor, icon: 'walk-outline' },
          { title: 'Температура',       value: `${Math.round(convertTemperature(tempC, tempUnit))}${getTemperatureSymbol(tempUnit)}`, color: tempC >= 10 && tempC <= 20 ? '#4CAF50' : tempC >= 5 && tempC <= 25 ? '#FFC107' : '#FF9800', icon: 'thermometer-outline' },
          { title: 'Влажность',         value: `${humidity}%`, color: humidity <= 60 ? '#4CAF50' : humidity <= 75 ? '#FFC107' : '#FF9800', icon: 'water-outline' },
          { title: 'UV индекс',         value: `${uv}/11`, color: uv <= 2 ? '#4CAF50' : uv <= 5 ? '#FFC107' : uv <= 7 ? '#FF9800' : '#f44336', icon: 'sunny-outline' },
        ],
        recommendations: [
          tempC >= 10 && tempC <= 20 ? 'Идеальная температура для бега' : tempC < 0 ? 'Заморозки - будьте крайне осторожны, используйте шипы' : tempC < 5 ? 'Очень холодно - одевайтесь слоями, разминка обязательна' : tempC < 10 ? 'Прохладно - одевайтесь теплее' : tempC > 30 ? 'Очень жарко - бегайте только рано утром или поздно вечером' : 'Жарко - бегайте рано утром или вечером, больше пейте',
          humidity <= 50 ? 'Отличная влажность для бега' : humidity <= 60 ? 'Комфортная влажность' : humidity <= 75 ? 'Повышенная влажность - больше пейте воды и снизьте темп' : humidity <= 85 ? 'Высокая влажность - сократите интенсивность тренировки' : 'Очень высокая влажность - рассмотрите тренировку в помещении',
          windSpeed <= wt.low ? 'Спокойные условия - отлично для бега' : windSpeed <= wt.high ? 'Умеренный ветер - может помочь при попутном, мешать при встречном' : 'Сильный ветер - будьте осторожны, избегайте открытых пространств',
          isSnow ? 'Снег - очень скользко, используйте специальную обувь' : isRain ? 'Дождь - лучше заниматься в помещении или под навесом' : tempC > 25 && humidity > 75 ? 'Жарко и влажно - сократите дистанцию и пейте больше воды' : uv > 5 ? 'Высокий UV - используйте солнцезащитный крем и кепку' : 'Отличные условия для бега на свежем воздухе',
        ],
      };
    }

    default:
      return { conditions: [], recommendations: [] };
  }
};
