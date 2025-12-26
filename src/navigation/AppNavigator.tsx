import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useTour } from '../contexts/TourContext';
import { useResponsive } from '../utils/useResponsive';

// Screens
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import AttendanceHistoryScreen from '../screens/AttendanceHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

// Components
import TourGuide from '../components/TourGuide';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom Tab Bar Component for better tablet support
const CustomTabBar = (props: any) => {
  return <BottomTabBar {...props} />;
};

const MainTabs: React.FC = () => {
  const responsive = useResponsive();
  
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'QR Scanner') {
            iconName = focused ? 'qr-code' : 'qr-code-outline';
          } else if (route.name === 'Attendance') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B0000', // CMU Maroon
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          paddingBottom: responsive.isTablet ? 8 : 5,
          paddingTop: responsive.isTablet ? 8 : 6,
          height: responsive.isTablet ? 75 : 120,
        },
        tabBarItemStyle: {
          paddingVertical: responsive.isTablet ? 4 : 0,
        },
        tabBarLabelStyle: {
          fontSize: responsive.isTablet ? 13 : 12,
          marginTop: responsive.isTablet ? 2 : 4,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginTop: responsive.isTablet ? 4 : 0,
        },
        headerStyle: {
          backgroundColor: '#8B0000',
        },
        headerTintColor: '#fff',
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 24,
          paddingBottom: 8,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'AttendIQ',
        }}
      />
      <Tab.Screen
        name="QR Scanner"
        component={QRScannerScreen}
        options={{
          title: 'QR Scanner',
          headerTitle: 'Scan QR Code',
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          title: 'Info',
          headerTitle: 'How to Mark Attendance',
        }}
      />
      <Tab.Screen
        name="History"
        component={AttendanceHistoryScreen}
        options={{
          title: 'History',
          headerTitle: 'Attendance History',
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { showTour, setShowTour } = useTour();

  const checkTourStatus = useCallback(async () => {
    if (isAuthenticated && !loading) {
      try {
        const isNewUser = await AsyncStorage.getItem('isNewUser');
        
        // Show tour by default for new users after registration
        if (isNewUser === 'true') {
          // Remove the new user flag first to prevent re-triggering
          await AsyncStorage.removeItem('isNewUser');
          
          // Use requestAnimationFrame for smoother transition
          requestAnimationFrame(() => {
            // Small delay to ensure UI is ready and navigation is complete
            setTimeout(() => {
              setShowTour(true);
            }, 300);
          });
        }
      } catch (error) {
        console.error('Error checking tour status:', error);
      }
    }
  }, [isAuthenticated, loading, setShowTour]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Add a small delay to ensure navigation has completed
      const timer = setTimeout(() => {
      checkTourStatus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, isAuthenticated, checkTourStatus]);

  const handleTourComplete = () => {
    setShowTour(false);
  };

  // Handle deep linking for password reset (optional - NavigationContainer handles it)
  // The linking config in NavigationContainer will handle deep links automatically

  if (loading) {
    return null; // You can add a loading screen here
  }

  return (
    <NavigationContainer
      linking={{
        prefixes: ['attendiq://', 'https://attendiq.app'],
        config: {
          screens: {
            Login: 'login',
            ForgotPassword: 'forgot-password',
            ResetPassword: {
              path: 'reset-password',
              parse: {
                token: (token: string) => token,
              },
            },
            VerifyEmail: {
              path: 'verify-email',
              parse: {
                token: (token: string) => token,
              },
            },
          },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#8B0000' },
                headerTintColor: '#fff',
                headerTitle: 'Profile',
                headerTitleAlign: 'left',
              }}
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#8B0000' },
                headerTintColor: '#fff',
                headerTitle: 'Privacy Policy',
                headerTitleAlign: 'left',
              }}
            />
          </>
        ) : (
          <>
          <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen 
              name="ResetPassword" 
              component={ResetPasswordScreen}
              options={({ route }: any) => ({
                title: 'Reset Password',
              })}
            />
          </>
        )}
      </Stack.Navigator>
      {isAuthenticated && (
        <TourGuide visible={showTour} onComplete={handleTourComplete} />
      )}
    </NavigationContainer>
  );
};


export default AppNavigator;
