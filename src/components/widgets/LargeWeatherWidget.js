import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { getWidgetBackground, ErrorWidget, LoadingWidget, DayNightTemps, ForecastDays, RefreshButton } from './widgetHelpers';

export function LargeWeatherWidget({ current, forecast, error, tempSymbol, convertTemperature, getWeatherDescription, getWeatherIcon }) {
  if (error && !current) return <ErrorWidget fontSize={14} />;
  if (!current) return <LoadingWidget fontSize={16} />;

  const currentTemp = convertTemperature(current.temp);
  const nightTemp   = convertTemperature(forecast?.[0]?.nightTemp || current.tempMin);
  const dayTemp     = convertTemperature(forecast?.[0]?.tempMax   || current.tempMax);

  return (
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor: getWidgetBackground(current), borderRadius: 16, padding: 12, justifyContent: 'space-around', alignItems: 'center' }}>
      <TextWidget text={current.name || 'Город'} style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }} />
      <TextWidget text={getWeatherDescription(current)} style={{ fontSize: 14, color: '#e3f2fd', textTransform: 'capitalize', textAlign: 'center' }} />

      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%' }}>
        <TextWidget text={getWeatherIcon(current)} style={{ fontSize: 56 }} />
        <TextWidget text={`${currentTemp}${tempSymbol}`} style={{ fontSize: 42, fontWeight: 'bold', color: '#ffffff' }} />
        <DayNightTemps dayTemp={dayTemp} nightTemp={nightTemp} tempSymbol={tempSymbol} iconSize={16} fontSize={18} />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10 }}>
        {[
          { icon: '💨', value: `${Math.round(current.windSpeed)} м/с`, label: 'Ветер' },
          { icon: '💧', value: `${current.humidity}%`,                  label: 'Влажность' },
          { icon: '🌡️', value: `${Math.round(current.pressure * 0.75)} мм`, label: 'Давление' },
          { icon: '☁️', value: `${current.clouds}%`,                    label: 'Облачность' },
        ].map(({ icon, value, label }) => (
          <FlexWidget key={label} style={{ alignItems: 'center' }}>
            <TextWidget text={icon} style={{ fontSize: 16, marginBottom: 2 }} />
            <TextWidget text={value} style={{ fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }} />
            <TextWidget text={label} style={{ fontSize: 10, color: '#e3f2fd', textAlign: 'center' }} />
          </FlexWidget>
        ))}
      </FlexWidget>

      <ForecastDays forecast={forecast} convertTemperature={convertTemperature} />

      <RefreshButton />
    </FlexWidget>
  );
}
