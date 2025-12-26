import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import api from '../config/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  biometricAvailable: boolean;
  enableBiometric: (email: string, password: string) => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  hasBiometricEnabled: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    checkAuthStatus();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Verify token with backend
        const response = await api.get('/auth/profile');
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Check if user is restricted from logging in (20-minute cooldown after clock-in + logout)
      const restrictionTimestamp = await AsyncStorage.getItem('login_restriction_timestamp');
      if (restrictionTimestamp) {
        const restrictionTime = new Date(restrictionTimestamp).getTime();
        const currentTime = new Date().getTime();
        const timeElapsed = currentTime - restrictionTime;
        const twentyMinutes = 20 * 60 * 1000; // 20 minutes in milliseconds
        
        if (timeElapsed < twentyMinutes) {
          const remainingMinutes = Math.ceil((twentyMinutes - timeElapsed) / (60 * 1000));
          throw new Error(`You cannot log in again for ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}. Please wait before attempting to log in.`);
        } else {
          // Restriction period has passed, clear it
          await AsyncStorage.removeItem('login_restriction_timestamp');
        }
      }

      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      await AsyncStorage.setItem('token', access_token);
      setUser(userData);
      
      // Clear any old clock-in flag from previous session (in case app crashed, etc.)
      // The restriction will only apply if they clocked in AND logged out properly
      await AsyncStorage.removeItem('has_clocked_in');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const enableBiometric = async (email: string, password: string) => {
    try {
      // Store credentials securely for biometric login
      await SecureStore.setItemAsync('biometric_email', email);
      await SecureStore.setItemAsync('biometric_password', password);
      await AsyncStorage.setItem('biometric_enabled', 'true');
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw new Error('Failed to enable biometric authentication');
    }
  };

  const loginWithBiometric = async () => {
    try {
      // Check login restriction first (before biometric prompt)
      const restrictionTimestamp = await AsyncStorage.getItem('login_restriction_timestamp');
      if (restrictionTimestamp) {
        const restrictionTime = new Date(restrictionTimestamp).getTime();
        const currentTime = new Date().getTime();
        const timeElapsed = currentTime - restrictionTime;
        const twentyMinutes = 20 * 60 * 1000; // 20 minutes in milliseconds
        
        if (timeElapsed < twentyMinutes) {
          const remainingMinutes = Math.ceil((twentyMinutes - timeElapsed) / (60 * 1000));
          throw new Error(`You cannot log in again for ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}. Please wait before attempting to log in.`);
        } else {
          // Restriction period has passed, clear it
          await AsyncStorage.removeItem('login_restriction_timestamp');
        }
      }

      // Check if biometric is available
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!compatible || !enrolled) {
        throw new Error('Biometric authentication is not available');
      }

      // Authenticate with biometric
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        throw new Error('Biometric authentication failed');
      }

      // Retrieve stored credentials
      const email = await SecureStore.getItemAsync('biometric_email');
      const password = await SecureStore.getItemAsync('biometric_password');

      if (!email || !password) {
        throw new Error('No saved credentials found');
      }

      // Login with stored credentials (this will also check restriction again, but that's fine)
      await login(email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Biometric login failed');
    }
  };

  const hasBiometricEnabled = async (): Promise<boolean> => {
    try {
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        role: 'STUDENT' 
      });
      
      // Mark as new user to show tour guide
      await AsyncStorage.setItem('isNewUser', 'true');
      
      // If registration returns token and user, use them directly
      if (response.data?.access_token && response.data?.user) {
        const { access_token, user: userData } = response.data;
        await AsyncStorage.setItem('token', access_token);
        setUser(userData);
      } else {
        // Otherwise, automatically log in after registration
        await login(email, password);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      // Check if user clocked in before logging out (only for students)
      if (user?.role === 'STUDENT') {
        const hasClockedIn = await AsyncStorage.getItem('has_clocked_in');
        if (hasClockedIn === 'true') {
          // Set login restriction timestamp (20 minutes from now)
          const restrictionTimestamp = new Date().toISOString();
          await AsyncStorage.setItem('login_restriction_timestamp', restrictionTimestamp);
          // Clear the clock-in flag
          await AsyncStorage.removeItem('has_clocked_in');
        }
      }

      await AsyncStorage.removeItem('token');
      // Optionally clear biometric credentials on logout
      // await SecureStore.deleteItemAsync('biometric_email');
      // await SecureStore.deleteItemAsync('biometric_password');
      // await AsyncStorage.removeItem('biometric_enabled');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send reset email');
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await api.post('/auth/reset-password', { token, newPassword });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user,
    biometricAvailable,
    enableBiometric,
    loginWithBiometric,
    hasBiometricEnabled,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
