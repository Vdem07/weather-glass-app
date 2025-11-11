import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

// Универсальный адаптивный виджет погоды
export function AdaptiveWeatherWidget(props) {
  const { 
    current, 
    forecast, 
    error, 
    tempSymbol, 
    convertTemperature, 
    getWeatherDescription, 
    getWeatherIcon,
    widgetWidth = 320,
    widgetHeight = 120
  } = props;

  // Определяем размер виджета на основе ширины и высоты
  const getWidgetSize = (width, height) => {
    const aspectRatio = width / height;
    
    // Компактный виджет (1x1 или около того)
    if (width <= 200 && height <= 150) {
      return 'compact';
    }
    
    // Малый виджет (2x1)
    if (height <= 150) {
      return 'small';
    }
    
    // Средний виджет (4x2)
    if (height <= 250) {
      return 'medium';
    }
    
    // Большой виджет (4x3 и больше)
    return 'large';
  };

  const widgetSize = getWidgetSize(widgetWidth, widgetHeight);
  
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
          borderRadius: Math.min(widgetWidth * 0.05, 16),
          padding: Math.max(widgetWidth * 0.025, 8),
        }}
      >
        <TextWidget
          text="⚠️"
          style={{
            fontSize: Math.min(widgetWidth * 0.075, 24),
            color: '#ff9800',
            textAlign: 'center',
          }}
        />
        <TextWidget
          text="Нет данных"
          style={{
            fontSize: Math.min(widgetWidth * 0.0375, 12),
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
          borderRadius: Math.min(widgetWidth * 0.05, 16),
        }}
      >
        <TextWidget
          text="Загрузка..."
          style={{
            fontSize: Math.min(widgetWidth * 0.044, 14),
            color: '#ffffff',
            textAlign: 'center',
          }}
        />
      </FlexWidget>
    );
  }

  // Получаем данные для отображения
  const currentTemp = convertTemperature(current.main.temp);
  const feelsLike = convertTemperature(current.main.feels_like);
  
  let nightTemp = null;
  if (forecast && forecast.length > 0) {
    nightTemp = convertTemperature(forecast[0].nightTemp || current.main.temp_min);
  }

  // Определяем цвет фона в зависимости от времени дня
  const now = Date.now() / 1000;
  const isDay = now >= current.sys.sunrise && now < current.sys.sunset;
  const backgroundColor = isDay ? '#2196F3' : '#1a237e';

  // Компактный виджет (только текущая температура)
  if (widgetSize === 'compact') {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: backgroundColor,
          borderRadius: Math.min(widgetWidth * 0.08, 16),
          padding: Math.max(widgetWidth * 0.03, 6),
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text={getWeatherIcon(current)}
          style={{
            fontSize: Math.min(widgetWidth * 0.15, widgetHeight * 0.25),
            marginBottom: 2,
          }}
        />
        <TextWidget
          text={`${currentTemp}${tempSymbol}`}
          style={{
            fontSize: Math.min(widgetWidth * 0.12, widgetHeight * 0.2),
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          }}
        />
      </FlexWidget>
    );
  }

  // Малый виджет (как текущий SmallWeatherWidget)
  if (widgetSize === 'small') {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: backgroundColor,
          borderRadius: Math.min(widgetWidth * 0.05, 16),
          padding: Math.max(widgetWidth * 0.019, 6),
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {/* Город */}
        <TextWidget
          text={current.name || 'Город'}
          style={{
            fontSize: Math.min(widgetWidth * 0.044, 14),
            fontWeight: 'bold',
            color: '#ffffff',
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
          <TextWidget
            text={getWeatherIcon(current)}
            style={{
              fontSize: Math.min(widgetWidth * 0.1, 32),
            }}
          />
          <TextWidget
            text={`${currentTemp}${tempSymbol}`}
            style={{
              fontSize: Math.min(widgetWidth * 0.081, 26),
              fontWeight: 'bold',
              color: '#ffffff',
            }}
          />

          {/* Дневная и ночная температуры */}
          <FlexWidget
            style={{
              flexDirection: 'column',
              alignItems: 'flex-end',
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
                  fontSize: Math.min(widgetWidth * 0.038, 12),
                  marginRight: 3,
                }}
              />
              <TextWidget
                text={`${currentTemp}${tempSymbol}`}
                style={{
                  fontSize: Math.min(widgetWidth * 0.044, 14),
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
                  fontSize: Math.min(widgetWidth * 0.038, 12),
                  marginRight: 3,
                }}
              />
              <TextWidget
                text={nightTemp !== null ? `${nightTemp}${tempSymbol}` : `${feelsLike}${tempSymbol}`}
                style={{
                  fontSize: Math.min(widgetWidth * 0.044, 14),
                  color: '#bbdefb',
                }}
              />
            </FlexWidget>
          </FlexWidget>
        </FlexWidget>

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

  // Средний виджет (как текущий MediumWeatherWidget)
  if (widgetSize === 'medium') {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: backgroundColor,
          borderRadius: Math.min(widgetWidth * 0.05, 16),
          padding: Math.max(widgetWidth * 0.025, 8),
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {/* Город и описание */}
        <TextWidget
          text={current.name || 'Город'}
          style={{
            fontSize: Math.min(widgetWidth * 0.05, 16),
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          }}
        />
        <TextWidget
          text={getWeatherDescription(current)}
          style={{
            fontSize: Math.min(widgetWidth * 0.038, 12),
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
          <TextWidget
            text={getWeatherIcon(current)}
            style={{
              fontSize: Math.min(widgetWidth * 0.15, 48),
            }}
          />
          <TextWidget
            text={`${currentTemp}${tempSymbol}`}
            style={{
              fontSize: Math.min(widgetWidth * 0.1125, 36),
              fontWeight: 'bold',
              color: '#ffffff',
            }}
          />

          <FlexWidget
            style={{
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <FlexWidget
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <TextWidget
                text="☀️"
                style={{
                  fontSize: Math.min(widgetWidth * 0.044, 14),
                  marginRight: 4,
                }}
              />
              <TextWidget
                text={`${currentTemp}${tempSymbol}`}
                style={{
                  fontSize: Math.min(widgetWidth * 0.05, 16),
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
                  fontSize: Math.min(widgetWidth * 0.044, 14),
                  marginRight: 4,
                }}
              />
              <TextWidget
                text={nightTemp !== null ? `${nightTemp}${tempSymbol}` : `${feelsLike}${tempSymbol}`}
                style={{
                  fontSize: Math.min(widgetWidth * 0.05, 16),
                  color: '#bbdefb',
                }}
              />
            </FlexWidget>
          </FlexWidget>
        </FlexWidget>

        {/* Прогноз на 3 дня */}
        {forecast && forecast.length > 0 && (
          <FlexWidget
            style={{
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              width: '100%',
              paddingHorizontal: 4,
            }}
          >
            {forecast.slice(0, 3).map((day, index) => {
              const date = new Date(day.date);
              const dayName = index === 0 ? 'Завтра' :
                            ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][date.getDay()];
              
              const cardWidth = Math.min(widgetWidth * 0.25, 90);
              
              return (
                <FlexWidget
                  key={index}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    padding: Math.max(cardWidth * 0.067, 6),
                    alignItems: 'center',
                    width: cardWidth,
                  }}
                >
                  <TextWidget
                    text={dayName}
                    style={{
                      fontSize: Math.min(cardWidth * 0.122, 11),
                      color: '#e3f2fd',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      marginBottom: 4,
                    }}
                  />
                  
                  <FlexWidget
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <FlexWidget
                      style={{
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <TextWidget
                        text="☀️"
                        style={{
                          fontSize: Math.min(cardWidth * 0.156, 14),
                        }}
                      />
                      <TextWidget
                        text={`${convertTemperature(day.temp)}°`}
                        style={{
                          fontSize: Math.min(cardWidth * 0.144, 13),
                          fontWeight: 'bold',
                          color: '#ffffff',
                          textAlign: 'center',
                        }}
                      />
                    </FlexWidget>
                    
                    <FlexWidget
                      style={{
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <TextWidget
                        text="🌙"
                        style={{
                          fontSize: Math.min(cardWidth * 0.156, 14),
                        }}
                      />
                      <TextWidget
                        text={day.nightTemp ? `${convertTemperature(day.nightTemp)}°` : '--'}
                        style={{
                          fontSize: Math.min(cardWidth * 0.144, 13),
                          color: '#bbdefb',
                          textAlign: 'center',
                        }}
                      />
                    </FlexWidget>
                  </FlexWidget>
                </FlexWidget>
              );
            })}
          </FlexWidget>
        )}

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

  // Большой виджет (как текущий LargeWeatherWidget + дополнительные данные)
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: backgroundColor,
        borderRadius: Math.min(widgetWidth * 0.05, 16),
        padding: Math.max(widgetWidth * 0.038, 12),
        justifyContent: 'space-around',
        alignItems: 'center',
      }}
    >
      {/* Город и описание */}
      <TextWidget
        text={current.name || 'Город'}
        style={{
          fontSize: Math.min(widgetWidth * 0.056, 18),
          fontWeight: 'bold',
          color: '#ffffff',
          textAlign: 'center',
        }}
      />
      <TextWidget
        text={getWeatherDescription(current)}
        style={{
          fontSize: Math.min(widgetWidth * 0.044, 14),
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
        <TextWidget
          text={getWeatherIcon(current)}
          style={{
            fontSize: Math.min(widgetWidth * 0.175, 56),
          }}
        />
        <TextWidget
          text={`${currentTemp}${tempSymbol}`}
          style={{
            fontSize: Math.min(widgetWidth * 0.131, 42),
            fontWeight: 'bold',
            color: '#ffffff',
          }}
        />

        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <TextWidget
              text="☀️"
              style={{
                fontSize: Math.min(widgetWidth * 0.05, 16),
                marginRight: 4,
              }}
            />
            <TextWidget
              text={`${currentTemp}${tempSymbol}`}
              style={{
                fontSize: Math.min(widgetWidth * 0.056, 18),
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
                fontSize: Math.min(widgetWidth * 0.05, 16),
                marginRight: 4,
              }}
            />
            <TextWidget
              text={nightTemp !== null ? `${nightTemp}${tempSymbol}` : `${feelsLike}${tempSymbol}`}
              style={{
                fontSize: Math.min(widgetWidth * 0.056, 18),
                color: '#bbdefb',
              }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      {/* Дополнительные данные о погоде */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          padding: Math.max(widgetWidth * 0.031, 10),
        }}
      >
        {/* Ветер */}
        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <TextWidget
            text="💨"
            style={{
              fontSize: Math.min(widgetWidth * 0.05, 16),
              marginBottom: 2,
            }}
          />
          <TextWidget
            text={`${Math.round(current.wind.speed)} м/с`}
            style={{
              fontSize: Math.min(widgetWidth * 0.038, 12),
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
            }}
          />
          <TextWidget
            text="Ветер"
            style={{
              fontSize: Math.min(widgetWidth * 0.031, 10),
              color: '#e3f2fd',
              textAlign: 'center',
            }}
          />
        </FlexWidget>

        {/* Влажность */}
        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <TextWidget
            text="💧"
            style={{
              fontSize: Math.min(widgetWidth * 0.05, 16),
              marginBottom: 2,
            }}
          />
          <TextWidget
            text={`${current.main.humidity}%`}
            style={{
              fontSize: Math.min(widgetWidth * 0.038, 12),
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
            }}
          />
          <TextWidget
            text="Влажность"
            style={{
              fontSize: Math.min(widgetWidth * 0.031, 10),
              color: '#e3f2fd',
              textAlign: 'center',
            }}
          />
        </FlexWidget>

        {/* Давление */}
        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <TextWidget
            text="🌡️"
            style={{
              fontSize: Math.min(widgetWidth * 0.05, 16),
              marginBottom: 2,
            }}
          />
          <TextWidget
            text={`${Math.round(current.main.pressure * 0.75)} мм`}
            style={{
              fontSize: Math.min(widgetWidth * 0.038, 12),
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
            }}
          />
          <TextWidget
            text="Давление"
            style={{
              fontSize: Math.min(widgetWidth * 0.031, 10),
              color: '#e3f2fd',
              textAlign: 'center',
            }}
          />
        </FlexWidget>

        {/* Облачность */}
        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <TextWidget
            text="☁️"
            style={{
              fontSize: Math.min(widgetWidth * 0.05, 16),
              marginBottom: 2,
            }}
          />
          <TextWidget
            text={`${current.clouds.all}%`}
            style={{
              fontSize: Math.min(widgetWidth * 0.038, 12),
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
            }}
          />
          <TextWidget
            text="Облачность"
            style={{
              fontSize: Math.min(widgetWidth * 0.031, 10),
              color: '#e3f2fd',
              textAlign: 'center',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Прогноз на 3 дня */}
      {forecast && forecast.length > 0 && (
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            width: '100%',
            paddingHorizontal: 4,
          }}
        >
          {forecast.slice(0, 3).map((day, index) => {
            const date = new Date(day.date);
            const dayName = index === 0 ? 'Завтра' : 
                          ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][date.getDay()];
            
            const cardWidth = Math.min(widgetWidth * 0.25, 90);
            
            return (
              <FlexWidget
                key={index}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  padding: Math.max(cardWidth * 0.067, 6),
                  alignItems: 'center',
                  width: cardWidth,
                }}
              >
                <TextWidget
                  text={dayName}
                  style={{
                    fontSize: Math.min(cardWidth * 0.122, 11),
                    color: '#e3f2fd',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    marginBottom: 4,
                  }}
                />
                
                <FlexWidget
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <FlexWidget
                    style={{
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <TextWidget
                      text="☀️"
                      style={{
                        fontSize: Math.min(cardWidth * 0.156, 14),
                      }}
                    />
                    <TextWidget
                      text={`${convertTemperature(day.temp)}°`}
                      style={{
                        fontSize: Math.min(cardWidth * 0.144, 13),
                        fontWeight: 'bold',
                        color: '#ffffff',
                        textAlign: 'center',
                      }}
                    />
                  </FlexWidget>
                  
                  <FlexWidget
                    style={{
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <TextWidget
                      text="🌙"
                      style={{
                        fontSize: Math.min(cardWidth * 0.156, 14),
                      }}
                    />
                    <TextWidget
                      text={day.nightTemp ? `${convertTemperature(day.nightTemp)}°` : '--'}
                      style={{
                        fontSize: Math.min(cardWidth * 0.144, 13),
                        color: '#bbdefb',
                        textAlign: 'center',
                      }}
                    />
                  </FlexWidget>
                </FlexWidget>
              </FlexWidget>
            );
          })}
        </FlexWidget>
      )}

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