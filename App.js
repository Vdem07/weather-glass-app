// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text>Open up App.js to start working on your app!</Text>
//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import Navigation from './src/navigation';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ThemeProvider } from './src/theme/ThemeContext';
import { Provider as PaperProvider } from 'react-native-paper';

export default function App() {
  return (
    <ThemeProvider>
      <PaperProvider>
        <SafeAreaView style={styles.container}>
          <Navigation />
          <StatusBar style="light" />
        </SafeAreaView>
      </PaperProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

