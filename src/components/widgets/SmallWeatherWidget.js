import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function SmallWeatherWidget({ current, forecast, error, tempSymbol, convertTemperature, getWeatherDescription, getWeatherIcon }) {
  if (error && !current) {
    return (
      <FlexWidget style={{ height: 'match_parent', width: 'match_parent', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1e1e', borderRadius: 16, padding: 8 }}>
        <TextWidget text="⚠️" style={{ fontSize: 24, color: '#ff9800', textAlign: 'center' }} />
        <TextWidget text="Нет данных" style={{ fontSize: 12, color: '#ffffff', textAlign: 'center', marginTop: 4 }} />
      </FlexWidget>
    );
  }

  if (!current) {
    return (
      <FlexWidget style={{ height: 'match_parent', width: 'match_parent', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1e1e', borderRadius: 16 }}>
        <TextWidget text="Загрузка..." style={{ fontSize: 14, color: '#ffffff', textAlign: 'center' }} />
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
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor, borderRadius: 16, padding: 6, justifyContent: 'space-around', alignItems: 'center' }}>
      <TextWidget text={current.name || 'Город'} style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }} />
      <TextWidget text={getWeatherDescription(current)} style={{ fontSize: 11, color: '#e3f2fd', textTransform: 'capitalize', textAlign: 'center' }} />

      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%' }}>
        <TextWidget text={getWeatherIcon(current)} style={{ fontSize: 32 }} />
        <TextWidget text={`${currentTemp}${tempSymbol}`} style={{ fontSize: 26, fontWeight: 'bold', color: '#ffffff' }} />

        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end', width: 50 }}>
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <TextWidget text="☀️" style={{ fontSize: 12, marginRight: 3 }} />
            <TextWidget text={`${currentTemp}${tempSymbol}`} style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }} />
          </FlexWidget>
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextWidget text="🌙" style={{ fontSize: 12, marginRight: 3 }} />
            <TextWidget
              text={nightTemp !== null ? `${nightTemp}${tempSymbol}` : `${feelsLike}${tempSymbol}`}
              style={{ fontSize: 14, color: '#bbdefb' }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      <FlexWidget style={{ height: 8 }} />

      {error && (
        <FlexWidget style={{ position: 'absolute', top: 8, right: 8 }}>
          <TextWidget text="📶" style={{ fontSize: 12, opacity: 0.7 }} />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
