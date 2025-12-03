import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useTour } from '../contexts/TourContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import AttendanceHistoryScreen from '../screens/AttendanceHistoryScreen';

// Components
import TourGuide from '../components/TourGuide';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
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
          paddingBottom: 5,
          paddingTop: 5,
          height: 100,
        },
        headerStyle: {
          backgroundColor: '#8B0000',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
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
  const [checkingTour, setCheckingTour] = useState(true);

  useEffect(() => {
    checkTourStatus();
  }, [isAuthenticated]);

  const checkTourStatus = async () => {
    if (isAuthenticated) {
      try {
        const hasSeenTour = await AsyncStorage.getItem('hasSeenTour');
        const isNewUser = await AsyncStorage.getItem('isNewUser');
        
        // Show tour by default for new users after registration
        if (isNewUser === 'true') {
          // Small delay to ensure UI is ready
          setTimeout(() => {
            setShowTour(true);
          }, 500);
          // Remove the new user flag
          await AsyncStorage.removeItem('isNewUser');
        }
      } catch (error) {
        console.error('Error checking tour status:', error);
      } finally {
        setCheckingTour(false);
      }
    } else {
      setCheckingTour(false);
    }
  };

  const handleTourComplete = () => {
    setShowTour(false);
  };

  if (loading || checkingTour) {
    return null; // You can add a loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
      {isAuthenticated && (
        <TourGuide visible={showTour} onComplete={handleTourComplete} />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
