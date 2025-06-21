import { Image } from 'react-native';
// Компонент для отображения иконок погоды
export default function renderWeatherIcon(iconType, size, color) {
    const iconStyle = {
      width: size,
      height: size,
      tintColor: color
    };
  
    switch (iconType) {
      case 'precipitation':
      case 'umbrella':
        return (
          <Image 
            source={require('../assets/icons/umbrella.png')} 
            style={iconStyle}
            resizeMode="contain"
          />
        );
      case 'sunrise':
        return (
          <Image 
            source={require('../assets/icons/sunrise.png')} 
            style={iconStyle}
            resizeMode="contain"
          />
        );
      case 'sunset':
        return (
          <Image 
            source={require('../assets/icons/sunset.png')} 
            style={iconStyle}
            resizeMode="contain"
          />
        );
      case 'pressure':
        return (
          <Image 
            source={require('../assets/icons/pressure.png')} 
            style={iconStyle}
            resizeMode="contain"
          />
        );
      case 'humidity':
        return (
          <Image 
            source={require('../assets/icons/droplet.png')} 
            style={iconStyle}
            resizeMode="contain"
          />
        );
      case 'wind':
        return (
          <Image 
            source={require('../assets/icons/wind.png')} 
            style={iconStyle}
            resizeMode="contain"
          />
        );
      case 'clouds':
        return (
          <Image 
            source={require('../assets/icons/cloud.png')} 
            style={iconStyle}
            resizeMode="contain"
          />
        );
      case 'visibility':
        return (
          <Image 
            source={require('../assets/icons/eye.png')} 
            style={iconStyle}
            resizeMode="contain"
          />
        );
      default:
        return <Feather name="help-circle" size={size} color={color} />;
    }
  };
  