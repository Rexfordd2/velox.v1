import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppNavigator from './src/navigation/AppNavigator';
import * as tf from '@tensorflow/tfjs';

// Ignore TensorFlow.js WebGL warnings
LogBox.ignoreLogs(['WebGL']);

const qc = new QueryClient();

export default function App() {
  useEffect(() => {
    // Initialize TensorFlow.js
    tf.ready().then(() => {
      console.log('TensorFlow.js ready');
    });
  }, []);

  return (
    <NavigationContainer>
      <QueryClientProvider client={qc}>
        <AppNavigator />
      </QueryClientProvider>
    </NavigationContainer>
  );
} 