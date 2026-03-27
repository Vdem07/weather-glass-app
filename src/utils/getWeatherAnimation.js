/**
 * getWeatherAnimation
 *
 * Возвращает ассет для отображения текущей погоды.
 * @param {string} weatherMain - Основная категория погоды из API (например, 'Clear', 'Rain')
 * @param {string} weatherDescription - Детальное описание погоды из API (например, 'небольшой дождь')
 * @param {boolean} useStaticIcons - true = PNG (для виджетов), false = Lottie JSON (для приложения)
 * @returns PNG или Lottie JSON ассет
 */

const WEATHER_ASSETS = {
  'clear-day':     { lottie: require('../assets/lottie/clear-day.json'),     static: require('../assets/flaticon/clear-day.png') },
  'partly-cloudy': { lottie: require('../assets/lottie/partly-cloudy.json'), static: require('../assets/flaticon/partly-cloudy.png') },
  'few-cloudy':    { lottie: require('../assets/lottie/few-cloudy.json'),     static: require('../assets/flaticon/few-cloudy.png') },
  'clouds':        { lottie: require('../assets/lottie/clouds.json'),         static: require('../assets/flaticon/clouds.png') },
  'light-rain':    { lottie: require('../assets/lottie/light-rain.json'),     static: require('../assets/flaticon/light-rain.png') },
  'rain':          { lottie: require('../assets/lottie/rain.json'),           static: require('../assets/flaticon/rain.png') },
  'thunder':       { lottie: require('../assets/lottie/thunder.json'),        static: require('../assets/flaticon/thunder.png') },
  'snow':          { lottie: require('../assets/lottie/snow.json'),           static: require('../assets/flaticon/snow.png') },
  'fog':           { lottie: require('../assets/lottie/fog.json'),            static: require('../assets/flaticon/fog.png') },
  'dust':          { lottie: require('../assets/lottie/dust.json'),           static: require('../assets/flaticon/dust.png') },
};

function getWeatherKey(main, desc) {
  if (main === 'clear') return 'clear-day';

  if (main === 'clouds') {
    if (desc.includes('небольш') || desc.includes('мало') || desc.includes('рассеян')) return 'partly-cloudy';
    if (desc.includes('проясн')) return 'few-cloudy';
    if (desc.includes('пасмурно') || desc.includes('плотн') || desc.includes('сплошн') || desc.includes('облач')) return 'clouds';
    return 'partly-cloudy';
  }

  if (main === 'rain' || main === 'drizzle') {
    if (desc.includes('небольш') || desc.includes('слаб') || desc.includes('дождик') || desc.includes('морось')) return 'light-rain';
    return 'rain';
  }

  if (main === 'thunderstorm' || desc.includes('гроза')) return 'thunder';
  if (main === 'snow' || desc.includes('снег')) return 'snow';
  if (desc.includes('туман') || desc.includes('дым') || desc.includes('мгла')) return 'fog';
  if (desc.includes('пыль') || desc.includes('песок') || desc.includes('песчан') || desc.includes('смог') || desc.includes('пепел') || desc.includes('вулкан')) return 'dust';

  return 'clouds';
}

export default function getWeatherAnimation(weatherMain, weatherDescription = '', useStaticIcons = false) {
  const main = weatherMain?.toLowerCase?.() || '';
  const desc = weatherDescription?.toLowerCase?.() || '';
  const key = getWeatherKey(main, desc);
  return useStaticIcons ? WEATHER_ASSETS[key].static : WEATHER_ASSETS[key].lottie;
}
