import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { TourProvider } from './src/contexts/TourContext';
import AppNavigator from './src/navigation/AppNavigator';
import UpdatePrompt from './src/components/UpdatePrompt';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <TourProvider>
          <AppNavigator />
          <UpdatePrompt autoCheck={true} autoUpdate={false} />
          <StatusBar style="light" />
        </TourProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
