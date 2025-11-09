import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

// Малый виджет - только текущая погода днем и ночью
export function SmallWeatherWidget(props) {
  const { current, forecast, error, tempSymbol, convertTemperature, getWeatherDescription, getWeatherIcon } = props;

  // Обработка ошибок
  if (error && !current) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1e1e1e',
          borderRadius: 16,
          padding: 8,
        }}
      >
        <TextWidget
          text="⚠️"
          style={{
            fontSize: 24,
            color: '#ff9800',
            textAlign: 'center',
          }}
        />
        <TextWidget
          text="Нет данных"
          style={{
            fontSize: 12,
            color: '#ffffff',
            textAlign: 'center',
            marginTop: 4,
          }}
        />
      </FlexWidget>
    );
  }

  if (!current) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1e1e1e',
          borderRadius: 16,
        }}
      >
        <TextWidget
          text="Загрузка..."
          style={{
            fontSize: 14,
            color: '#ffffff',
            textAlign: 'center',
          }}
        />
      </FlexWidget>
    );
  }

  // Получаем температуры
  const currentTemp = convertTemperature(current.main.temp);
  const feelsLike = convertTemperature(current.main.feels_like);
  
  // Получаем данные для ночной температуры из прогноза
  let nightTemp = null;
  if (forecast && forecast.length > 0) {
    nightTemp = convertTemperature(forecast[0].nightTemp || current.main.temp_min);
  }

  // Определяем цвет фона в зависимости от времени дня
  const now = Date.now() / 1000;
  const isDay = now >= current.sys.sunrise && now < current.sys.sunset;
  const backgroundColor = isDay ? '#2196F3' : '#1a237e';
  
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: backgroundColor,
        borderRadius: 16,
        padding: 6,
        justifyContent: 'space-around',
        alignItems: 'center',
      }}
    >
      {/* Город и описание */}
      <TextWidget
        text={current.name || 'Город'}
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: '#ffffff',
          textAlign: 'center',
        }}
      />
      <TextWidget
        text={getWeatherDescription(current)}
        style={{
          fontSize: 11,
          color: '#e3f2fd',
          textTransform: 'capitalize',
          textAlign: 'center',
        }}
      />

      {/* Основная погода */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          width: '100%',
        }}
      >
        {/* Иконка и температура */}
        <TextWidget
          text={getWeatherIcon(current)}
          style={{
            fontSize: 32,
          }}
        />
        <TextWidget
          text={`${currentTemp}${tempSymbol}`}
          style={{
            fontSize: 26,
            fontWeight: 'bold',
            color: '#ffffff',
          }}
        />

        {/* Правая часть - дневная и ночная температуры */}
        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'flex-end',
            width: 50, // Увеличили для лучшего размещения
          }}
        >
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <TextWidget
              text="☀️"
              style={{
                fontSize: 12,
                marginRight: 3,
              }}
            />
            <TextWidget
              text={`${currentTemp}${tempSymbol}`}
              style={{
                fontSize: 14, // Возвращаем читаемый размер
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TextWidget
              text="🌙"
              style={{
                fontSize: 12,
                marginRight: 3,
              }}
            />
            <TextWidget
              text={nightTemp !== null ? `${nightTemp}${tempSymbol}` : `${feelsLike}${tempSymbol}`}
              style={{
                fontSize: 14, // Возвращаем читаемый размер
                color: '#bbdefb',
              }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      {/* Пустое место для баланса */}
      <FlexWidget style={{ height: 8 }} />

      {/* Индикатор офлайн режима */}
      {error && (
        <FlexWidget
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
          }}
        >
          <TextWidget
            text="📶"
            style={{
              fontSize: 12,
              opacity: 0.7,
            }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}