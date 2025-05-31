export default function getWeatherAnimation(weatherMain, weatherDescription = '') {
  const main = weatherMain?.toLowerCase?.() || '';
  const desc = weatherDescription?.toLowerCase?.() || '';

  if (main === 'clear') {
    return require('../assets/lottie/clear-day.json');
  }

  if (main === 'clouds') {
    if (
      desc.includes('небольш') || // "небольшая облачность"
      desc.includes('мало') ||    // "малооблачно"
      desc.includes('рассеян')    // "рассеянные облака"
    ) {
      return require('../assets/lottie/partly-cloudy.json');
    }
    if (
      desc.includes('проясн')
    ) {
      return require('../assets/lottie/few-cloudy.json');
    }
    if (
      desc.includes('пасмурно') ||
      desc.includes('плотн') ||       // "плотная облачность"
      desc.includes('сплошн') ||      // "сплошная облачность"
      desc.includes('облач')          // общая проверка
    ) {
      return require('../assets/lottie/clouds.json');
    }
    return require('../assets/lottie/partly-cloudy.json'); // по умолчанию
  }

  if (main === 'rain' || main === 'drizzle') {
    if (
      desc.includes('небольш') ||
      desc.includes('слаб') ||
      desc.includes('дождик') ||
      desc.includes('морось')
    ) {
      return require('../assets/lottie/light-rain.json');
    }
    return require('../assets/lottie/rain.json');
  }

  if (main === 'thunderstorm' || desc.includes('гроза')) {
    return require('../assets/lottie/thunder.json');
  }

  if (main === 'snow' || desc.includes('снег')) {
    return require('../assets/lottie/snow.json');
  }

  if (
    desc.includes('туман') ||
    desc.includes('дым') ||
    desc.includes('мгла')
  ) {
    return require('../assets/lottie/fog.json');
  }

  if (
    desc.includes('пыль') ||
    desc.includes('песок') ||
    desc.includes('песчан') ||
    desc.includes('смог') ||
    desc.includes('пепел') ||
    desc.includes('вулкан')
  ) {
    return require('../assets/lottie/dust.json');
  }

  return require('../assets/lottie/clouds.json'); // fallback
}
