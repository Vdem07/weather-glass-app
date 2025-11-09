import { registerRootComponent } from 'expo';

import App from './App';
import { widgetTaskHandler } from './src/components/widget-task-handler';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
// Регистрируем обработчик виджетов
registerWidgetTaskHandler(widgetTaskHandler);