import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { getWidgetBackground, ErrorWidget, LoadingWidget, DayNightTemps, RefreshButton } from './widgetHelpers';

export function SmallWeatherWidget({ current, forecast, error, tempSymbol, convertTemperature, getWeatherIcon }) {
  if (error && !current) return <ErrorWidget fontSize={12} />;
  if (!current) return <LoadingWidget fontSize={14} />;

  const currentTemp = convertTemperature(current.temp);
  const nightTemp   = convertTemperature(forecast?.[0]?.nightTemp || current.tempMin);
  const dayTemp     = convertTemperature(forecast?.[0]?.tempMax   || current.tempMax);

  return (
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor: getWidgetBackground(current), borderRadius: 16, padding: 6, justifyContent: 'space-around', alignItems: 'center' }}>

      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <TextWidget text={current.name || 'Город'} style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff', flex: 1 }} />
        <RefreshButton />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%' }}>
        <TextWidget text={getWeatherIcon(current)} style={{ fontSize: 32 }} />
        <TextWidget text={`${currentTemp}${tempSymbol}`} style={{ fontSize: 26, fontWeight: 'bold', color: '#ffffff' }} />
        <DayNightTemps dayTemp={dayTemp} nightTemp={nightTemp} tempSymbol={tempSymbol} iconSize={12} fontSize={14} />
      </FlexWidget>

    </FlexWidget>
  );
}
