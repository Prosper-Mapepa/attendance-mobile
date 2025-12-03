import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { TourProvider } from './src/contexts/TourContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <TourProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </TourProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
