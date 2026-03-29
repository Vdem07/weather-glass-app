import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export function getWidgetBackground(current) {
  const now = Date.now() / 1000;
  return now >= current.sunrise && now < current.sunset ? '#2196F3' : '#1a237e';
}

export function ErrorWidget({ fontSize = 12 }) {
  return (
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1e1e', borderRadius: 16, padding: 8 }}>
      <TextWidget text="⚠️" style={{ fontSize: fontSize * 2, color: '#ff9800', textAlign: 'center' }} />
      <TextWidget text="Нет данных" style={{ fontSize, color: '#ffffff', textAlign: 'center', marginTop: 4 }} />
    </FlexWidget>
  );
}

export function LoadingWidget({ fontSize = 14 }) {
  return (
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1e1e', borderRadius: 16 }}>
      <TextWidget text="Загрузка..." style={{ fontSize, color: '#ffffff', textAlign: 'center' }} />
    </FlexWidget>
  );
}

export function DayNightTemps({ dayTemp, nightTemp, tempSymbol, iconSize, fontSize }) {
  return (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <TextWidget text="☀️" style={{ fontSize: iconSize, marginRight: 3 }} />
        <TextWidget text={`${dayTemp}${tempSymbol}`} style={{ fontSize, fontWeight: 'bold', color: '#ffffff' }} />
      </FlexWidget>
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextWidget text="🌙" style={{ fontSize: iconSize, marginRight: 3 }} />
        <TextWidget text={`${nightTemp}${tempSymbol}`} style={{ fontSize, color: '#bbdefb' }} />
      </FlexWidget>
    </FlexWidget>
  );
}

export function ForecastDays({ forecast, convertTemperature }) {
  if (!forecast?.length) return null;
  return (
    <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-evenly', width: '100%' }}>
      {forecast.slice(0, 3).map((day, i) => {
        const dayName = i === 0 ? 'Завтра' : DAYS[new Date(day.date).getDay()];
        return (
          <FlexWidget key={i} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 6, alignItems: 'center', flex: 1, marginHorizontal: 2 }}>
            <TextWidget text={dayName} style={{ fontSize: 11, color: '#e3f2fd', textAlign: 'center', fontWeight: 'bold', marginBottom: 4 }} />
            <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
              <FlexWidget style={{ alignItems: 'center' }}>
                <TextWidget text="☀️" style={{ fontSize: 14 }} />
                <TextWidget text={`${convertTemperature(day.temp)}°`} style={{ fontSize: 13, fontWeight: 'bold', color: '#ffffff' }} />
              </FlexWidget>
              <FlexWidget style={{ alignItems: 'center' }}>
                <TextWidget text="🌙" style={{ fontSize: 14 }} />
                <TextWidget text={day.nightTemp ? `${convertTemperature(day.nightTemp)}°` : '--'} style={{ fontSize: 13, color: '#bbdefb' }} />
              </FlexWidget>
            </FlexWidget>
          </FlexWidget>
        );
      })}
    </FlexWidget>
  );
}

export function RefreshButton() {
  return (
    <FlexWidget
      clickAction="WIDGET_CLICK"
      style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 4 }}
    >
      <TextWidget text="🔄" style={{ fontSize: 14 }} />
    </FlexWidget>
  );
}
