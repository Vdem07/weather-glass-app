import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentWeather, getDailyForecast } from '../api/weather';
import * as Location from 'expo-location';

// Настройки уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.todayNotificationTimer = null;
    this.tomorrowNotificationTimer = null;
  }

  // Запрос разрешений на уведомления
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Разрешение на уведомления не получено');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка запроса разрешений:', error);
      return false;
    }
  }

  // Получение координат для погодных данных
  async getCoordinates() {
    try {
      const saved = await AsyncStorage.getItem('savedCity');
      
      if (saved) {
        const coords = JSON.parse(saved);
        return { lat: coords.lat, lon: coords.lon };
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Нет разрешения на геолокацию');
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        return { 
          lat: location.coords.latitude, 
          lon: location.coords.longitude 
        };
      }
    } catch (error) {
      console.error('Ошибка получения координат:', error);
      throw error;
    }
  }

  // Конвертация температуры
  async convertTemperature(temp) {
    try {
      const tempUnit = await AsyncStorage.getItem('unit') || 'metric';
      if (tempUnit === 'imperial') {
        return Math.round((temp * 9/5) + 32);
      }
      return Math.round(temp);
    } catch (error) {
      return Math.round(temp);
    }
  }

  // Получение символа температуры
  async getTemperatureSymbol() {
    try {
      const tempUnit = await AsyncStorage.getItem('unit') || 'metric';
      return tempUnit === 'imperial' ? '°F' : '°C';
    } catch (error) {
      return '°C';
    }
  }

  // Формирование уведомления о сегодняшней погоде
  async createTodayNotification() {
    try {
      const coords = await this.getCoordinates();
      const weather = await getCurrentWeather(coords.lat, coords.lon);
      
      const temp = await this.convertTemperature(weather.main.temp);
      const tempSymbol = await this.getTemperatureSymbol();
      const description = weather.weather[0].description;
      const city = weather.name;
      
      const title = `🌤️ Погода сегодня в ${city}`;
      const body = `${temp}${tempSymbol}, ${description}. Влажность ${weather.main.humidity}%`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'today_weather' },
        },
        trigger: null, // Мгновенно
      });

      console.log('Уведомление о сегодняшней погоде отправлено');
    } catch (error) {
      console.error('Ошибка создания уведомления о сегодняшней погоде:', error);
    }
  }

  // Формирование уведомления о завтрашней погоде
  async createTomorrowNotification() {
    try {
      const coords = await this.getCoordinates();
      const forecast = await getDailyForecast(coords.lat, coords.lon);
      
      if (forecast && forecast.length > 0) {
        const tomorrowWeather = forecast[0]; // Завтрашний день
        
        const dayTemp = await this.convertTemperature(tomorrowWeather.temp);
        const nightTemp = await this.convertTemperature(tomorrowWeather.nightTemp);
        const tempSymbol = await this.getTemperatureSymbol();
        
        const title = `🌅 Погода на завтра`;
        const body = `${dayTemp}${tempSymbol} днем, ${nightTemp}${tempSymbol} ночью. ${tomorrowWeather.description}`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { type: 'tomorrow_weather' },
          },
          trigger: null, // Мгновенно
        });

        console.log('Уведомление о завтрашней погоде отправлено');
      }
    } catch (error) {
      console.error('Ошибка создания уведомления о завтрашней погоде:', error);
    }
  }

  // Вычисление времени до следующего уведомления
  calculateTimeUntilNext(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const targetTime = new Date();
    
    targetTime.setHours(hours, minutes, 0, 0);
    
    // Если время уже прошло сегодня, планируем на завтра
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    return targetTime.getTime() - now.getTime();
  }

  // Запуск таймера для сегодняшней погоды
  async startTodayNotificationTimer() {
    try {
      // Очищаем предыдущий таймер
      if (this.todayNotificationTimer) {
        clearTimeout(this.todayNotificationTimer);
      }

      const todayTime = await AsyncStorage.getItem('todayWeatherNotificationTime');
      const isEnabled = await AsyncStorage.getItem('todayWeatherNotificationEnabled');
      
      if (todayTime && isEnabled === 'true') {
        const delay = this.calculateTimeUntilNext(todayTime);
        
        console.log(`Таймер сегодняшней погоды: ${Math.round(delay / 1000 / 60)} минут до срабатывания`);
        
        this.todayNotificationTimer = setTimeout(async () => {
          await this.createTodayNotification();
          // Перезапускаем таймер на следующий день
          this.startTodayNotificationTimer();
        }, delay);
      }
    } catch (error) {
      console.error('Ошибка запуска таймера сегодняшней погоды:', error);
    }
  }

  // Запуск таймера для завтрашней погоды
  async startTomorrowNotificationTimer() {
    try {
      // Очищаем предыдущий таймер
      if (this.tomorrowNotificationTimer) {
        clearTimeout(this.tomorrowNotificationTimer);
      }

      const tomorrowTime = await AsyncStorage.getItem('tomorrowWeatherNotificationTime');
      const isEnabled = await AsyncStorage.getItem('tomorrowWeatherNotificationEnabled');
      
      if (tomorrowTime && isEnabled === 'true') {
        const delay = this.calculateTimeUntilNext(tomorrowTime);
        
        console.log(`Таймер завтрашней погоды: ${Math.round(delay / 1000 / 60)} минут до срабатывания`);
        
        this.tomorrowNotificationTimer = setTimeout(async () => {
          await this.createTomorrowNotification();
          // Перезапускаем таймер на следующий день
          this.startTomorrowNotificationTimer();
        }, delay);
      }
    } catch (error) {
      console.error('Ошибка запуска таймера завтрашней погоды:', error);
    }
  }

  // Инициализация сервиса
  async initialize() {
    try {
      const hasPermission = await this.requestPermissions();
      
      if (hasPermission) {
        await this.startTodayNotificationTimer();
        await this.startTomorrowNotificationTimer();
        console.log('Сервис уведомлений инициализирован');
      } else {
        console.log('Сервис уведомлений не может быть инициализирован - нет разрешений');
      }
    } catch (error) {
      console.error('Ошибка инициализации сервиса уведомлений:', error);
    }
  }

  // Остановка всех таймеров
  stopAllTimers() {
    if (this.todayNotificationTimer) {
      clearTimeout(this.todayNotificationTimer);
      this.todayNotificationTimer = null;
    }
    
    if (this.tomorrowNotificationTimer) {
      clearTimeout(this.tomorrowNotificationTimer);
      this.tomorrowNotificationTimer = null;
    }
    
    console.log('Все таймеры уведомлений остановлены');
  }

  // Перезапуск таймеров (для использования при изменении настроек)
  async restartTimers() {
    this.stopAllTimers();
    await this.startTodayNotificationTimer();
    await this.startTomorrowNotificationTimer();
  }

  // Отправка тестового уведомления
  async sendTestNotification(type = 'today') {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Нет разрешения на уведомления');
      }

      if (type === 'today') {
        await this.createTodayNotification();
      } else {
        await this.createTomorrowNotification();
      }
    } catch (error) {
      console.error('Ошибка отправки тестового уведомления:', error);
      throw error;
    }
  }
}

// Экспортируем единственный экземпляр сервиса
export default new NotificationService();