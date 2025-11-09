import React from 'react';
import { Image } from 'react-native';
import LottieView from 'lottie-react-native';
import getWeatherAnimation from '../utils/getWeatherAnimation';

const WeatherIcon = ({ 
  weatherMain, 
  weatherDescription, 
  style, 
  width = 160, 
  height = 160, 
  useStaticIcons = false 
}) => {
  const iconSource = getWeatherAnimation(weatherMain, weatherDescription, useStaticIcons);

  if (useStaticIcons) {
    return (
      <Image
        source={iconSource}
        style={[
          {
            width,
            height,
            resizeMode: 'contain',
          },
          style
        ]}
      />
    );
  }

  return (
    <LottieView
      source={iconSource}
      autoPlay
      loop
      style={[
        {
          width,
          height,
        },
        style
      ]}
    />
  );
};

export default WeatherIcon;