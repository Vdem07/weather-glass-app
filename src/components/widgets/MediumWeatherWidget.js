import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { getWidgetBackground, ErrorWidget, LoadingWidget, DayNightTemps, ForecastDays, RefreshButton } from './widgetHelpers';

export function MediumWeatherWidget({ current, forecast, error, tempSymbol, convertTemperature, getWeatherDescription, getWeatherIcon }) {
  if (error && !current) return <ErrorWidget fontSize={12} />;
  if (!current) return <LoadingWidget fontSize={14} />;

  const currentTemp = convertTemperature(current.temp);
  const nightTemp   = convertTemperature(forecast?.[0]?.nightTemp || current.tempMin);
  const dayTemp     = convertTemperature(forecast?.[0]?.tempMax   || current.tempMax);

  return (
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor: getWidgetBackground(current), borderRadius: 16, padding: 8, justifyContent: 'space-around', alignItems: 'center' }}>
      <TextWidget text={current.name || 'Город'} style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }} />
      <TextWidget text={getWeatherDescription(current)} style={{ fontSize: 12, color: '#e3f2fd', textTransform: 'capitalize', textAlign: 'center' }} />

      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%' }}>
        <TextWidget text={getWeatherIcon(current)} style={{ fontSize: 48 }} />
        <TextWidget text={`${currentTemp}${tempSymbol}`} style={{ fontSize: 36, fontWeight: 'bold', color: '#ffffff' }} />
        <DayNightTemps dayTemp={dayTemp} nightTemp={nightTemp} tempSymbol={tempSymbol} iconSize={14} fontSize={16} />
      </FlexWidget>

      <ForecastDays forecast={forecast} convertTemperature={convertTemperature} />

      <RefreshButton />
    </FlexWidget>
  );
}
