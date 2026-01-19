import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../config/api';
import { collectDeviceFingerprint } from '../utils/deviceFingerprint';

const { width, height } = Dimensions.get('window');

const QRScannerScreen: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [scanned, setScanned] = useState(false);
  const [scanningEnabled, setScanningEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationLoading, setLocationLoading] = useState(true); // Track if location is being fetched
  const [locationReady, setLocationReady] = useState(false); // Track if location is fully ready
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraReady, setCameraReady] = useState(false);
  const [zoom, setZoom] = useState(0); // Camera zoom level (0-1)
  
  // Enhanced Security States
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');
  const [currentOTP, setCurrentOTP] = useState('');
  
  // Clock In/Out States
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<Date | null>(null); // Server time when session was created
  const [classDuration, setClassDuration] = useState<number | null>(null); // Class duration in minutes
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0); // Offset between server and client time (ms)
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canClockOut, setCanClockOut] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ sessionId: string; className: string; classSubject?: string } | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load persisted clock-in session on mount and when component becomes visible
  useEffect(() => {
    const initializeSession = async () => {
      console.log('QRScannerScreen mounted, loading persisted session...');
      await loadPersistedSession();
      requestLocationPermission();
      requestCameraPermissionIfNeeded();
    };
    
    initializeSession();
  }, []);

  // Also reload session when user becomes authenticated (after login)
  useEffect(() => {
    if (user) {
      console.log('User authenticated, checking for persisted session...');
      loadPersistedSession();
    }
  }, [user]);

  // Check location status on mount and when permission changes
  useEffect(() => {
    const checkLocationStatus = async () => {
      if (locationPermission) {
        setLocationLoading(true);
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setCurrentLocation(location);
          setLocationReady(true);
        } catch (error) {
          console.error('Location fetch error:', error);
          setLocationReady(false);
        } finally {
          setLocationLoading(false);
        }
      } else {
        setLocationReady(false);
        setLocationLoading(false);
      }
    };

    checkLocationStatus();
  }, [locationPermission]);

  // Save clock-in session to AsyncStorage whenever it changes
  useEffect(() => {
    if (isClockedIn && sessionEndTime && sessionInfo && currentOTP) {
      // Save even if sessionCreatedAt/classDuration are missing - timer will use sessionEndTime fallback
      saveSessionToStorage({
        isClockedIn: true,
        sessionEndTime: sessionEndTime.toISOString(),
        sessionCreatedAt: sessionCreatedAt?.toISOString() || sessionEndTime.toISOString(), // Fallback if missing
        classDuration: classDuration || 0, // Fallback if missing
        clockInTime: clockInTime?.toISOString() || new Date().toISOString(),
        sessionInfo,
        currentOTP,
      });
    } else if (!isClockedIn) {
      // Clear session from storage when not clocked in
      clearSessionFromStorage();
    }
  }, [isClockedIn, sessionEndTime, sessionCreatedAt, classDuration, clockInTime, sessionInfo, currentOTP]);

  // Sync server time periodically to keep countdown synchronized across devices
  // Only sync if we have sessionCreatedAt and classDuration for synchronized calculation
  useEffect(() => {
    if (!isClockedIn || !sessionCreatedAt || !classDuration) {
      // If we don't have these fields, timer will use sessionEndTime fallback
      return;
    }

    const syncServerTime = async () => {
      try {
        const startTime = Date.now();
        // Use fetch directly to avoid auth token requirement for health endpoint
        const response = await fetch('https://attendance-iq-api-production.up.railway.app/health');
        const endTime = Date.now();
        const data = await response.json();
        
        if (data.timestamp) {
          const serverTime = new Date(data.timestamp).getTime();
          const networkLatency = (endTime - startTime) / 2; // Approximate one-way latency
          const adjustedServerTime = serverTime + networkLatency;
          const clientTime = Date.now();
          const offset = adjustedServerTime - clientTime;
          
          setServerTimeOffset(offset);
          console.log('Server time synced. Offset:', offset, 'ms');
        }
      } catch (error) {
        console.error('Error syncing server time:', error);
        // Continue with client time if sync fails
      }
    };

    // Sync immediately
    syncServerTime();
    
    // Sync every 30 seconds to account for clock drift
    const syncInterval = setInterval(syncServerTime, 30000);

    return () => clearInterval(syncInterval);
  }, [isClockedIn, sessionCreatedAt, classDuration]);

  // Timer for clock out countdown - synchronized using server time
  useEffect(() => {
    if (!isClockedIn || !sessionEndTime) {
      console.log('Timer not started. isClockedIn:', isClockedIn, 'sessionEndTime:', sessionEndTime);
      return;
    }

    // Use synchronized calculation if we have sessionCreatedAt and classDuration
    // Otherwise fall back to sessionEndTime (less accurate but works)
    const calculateRemainingTime = () => {
      if (sessionCreatedAt && classDuration) {
        // Synchronized calculation using server time
        const clientTime = Date.now();
        const adjustedTime = clientTime + serverTimeOffset; // Adjust client time with server offset
        const sessionEndTimeMs = sessionCreatedAt.getTime() + (classDuration * 60 * 1000);
        const remaining = Math.max(0, sessionEndTimeMs - adjustedTime);
        return remaining;
      } else {
        // Fallback: use sessionEndTime directly (less synchronized but functional)
        const now = new Date();
        const remaining = Math.max(0, sessionEndTime.getTime() - now.getTime());
        return remaining;
      }
    };

    console.log('Starting timer. Session end time:', sessionEndTime.toISOString(), 
      sessionCreatedAt ? `Synchronized (created: ${sessionCreatedAt.toISOString()}, duration: ${classDuration}min)` : 'Using sessionEndTime fallback');
    
    // Calculate initial remaining time
    const initialRemaining = calculateRemainingTime();
    setTimeRemaining(initialRemaining);
    setCanClockOut(initialRemaining === 0);

    const interval = setInterval(() => {
      const remaining = calculateRemainingTime();
      setTimeRemaining(remaining);
      
      // Allow clock out when session has ended (remaining === 0)
      const sessionEnded = remaining === 0;
      setCanClockOut(sessionEnded);
    }, 1000);

    return () => {
      console.log('Clearing timer interval');
      clearInterval(interval);
    };
  }, [isClockedIn, sessionEndTime, sessionCreatedAt, classDuration, serverTimeOffset]);


  const requestCameraPermissionIfNeeded = async () => {
    if (cameraPermission && !cameraPermission.granted) {
      try {
        await requestCameraPermission();
      } catch (error) {
        console.error('Camera permission request error:', error);
        showError('Failed to request camera permission');
      }
    }
  };

  const handleRequestCameraPermission = async () => {
    try {
      const result = await requestCameraPermission();
      if (!result.granted) {
        showError('Camera permission is required to scan QR codes');
      }
    } catch (error) {
      console.error('Camera permission request error:', error);
      showError('Failed to request camera permission');
    }
  };

  // Save session to AsyncStorage
  const saveSessionToStorage = async (sessionData: {
    isClockedIn: boolean;
    sessionEndTime: string;
    sessionCreatedAt: string;
    classDuration: number;
    clockInTime: string;
    sessionInfo: { sessionId: string; className: string; classSubject?: string };
    currentOTP: string;
  }) => {
    try {
      await AsyncStorage.setItem('clocked_in_session', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving session to storage:', error);
    }
  };

  // Load session from AsyncStorage
  const loadPersistedSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem('clocked_in_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        
        // Check if session is still valid (not too old - e.g., not more than 24 hours)
        const clockInTime = new Date(parsed.clockInTime);
        const now = new Date();
        const hoursSinceClockIn = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
        
        // Restore session if it's less than 24 hours old AND user was clocked in
        // Keep the session even if class has ended (so user can still clock out)
        if (hoursSinceClockIn < 24 && parsed.isClockedIn) {
          const sessionEndTimeDate = new Date(parsed.sessionEndTime);
          const sessionCreatedAtDate = parsed.sessionCreatedAt ? new Date(parsed.sessionCreatedAt) : null;
          const sessionClassDuration = parsed.classDuration || null;
          
          // Restore all session state - IMPORTANT: Restore in correct order
          // First restore the data that doesn't trigger effects
          setSessionInfo(parsed.sessionInfo);
          setCurrentOTP(parsed.currentOTP);
          setClockInTime(new Date(parsed.clockInTime));
          
          // Restore session timing data for synchronized countdown
          if (sessionCreatedAtDate && sessionClassDuration) {
            setSessionCreatedAt(sessionCreatedAtDate);
            setClassDuration(sessionClassDuration);
          } else {
            // Fallback: calculate from sessionEndTime if sessionCreatedAt not available
            // This handles old sessions that don't have sessionCreatedAt
            if (sessionClassDuration) {
              const calculatedCreatedAt = new Date(sessionEndTimeDate.getTime() - (sessionClassDuration * 60 * 1000));
              setSessionCreatedAt(calculatedCreatedAt);
              setClassDuration(sessionClassDuration);
            }
          }
          
          // Then set sessionEndTime
          setSessionEndTime(sessionEndTimeDate);
          
          // Set initial time remaining (will be recalculated by timer with server sync)
          const remaining = Math.max(0, sessionEndTimeDate.getTime() - now.getTime());
          setTimeRemaining(remaining);
          setCanClockOut(remaining === 0);
          
          // Finally set isClockedIn to true - this triggers the timer useEffect
          // The timer will immediately start and update every second in real-time
          setIsClockedIn(true);
          
          console.log('Session restored. Session created at:', sessionCreatedAtDate?.toISOString(), 'Duration:', sessionClassDuration, 'minutes');
        } else {
          // Session is too old or invalid, clear it
          console.log('Session expired or invalid. Hours since clock-in:', hoursSinceClockIn, 'isClockedIn:', parsed.isClockedIn);
          await clearSessionFromStorage();
        }
      } else {
        console.log('No persisted session found in storage');
      }
    } catch (error) {
      console.error('Error loading session from storage:', error);
    }
  };

  // Clear session from AsyncStorage
  const clearSessionFromStorage = async () => {
    try {
      await AsyncStorage.removeItem('clocked_in_session');
      await AsyncStorage.removeItem('has_clocked_in');
    } catch (error) {
      console.error('Error clearing session from storage:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      setLocationLoading(true);
      setLocationReady(false);
      
      // Request location permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(locationStatus === 'granted');

      if (locationStatus === 'granted') {
        // Get current location
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setCurrentLocation(location);
          setLocationReady(true); // Location is fully ready
          showSuccess('Location permission granted');
        } catch (locationError) {
          console.error('Location fetch error:', locationError);
          setLocationReady(false);
          showError('Failed to get your location. Please try again.');
        }
      } else {
        setLocationReady(false);
        showError('Location permission is required to scan QR codes');
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setLocationReady(false);
      showError('Failed to request location permission');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleQRCodeScanned = async (data: string, smsCode?: string) => {
    // Prevent multiple scans of the same code or if already processing
    if (!smsCode && (data === lastScannedCode || isProcessing)) return;
    
    // Allow retry if SMS code is provided (for SMS verification flow)
    // Otherwise, prevent multiple scans
    if (!smsCode && (!scanningEnabled || scanned || loading || isProcessing)) return;
    
    // Immediately disable scanning and set processing flag to prevent multiple triggers
    if (!smsCode) {
      setScanningEnabled(false);
      setScanned(true);
      setLastScannedCode(data);
      setIsProcessing(true);
    }
    setLoading(true);
    let otp = '';

    try {
      if (!currentLocation) {
        showError('Location permission required for attendance marking');
        // Re-enable scanning on error
        setScanned(false);
        setScanningEnabled(true);
        setLoading(false);
        return;
      }

      // Parse QR code data - handle multiple formats
      console.log('QR Code scanned data:', data);
      
      otp = data.trim();
      
      // First, try to parse as JSON (new format from web app)
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.otp) {
          otp = jsonData.otp;
          console.log('Parsed OTP from JSON:', otp);
        }
      } catch (e) {
        // Not JSON, try other formats
        // Handle different QR code formats
        if (data.includes('OTP:')) {
          otp = data.split('OTP:')[1].trim();
        } else if (data.includes('otp:')) {
          otp = data.split('otp:')[1].trim();
        } else if (data.includes('=')) {
          // Handle URL format like "attendance?otp=123456"
          const urlParams = new URLSearchParams(data.split('?')[1] || '');
          otp = urlParams.get('otp') || urlParams.get('OTP') || '';
        }
        
        // Extract any 6-digit number from the string
        const digitMatch = otp.match(/\d{6}/);
        if (digitMatch) {
          otp = digitMatch[0];
        }
      }

      console.log('Extracted OTP:', otp);

      // Validate OTP format (should be 6 digits)
      if (!/^\d{6}$/.test(otp)) {
        showError('Invalid QR Code: Please scan a valid attendance QR code');
        // Re-enable scanning on error
        setScanned(false);
        setScanningEnabled(true);
        setLoading(false);
        return;
      }

      // Store the validated 6-digit OTP for clock-out
      setCurrentOTP(otp);

      // Collect device fingerprint data
      const deviceFingerprint = await collectDeviceFingerprint();

      // Mark attendance with scanned OTP and location + enhanced security
      const attendanceData = {
        otp: otp,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        ...deviceFingerprint,
        ...(smsCode && { smsVerificationCode: smsCode }),
      };

      console.log('Sending attendance data:', attendanceData);
      
      const response = await api.post('/attendance/mark', attendanceData);
      const responseData = response.data;

      // Handle clock in response
      if (responseData.isClockedIn) {
        setIsClockedIn(true);
        
        // Mark that student has clocked in (for login restriction after logout)
        await AsyncStorage.setItem('has_clocked_in', 'true');
        
        // Set clock in time from attendance data if available, otherwise use current time
        let clockInDate: Date;
        if (responseData.data?.clockInTime) {
          clockInDate = new Date(responseData.data.clockInTime);
        } else if (responseData.data?.timestamp) {
          clockInDate = new Date(responseData.data.timestamp);
        } else {
          clockInDate = new Date();
        }
        setClockInTime(clockInDate);
        
        let sessionEndDate: Date | null = null;
        if (responseData.sessionEndTime) {
          sessionEndDate = new Date(responseData.sessionEndTime);
          setSessionEndTime(sessionEndDate);
        }
        
        // Extract session and class info from response first
        const session = responseData.session || responseData.data?.session;
        let sessionInfoData: { sessionId: string; className: string; classSubject?: string } | null = null;
        if (session && session.class) {
          sessionInfoData = {
            sessionId: session.id,
            className: session.class.name,
            classSubject: session.class.subject,
          };
          setSessionInfo(sessionInfoData);
        }
        
        // Store session creation time and class duration for synchronized countdown
        // Try multiple sources: direct response fields, session object, or calculate from sessionEndTime
        let sessionCreatedAtDate: Date | null = null;
        let sessionClassDuration: number | null = null;
        
        if (responseData.sessionCreatedAt) {
          sessionCreatedAtDate = new Date(responseData.sessionCreatedAt);
          setSessionCreatedAt(sessionCreatedAtDate);
        } else if (session?.createdAt) {
          sessionCreatedAtDate = new Date(session.createdAt);
          setSessionCreatedAt(sessionCreatedAtDate);
        }
        
        if (responseData.classDuration) {
          sessionClassDuration = responseData.classDuration;
          setClassDuration(sessionClassDuration);
        } else if (session?.classDuration) {
          sessionClassDuration = session.classDuration;
          setClassDuration(sessionClassDuration);
        }
        
        // If we have sessionEndTime but not sessionCreatedAt/classDuration, try to fetch from backend
        if (sessionEndDate && sessionInfoData?.sessionId && (!sessionCreatedAtDate || !sessionClassDuration)) {
          try {
            const sessionsResponse = await api.get('/sessions');
            const sessions = sessionsResponse.data;
            const currentSession = Array.isArray(sessions) 
              ? sessions.find((s: any) => s.id === sessionInfoData?.sessionId)
              : null;
            
            if (currentSession) {
              if (currentSession.createdAt && !sessionCreatedAtDate) {
                sessionCreatedAtDate = new Date(currentSession.createdAt);
                setSessionCreatedAt(sessionCreatedAtDate);
              }
              if (currentSession.classDuration && !sessionClassDuration) {
                sessionClassDuration = currentSession.classDuration;
                setClassDuration(sessionClassDuration);
              }
            }
          } catch (fetchError) {
            console.error('Error fetching session data for sync:', fetchError);
            // Continue - timer will use sessionEndTime fallback
          }
        }
        
        // Save session to storage immediately (save even if sync fields are missing)
        if (sessionEndDate && sessionInfoData) {
          await saveSessionToStorage({
            isClockedIn: true,
            sessionEndTime: sessionEndDate.toISOString(),
            sessionCreatedAt: sessionCreatedAtDate?.toISOString() || sessionEndDate.toISOString(),
            classDuration: sessionClassDuration || 0,
            clockInTime: clockInDate.toISOString(),
            sessionInfo: sessionInfoData,
            currentOTP: otp,
          });
        }
        
        showSuccess(responseData.message || 'Clock in successful! Please wait for class to end before clocking out.');
      } else {
        showSuccess('Attendance marked successfully!');
      }
      
      // Keep scanning disabled on success - user needs to manually scan again
      setScanned(true);
      setScanningEnabled(false);
      setLoading(false);
      setIsProcessing(false);
      setShowSMSModal(false);
      setSmsCode('');
      setSecurityMessage('');
      setLastScannedCode(''); // Reset to allow scanning same code again later
    } catch (error: any) {
      // Check if clock-in was successful despite the error (backend might return 500 but with success data)
      const responseData = error.response?.data;
      const errorStatus = error.response?.status;
      const isSuccessfulClockIn = 
        responseData?.isClockedIn === true || 
        responseData?.data?.status === 'CLOCKED_IN' ||
        (responseData?.data && responseData.data.id); // If we have attendance data, it was created
      
      // For 500 errors, check if we can verify success by checking for attendance data
      // Sometimes the backend creates the record but fails on response serialization
      if (errorStatus === 500) {
        // Try to verify if clock-in was actually successful by checking the response data
        // Even if it's a 500 error, if we have session/attendance data, it likely succeeded
        const hasSessionData = responseData?.session || responseData?.data?.session;
        const hasAttendanceData = responseData?.data?.id || responseData?.data?.studentId;
        
        if (hasSessionData || hasAttendanceData || isSuccessfulClockIn) {
          // Clock-in was likely successful, treat as success
          console.log('Clock-in likely successful despite 500 error, processing success state...');
          
          setIsClockedIn(true);
          setCurrentOTP(otp);
          
          // Extract clock in time
          let clockInDate: Date;
          if (responseData?.data?.clockInTime) {
            clockInDate = new Date(responseData.data.clockInTime);
          } else if (responseData?.data?.timestamp) {
            clockInDate = new Date(responseData.data.timestamp);
          } else {
            clockInDate = new Date();
          }
          setClockInTime(clockInDate);
          
          // Extract session end time
          let sessionEndDate: Date | null = null;
          let sessionCreatedAtDate: Date | null = null;
          let sessionClassDuration: number | null = null;
          
          if (responseData?.sessionEndTime) {
            sessionEndDate = new Date(responseData.sessionEndTime);
            setSessionEndTime(sessionEndDate);
          }
          
          // Store session creation time and class duration for synchronized countdown
          if (responseData?.sessionCreatedAt) {
            sessionCreatedAtDate = new Date(responseData.sessionCreatedAt);
            setSessionCreatedAt(sessionCreatedAtDate);
          } else if (responseData?.session?.createdAt) {
            sessionCreatedAtDate = new Date(responseData.session.createdAt);
            setSessionCreatedAt(sessionCreatedAtDate);
          }
          
          if (responseData?.classDuration) {
            sessionClassDuration = responseData.classDuration;
            setClassDuration(sessionClassDuration);
          } else if (responseData?.session?.classDuration) {
            sessionClassDuration = responseData.session.classDuration;
            setClassDuration(sessionClassDuration);
          }
          
          // Extract session info
          const session = responseData?.session || responseData?.data?.session;
          let sessionInfoData: { sessionId: string; className: string; classSubject?: string } | null = null;
          if (session && session.class) {
            sessionInfoData = {
              sessionId: session.id,
              className: session.class.name,
              classSubject: session.class.subject,
            };
            setSessionInfo(sessionInfoData);
            
            // If we don't have sessionCreatedAt or classDuration, try to get from session object
            if (!sessionCreatedAtDate && session.createdAt) {
              sessionCreatedAtDate = new Date(session.createdAt);
              setSessionCreatedAt(sessionCreatedAtDate);
            }
            if (!sessionClassDuration && session.classDuration) {
              sessionClassDuration = session.classDuration;
              setClassDuration(sessionClassDuration);
            }
          }
          
          // Calculate session end time if not provided but we have creation time and duration
          if (!sessionEndDate && sessionCreatedAtDate && sessionClassDuration) {
            sessionEndDate = new Date(sessionCreatedAtDate.getTime() + sessionClassDuration * 60 * 1000);
            setSessionEndTime(sessionEndDate);
          }
          
          // If we still don't have sessionEndTime, try to fetch session data from backend
          if (!sessionEndDate && sessionInfoData?.sessionId) {
            try {
              // Fetch session details to get createdAt and classDuration
              const sessionsResponse = await api.get('/sessions');
              const sessions = sessionsResponse.data;
              const currentSession = Array.isArray(sessions) 
                ? sessions.find((s: any) => s.id === sessionInfoData?.sessionId)
                : null;
              
              if (currentSession) {
                if (currentSession.createdAt && !sessionCreatedAtDate) {
                  sessionCreatedAtDate = new Date(currentSession.createdAt);
                  setSessionCreatedAt(sessionCreatedAtDate);
                }
                if (currentSession.classDuration && !sessionClassDuration) {
                  sessionClassDuration = currentSession.classDuration;
                  setClassDuration(sessionClassDuration);
                }
                if (sessionCreatedAtDate && sessionClassDuration) {
                  sessionEndDate = new Date(sessionCreatedAtDate.getTime() + sessionClassDuration * 60 * 1000);
                  setSessionEndTime(sessionEndDate);
                }
              }
            } catch (fetchError) {
              console.error('Error fetching session data:', fetchError);
              // Continue without synchronized countdown - will use sessionEndTime if available
            }
          }
          
          // Save session to storage (save even if we don't have all sync fields - timer will use fallback)
          if (sessionEndDate && sessionInfoData) {
            await saveSessionToStorage({
              isClockedIn: true,
              sessionEndTime: sessionEndDate.toISOString(),
              sessionCreatedAt: sessionCreatedAtDate?.toISOString() || sessionEndDate.toISOString(), // Fallback to sessionEndTime if missing
              classDuration: sessionClassDuration || 0, // Fallback to 0 if missing
              clockInTime: clockInDate.toISOString(),
              sessionInfo: sessionInfoData,
              currentOTP: otp,
            });
          }
          
          // Mark that student has clocked in
          await AsyncStorage.setItem('has_clocked_in', 'true');
          
          showSuccess(responseData?.message || 'Clock in successful! Please wait for class to end before clocking out.');
          setScanned(true);
          setScanningEnabled(false);
          setLoading(false);
          setIsProcessing(false);
          setShowSMSModal(false);
          setSmsCode('');
          setSecurityMessage('');
          setLastScannedCode('');
          return;
        }
      }
      
      if (isSuccessfulClockIn) {
        // Clock-in was successful, handle it as success even if there's a 500 error
        console.log('Clock-in successful despite error response, processing success state...');
        
        setIsClockedIn(true);
        setCurrentOTP(otp);
        
        // Extract clock in time
        let clockInDate: Date;
        if (responseData.data?.clockInTime) {
          clockInDate = new Date(responseData.data.clockInTime);
        } else if (responseData.data?.timestamp) {
          clockInDate = new Date(responseData.data.timestamp);
        } else {
          clockInDate = new Date();
        }
        setClockInTime(clockInDate);
        
        // Extract session end time
        let sessionEndDate: Date | null = null;
        let sessionCreatedAtDate: Date | null = null;
        let sessionClassDuration: number | null = null;
        
        if (responseData.sessionEndTime) {
          sessionEndDate = new Date(responseData.sessionEndTime);
          setSessionEndTime(sessionEndDate);
        }
        
        // Store session creation time and class duration for synchronized countdown
        if (responseData.sessionCreatedAt) {
          sessionCreatedAtDate = new Date(responseData.sessionCreatedAt);
          setSessionCreatedAt(sessionCreatedAtDate);
        } else if (responseData.session?.createdAt) {
          sessionCreatedAtDate = new Date(responseData.session.createdAt);
          setSessionCreatedAt(sessionCreatedAtDate);
        }
        
        if (responseData.classDuration) {
          sessionClassDuration = responseData.classDuration;
          setClassDuration(sessionClassDuration);
        } else if (responseData.session?.classDuration) {
          sessionClassDuration = responseData.session.classDuration;
          setClassDuration(sessionClassDuration);
        }
        
        // Calculate session end time if not provided but we have creation time and duration
        if (!sessionEndDate && sessionCreatedAtDate && sessionClassDuration) {
          sessionEndDate = new Date(sessionCreatedAtDate.getTime() + sessionClassDuration * 60 * 1000);
          setSessionEndTime(sessionEndDate);
        }
        
        // Extract session info
        const session = responseData.session || responseData.data?.session;
        let sessionInfoData: { sessionId: string; className: string; classSubject?: string } | null = null;
        if (session && session.class) {
          sessionInfoData = {
            sessionId: session.id,
            className: session.class.name,
            classSubject: session.class.subject,
          };
          setSessionInfo(sessionInfoData);
        }
        
        // Save session to storage
        if (sessionEndDate && sessionInfoData && sessionCreatedAtDate && sessionClassDuration) {
          await saveSessionToStorage({
            isClockedIn: true,
            sessionEndTime: sessionEndDate.toISOString(),
            sessionCreatedAt: sessionCreatedAtDate.toISOString(),
            classDuration: sessionClassDuration,
            clockInTime: clockInDate.toISOString(),
            sessionInfo: sessionInfoData,
            currentOTP: otp,
          });
        }
        
        // Mark that student has clocked in
        await AsyncStorage.setItem('has_clocked_in', 'true');
        
        showSuccess(responseData.message || 'Clock in successful! Please wait for class to end before clocking out.');
        setScanned(true);
        setScanningEnabled(false);
        setLoading(false);
        setIsProcessing(false);
        setShowSMSModal(false);
        setSmsCode('');
        setSecurityMessage('');
        setLastScannedCode('');
        return;
      }
      
      // If not a successful clock-in, handle as error
      console.error('Attendance marking error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to mark attendance. Please try again.';
      
      // Check if SMS verification is required
      if (errorMessage.includes('SMS code sent') || errorMessage.includes('verification required')) {
        setSecurityMessage(errorMessage);
        setShowSMSModal(true);
        setLoading(false);
        // Keep scanning disabled while SMS modal is open
        return;
      }

      showError(errorMessage);
      // Keep scan as complete but allow retry - user needs to tap "Scan Again"
      setScanned(true);
      setScanningEnabled(false); // Keep disabled until user taps "Scan Again"
      setLastScannedCode(''); // Reset to allow scanning same code again
      setIsProcessing(false); // Reset processing flag
    } finally {
      setLoading(false);
      setIsProcessing(false); // Reset processing flag
    }
  };

  const resetScanner = async () => {
    setScanned(false);
    setScanningEnabled(true);
    setLoading(false);
    setIsProcessing(false);
    setShowSMSModal(false);
    setSmsCode('');
    setSecurityMessage('');
    setIsClockedIn(false);
    setSessionEndTime(null);
    setSessionCreatedAt(null);
    setClassDuration(null);
    setServerTimeOffset(0);
    setClockInTime(null);
    setTimeRemaining(0);
    setCanClockOut(false);
    setSessionInfo(null);
    setLastScannedCode('');
    setCurrentOTP('');
    
    // Clear persisted session
    await clearSessionFromStorage();
  };

  const handleClockOut = async () => {
    // Allow clock out even if session hasn't ended yet (backend will handle validation)
    // But prefer to allow after session end time or if canClockOut is true
    if (!currentOTP) {
      showError('Session data not found. Please clock in again.');
      return;
    }

    if (!currentLocation) {
      showError('Location permission required for clock out');
      return;
    }

    setLoading(true);
    try {
      const clockOutData = {
        otp: currentOTP,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      const response = await api.post('/attendance/clock-out', clockOutData);
      showSuccess(`Clock out successful! You attended for ${response.data.timeElapsed} minutes.`);
      
      // Reset states and clear storage
      setIsClockedIn(false);
      setSessionEndTime(null);
      setSessionCreatedAt(null);
      setClassDuration(null);
      setServerTimeOffset(0);
      setClockInTime(null);
      setTimeRemaining(0);
      setCanClockOut(false);
      setCurrentOTP('');
      setScanned(false);
      setScanningEnabled(true);
      setSessionInfo(null);
      
      // Clear persisted session
      await clearSessionFromStorage();
    } catch (error: any) {
      console.error('Clock out error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to clock out. Please try again.';
      
      // If the error is about session not found or expired, clear the local session
      if (error.response?.status === 404 || errorMessage.includes('not found') || errorMessage.includes('expired')) {
        setIsClockedIn(false);
        setSessionEndTime(null);
        setSessionCreatedAt(null);
        setClassDuration(null);
        setServerTimeOffset(0);
        setClockInTime(null);
        setTimeRemaining(0);
        setCanClockOut(false);
        setCurrentOTP('');
        setSessionInfo(null);
        await clearSessionFromStorage();
      }
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleManualOTPEntry = async (otp: string) => {
    await handleQRCodeScanned(otp);
  };


  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(1, prev + 0.1)); // Increase zoom by 0.1, max 1
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0, prev - 0.1)); // Decrease zoom by 0.1, min 0
  };

  const promptForOTP = () => {
    setShowOTPModal(true);
  };

  const handleOTPSubmit = () => {
    if (otpInput && otpInput.trim()) {
      const trimmedOTP = otpInput.trim();
      if (/^\d{6}$/.test(trimmedOTP)) {
        setShowOTPModal(false);
        setOtpInput('');
        handleManualOTPEntry(trimmedOTP);
      } else {
        showError('Please enter a valid 6-digit OTP code');
      }
    } else {
      showError('Please enter a valid OTP code');
    }
  };

  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={[styles.errorText, { marginTop: 16 }]}>
            Checking camera permissions...
          </Text>
        </View>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Camera Permission Required</Text>
          <Text style={styles.errorText}>
            Please grant camera permission to scan QR codes for attendance.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={handleRequestCameraPermission}>
            <Text style={styles.permissionButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (locationPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Location Permission Required</Text>
          <Text style={styles.errorText}>
            Please grant location permission to verify your classroom location.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestLocationPermission}>
            <Text style={styles.permissionButtonText}>Grant Location Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#A00000', '#8B0000', '#6B0000']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* <View style={styles.header}>
        {isClockedIn && sessionInfo ? (
          <View style={styles.classInfoContainer}>
            <Text style={styles.className}>{sessionInfo.className}</Text>
            {sessionInfo.classSubject && (
              <Text style={styles.classSubject}>{sessionInfo.classSubject}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.subtitle}>
            Scan QR code from your Instructor's screen to clock in
          </Text>
        )}
      </View> */}

      {isClockedIn ? (
        /* Clocked In View - Clean Design */
        <View style={styles.clockedInContainer}>
          <View style={styles.clockedInContent}>
            {/* Clock Out Timer */}
            {sessionEndTime && (
              <View style={styles.timerContainer}>
                <Text style={styles.timerValue}>
                  {timeRemaining > 0 
                    ? formatTimeRemaining(timeRemaining)
                    : '00:00'
                  }
                </Text>
                <Text style={styles.timerLabel}>
                  {timeRemaining > 0 
                    ? 'Time remaining'
                    : 'Class ended'
                  }
                </Text>
              </View>
            )}

            {/* Clock In Time */}
            {clockInTime && (
              <Text style={styles.clockInTimeValue}>
                Clocked in at {clockInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
        </View>
      ) : (
        /* QR Scanner View */
        <View style={styles.scannerContainer}>
          {!locationPermission && (
            <View style={styles.centerContent}>
              <Ionicons name="location-outline" size={64} color="#FFD700" />
              <Text style={styles.errorTitle}>Location Permission Required</Text>
              <Text style={styles.errorText}>
                Please enable location permission to scan QR codes for attendance.
              </Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestLocationPermission}>
                <Text style={styles.permissionButtonText}>Enable Location</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Show loader while location is being fetched */}
          {locationPermission && locationLoading && !locationReady && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Getting your location...</Text>
              <Text style={styles.loadingSubtext}>Please wait while we find your location</Text>
            </View>
          )}
          
          {/* Only show camera when location is fully ready */}
          {locationPermission && locationReady && !locationLoading && cameraPermission.granted && !isClockedIn && (
            <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing={facing}
              zoom={zoom}
              onBarcodeScanned={scanningEnabled && !scanned && !loading && !isProcessing && locationReady && currentLocation ? ({ data }) => {
                // Only scan if data is different from last scan and not processing, and location is ready
                if (data !== lastScannedCode && !isProcessing && locationReady && currentLocation) {
                  handleQRCodeScanned(data);
                }
              } : undefined}
              onCameraReady={() => {
                setCameraReady(true);
              }}
              enableTorch={false}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              />
              <View style={styles.scannerOverlay}>
                {!scanned && !loading && (
                  <>
                    <View style={styles.scannerFrame}>
                      <View style={styles.corner} />
                      <View style={[styles.corner, styles.topRight]} />
                      <View style={[styles.corner, styles.bottomLeft]} />
                      <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    <Text style={styles.scannerText}>Position QR code within the frame</Text>
                  </>
                )}
                {scanned && !loading && (
                  <View style={styles.scanCompleteOverlay}>
                    <Ionicons name="checkmark-circle" size={64} color="#FFD700" />
                    <Text style={styles.scanCompleteText}>Scan Complete</Text>
                    <Text style={styles.scanAgainPrompt}>Tap "Scan Again" to scan another code</Text>
                  </View>
                )}
              </View>
              
              {/* Zoom Controls */}
              <View style={styles.zoomControls}>
                <TouchableOpacity
                  style={[styles.zoomButton, zoom <= 0 && styles.zoomButtonDisabled]}
                  onPress={handleZoomOut}
                  disabled={zoom <= 0}
                >
                  <Ionicons name="remove-outline" size={24} color={zoom <= 0 ? "#999" : "#fff"} />
                </TouchableOpacity>
                <View style={styles.zoomIndicator}>
                  <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
                </View>
                <TouchableOpacity
                  style={[styles.zoomButton, zoom >= 1 && styles.zoomButtonDisabled]}
                  onPress={handleZoomIn}
                  disabled={zoom >= 1}
                >
                  <Ionicons name="add-outline" size={24} color={zoom >= 1 ? "#999" : "#fff"} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {!cameraReady && locationReady && !locationLoading && locationPermission && cameraPermission.granted && !isClockedIn && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#8B0000" />
              <Text style={styles.loadingText}>Initializing camera...</Text>
            </View>
          )}
          
          {loading && locationReady && locationPermission && !isClockedIn && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Processing attendance...</Text>
              <Text style={styles.loadingSubtext}>Please wait...</Text>
            </View>
          )}
          
          {scanned && !loading && locationReady && locationPermission && !isClockedIn && (
            <View style={styles.scanCompleteMessage}>
              <Text style={styles.scanCompleteMessageText}>
                Scan completed. Use "Scan Again" to scan another QR code.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* OTP Entry Modal */}
      <Modal
        visible={showOTPModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowOTPModal(false);
          setOtpInput('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter OTP Code</Text>
            <Text style={styles.modalMessage}>
              Please enter the OTP code from your Instructor's QR code:
            </Text>
            
            <TextInput
              style={styles.smsInput}
              placeholder="Enter 6-digit OTP code"
              value={otpInput}
              onChangeText={setOtpInput}
              keyboardType="numeric"
              maxLength={6}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowOTPModal(false);
                  setOtpInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleOTPSubmit}
                disabled={otpInput.length !== 6}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SMS Verification Modal */}
      <Modal
        visible={showSMSModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSMSModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Additional Verification Required</Text>
            <Text style={styles.modalMessage}>{securityMessage}</Text>
            
            <TextInput
              style={styles.smsInput}
              placeholder="Enter 6-digit SMS code"
              value={smsCode}
              onChangeText={setSmsCode}
              keyboardType="numeric"
              maxLength={6}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowSMSModal(false);
                  setSmsCode('');
                  setSecurityMessage('');
                  resetScanner();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={() => handleQRCodeScanned(currentOTP, smsCode)}
                disabled={smsCode.length !== 6}
              >
                <Text style={styles.submitButtonText}>Verify & Mark Attendance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        {!isClockedIn && locationPermission && (
          <Text style={styles.footerText}>
            Location: {locationReady && currentLocation ? '✓ Enabled' : locationLoading ? '⏳ Getting location...' : '✗ Not found'} | Camera: {facing === 'back' ? 'Back' : 'Front'}
          </Text>
        )}
        {isClockedIn ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.clockOutButton,
                (loading || (!canClockOut && timeRemaining > 0)) && styles.disabledButton
              ]}
              onPress={handleClockOut}
              disabled={loading || (!canClockOut && timeRemaining > 0)}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons 
                    name="log-out-outline" 
                    size={20} 
                    color={(!canClockOut && timeRemaining > 0) ? "#999" : "#8B0000"} 
                    style={{ marginRight: 8 }} 
                  />
                  <Text style={[
                    styles.clockOutButtonText,
                    (!canClockOut && timeRemaining > 0) && styles.disabledButtonText
                  ]}>
                    {canClockOut || timeRemaining === 0 ? 'Clock Out' : 'Clock Out (Class in progress)'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            {!locationPermission ? (
              <TouchableOpacity
                style={[styles.permissionButton, { flex: 1, marginHorizontal: 0 }]}
                onPress={requestLocationPermission}
              >
                <Ionicons name="location" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.permissionButtonText}>Enable Location to Scan</Text>
              </TouchableOpacity>
            ) : scanned && !loading ? (
              <TouchableOpacity
                style={[styles.manualButton, { flex: 1, marginLeft: 0, marginRight: 0 }]}
                onPress={resetScanner}
              >
                <Text style={styles.manualButtonText}>Scan Again</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.flipButton, (loading || scanned || !locationReady) && styles.disabledButton]}
                  onPress={toggleCameraFacing}
                  disabled={loading || scanned || !locationReady}
                >
                  <Ionicons 
                    name={facing === 'back' ? 'camera-reverse' : 'camera'} 
                    size={24} 
                    color="#8B0000" 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.manualButton, (loading || scanned || !locationReady) && styles.disabledButton]}
                  onPress={promptForOTP}
                  disabled={loading || scanned || !locationReady}
                >
                  <Text style={styles.manualButtonText}>Use OTP</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B0000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
    
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#8B0000',
    borderWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanCompleteOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scanCompleteText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  scanAgainPrompt: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  scanCompleteMessage: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 16,
    borderRadius: 12,
    margin: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  scanCompleteMessageText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  footerText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  flipButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  manualButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  manualButtonText: {
    color: '#8B0000',
    fontSize: 18,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0.1,
  },
  clockStatusContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  clockStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  clockOutButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  clockOutButtonText: {
    color: '#8B0000',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButtonText: {
    color: '#8B0000',
    opacity: 0.6,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // SMS Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8F1A27',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  smsInput: {
    borderWidth: 2,
    borderColor: '#8F1A27',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    width: '100%',
    marginBottom: 20,
    letterSpacing: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#8F1A27',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Clocked In View Styles
  clockedInContainer: {
    flex: 1,
  },
  clockedInContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 40,
  },
  classInfoContainer: {
    alignItems: 'flex-start',
  },
  className: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  classSubject: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '400',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    marginTop: 12,
  },
  timerValue: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFD700',
    fontFamily: 'monospace',
    letterSpacing: 3,
  },
  clockInTimeValue: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  // Zoom Controls
  zoomControls: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -60 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  zoomButtonDisabled: {
    opacity: 0.3,
  },
  zoomIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    marginVertical: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  zoomText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default QRScannerScreen;