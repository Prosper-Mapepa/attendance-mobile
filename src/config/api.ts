import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the backend API
const API_BASE_URL = 'https://attendance-iq-api-production.up.railway.app';
// const API_BASE_URL = 'http://192.168.0.129:3001';


// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      // You can add navigation to login screen here
    }
    return Promise.reject(error);
  }
);

export default api;
