import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function LargeWeatherWidget({ current, forecast, error, tempSymbol, convertTemperature, getWeatherDescription, getWeatherIcon }) {
  if (error && !current) {
    return (
      <FlexWidget style={{ height: 'match_parent', width: 'match_parent', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1e1e', borderRadius: 16, padding: 8 }}>
        <TextWidget text="⚠️" style={{ fontSize: 32, color: '#ff9800', textAlign: 'center' }} />
        <TextWidget text="Нет данных" style={{ fontSize: 14, color: '#ffffff', textAlign: 'center', marginTop: 4 }} />
      </FlexWidget>
    );
  }

  if (!current) {
    return (
      <FlexWidget style={{ height: 'match_parent', width: 'match_parent', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1e1e', borderRadius: 16 }}>
        <TextWidget text="Загрузка..." style={{ fontSize: 16, color: '#ffffff', textAlign: 'center' }} />
      </FlexWidget>
    );
  }

  const currentTemp = convertTemperature(current.temp);
  const feelsLike   = convertTemperature(current.feelsLike);
  const nightTemp   = forecast?.length > 0
    ? convertTemperature(forecast[0].nightTemp || current.tempMin)
    : null;

  const isDay = Date.now() / 1000 >= current.sunrise && Date.now() / 1000 < current.sunset;
  const backgroundColor = isDay ? '#2196F3' : '#1a237e';

  return (
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor, borderRadius: 16, padding: 12, justifyContent: 'space-around', alignItems: 'center' }}>
      <TextWidget text={current.name || 'Город'} style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }} />
      <TextWidget text={getWeatherDescription(current)} style={{ fontSize: 14, color: '#e3f2fd', textTransform: 'capitalize', textAlign: 'center' }} />

      {/* Основная температура */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%' }}>
        <TextWidget text={getWeatherIcon(current)} style={{ fontSize: 56 }} />
        <TextWidget text={`${currentTemp}${tempSymbol}`} style={{ fontSize: 42, fontWeight: 'bold', color: '#ffffff' }} />
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end', width: 70 }}>
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TextWidget text="☀️" style={{ fontSize: 16, marginRight: 4 }} />
            <TextWidget text={`${currentTemp}${tempSymbol}`} style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }} />
          </FlexWidget>
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextWidget text="🌙" style={{ fontSize: 16, marginRight: 4 }} />
            <TextWidget
              text={nightTemp !== null ? `${nightTemp}${tempSymbol}` : `${feelsLike}${tempSymbol}`}
              style={{ fontSize: 18, color: '#bbdefb' }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      {/* Дополнительные показатели */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10 }}>
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TextWidget text="💨" style={{ fontSize: 16, marginBottom: 2 }} />
          <TextWidget text={`${Math.round(current.windSpeed)} м/с`} style={{ fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }} />
          <TextWidget text="Ветер" style={{ fontSize: 10, color: '#e3f2fd', textAlign: 'center' }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TextWidget text="💧" style={{ fontSize: 16, marginBottom: 2 }} />
          <TextWidget text={`${current.humidity}%`} style={{ fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }} />
          <TextWidget text="Влажность" style={{ fontSize: 10, color: '#e3f2fd', textAlign: 'center' }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TextWidget text="🌡️" style={{ fontSize: 16, marginBottom: 2 }} />
          <TextWidget text={`${Math.round(current.pressure * 0.75)} мм`} style={{ fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }} />
          <TextWidget text="Давление" style={{ fontSize: 10, color: '#e3f2fd', textAlign: 'center' }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TextWidget text="☁️" style={{ fontSize: 16, marginBottom: 2 }} />
          <TextWidget text={`${current.clouds}%`} style={{ fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }} />
          <TextWidget text="Облачность" style={{ fontSize: 10, color: '#e3f2fd', textAlign: 'center' }} />
        </FlexWidget>
      </FlexWidget>

      {/* Прогноз на 3 дня */}
      {forecast?.length > 0 && (
        <FlexWidget style={{ width: '100%' }}>
          <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', paddingHorizontal: 4 }}>
            {forecast.slice(0, 3).map((day, i) => {
              const date = new Date(day.date);
              const dayName = i === 0 ? 'Завтра' : ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][date.getDay()];
              return (
                <FlexWidget key={i} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 6, alignItems: 'center', width: 90 }}>
                  <TextWidget text={dayName} style={{ fontSize: 11, color: '#e3f2fd', textAlign: 'center', fontWeight: 'bold', marginBottom: 4 }} />
                  <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%' }}>
                    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
                      <TextWidget text="☀️" style={{ fontSize: 14 }} />
                      <TextWidget text={`${convertTemperature(day.temp)}°`} style={{ fontSize: 13, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }} />
                    </FlexWidget>
                    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
                      <TextWidget text="🌙" style={{ fontSize: 14 }} />
                      <TextWidget
                        text={day.nightTemp ? `${convertTemperature(day.nightTemp)}°` : '--'}
                        style={{ fontSize: 13, color: '#bbdefb', textAlign: 'center' }}
                      />
                    </FlexWidget>
                  </FlexWidget>
                </FlexWidget>
              );
            })}
          </FlexWidget>
        </FlexWidget>
      )}

      {error && (
        <FlexWidget style={{ position: 'absolute', top: 8, right: 8 }}>
          <TextWidget text="📶" style={{ fontSize: 12, opacity: 0.7 }} />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
