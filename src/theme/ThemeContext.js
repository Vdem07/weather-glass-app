/**
 * ThemeContext
 *
 * Глобальный контекст темы приложения (светлая / тёмная).
 * Сохраняет выбор пользователя в AsyncStorage и восстанавливает при запуске.
 *
 * Использование:
 * - Обернуть приложение в <ThemeProvider>
 * - В компонентах использовать хук useThemeContext() - { isDark, toggleTheme }
 */

import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme')
      .then((value) => { if (value === 'dark') setIsDark(true); })
      .catch(() => {}); // при ошибке остаётся светлая тема по умолчанию
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light').catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
