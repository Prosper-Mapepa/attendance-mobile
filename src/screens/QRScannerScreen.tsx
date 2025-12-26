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
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraReady, setCameraReady] = useState(false);
  
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
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canClockOut, setCanClockOut] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ sessionId: string; className: string; classSubject?: string } | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    requestCameraPermissionIfNeeded();
  }, []);

  // Timer for clock out countdown
  useEffect(() => {
    if (!isClockedIn || !sessionEndTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, sessionEndTime.getTime() - now.getTime());
      setTimeRemaining(remaining);
      
      // Allow clock out when session has ended (backend will validate minimum duration)
      setCanClockOut(remaining === 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [isClockedIn, sessionEndTime]);


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

  const requestLocationPermission = async () => {
    try {
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
          showSuccess('Location permission granted');
        } catch (locationError) {
          console.error('Location fetch error:', locationError);
          showError('Failed to get your location. Please try again.');
        }
      } else {
        showError('Location permission is required to scan QR codes');
      }
    } catch (error) {
      console.error('Permission request error:', error);
      showError('Failed to request location permission');
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
        if (responseData.data?.clockInTime) {
          setClockInTime(new Date(responseData.data.clockInTime));
        } else if (responseData.data?.timestamp) {
          setClockInTime(new Date(responseData.data.timestamp));
        } else {
          setClockInTime(new Date());
        }
        
        if (responseData.sessionEndTime) {
          setSessionEndTime(new Date(responseData.sessionEndTime));
        }
        
        // Extract session and class info from response
        const session = responseData.session || responseData.data?.session;
        if (session && session.class) {
          setSessionInfo({
            sessionId: session.id,
            className: session.class.name,
            classSubject: session.class.subject,
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
      console.error('Attendance marking error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // If clock-in was successful but there's an error, check if we should handle it gracefully
      // This can happen if the response was successful but there's a client-side error
      if (error.response?.status === 500 && error.response?.data?.isClockedIn) {
        // Server error but clock-in was successful - try to extract session info from error response
        const responseData = error.response.data;
        if (responseData.isClockedIn) {
          setIsClockedIn(true);
          if (responseData.sessionEndTime) {
            setSessionEndTime(new Date(responseData.sessionEndTime));
          }
          const session = responseData.session || responseData.data?.session;
          if (session && session.class) {
            setSessionInfo({
              sessionId: session.id,
              className: session.class.name,
              classSubject: session.class.subject,
            });
          }
          showSuccess('Clock in successful!');
          setScanned(true);
          setScanningEnabled(false);
          setLoading(false);
          setIsProcessing(false);
          return;
        }
      }
      
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

  const resetScanner = () => {
    setScanned(false);
    setScanningEnabled(true);
    setLoading(false);
    setIsProcessing(false);
    setShowSMSModal(false);
    setSmsCode('');
    setSecurityMessage('');
    setIsClockedIn(false);
    setSessionEndTime(null);
    setClockInTime(null);
    setTimeRemaining(0);
    setCanClockOut(false);
    setSessionInfo(null);
    setLastScannedCode('');
  };

  const handleClockOut = async () => {
    if (!canClockOut || !currentOTP) {
      showError('Please wait for class to end before clocking out');
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
      
      // Reset states
      setIsClockedIn(false);
      setSessionEndTime(null);
      setClockInTime(null);
      setTimeRemaining(0);
      setCanClockOut(false);
      setCurrentOTP('');
      setScanned(false);
      setScanningEnabled(true);
    } catch (error: any) {
      console.error('Clock out error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to clock out. Please try again.';
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
            <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
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
          {locationPermission && cameraPermission.granted && !isClockedIn && (
            <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing={facing}
              onBarcodeScanned={scanningEnabled && !scanned && !loading && !isProcessing && locationPermission ? ({ data }) => {
                // Only scan if data is different from last scan and not processing, and location is enabled
                if (data !== lastScannedCode && !isProcessing && locationPermission) {
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
            </View>
          )}
          
          {!cameraReady && locationPermission && cameraPermission.granted && !isClockedIn && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#8B0000" />
              <Text style={styles.loadingText}>Initializing camera...</Text>
            </View>
          )}
          
          {loading && locationPermission && !isClockedIn && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Processing attendance...</Text>
              <Text style={styles.loadingSubtext}>Please wait...</Text>
            </View>
          )}
          
          {scanned && !loading && locationPermission && !isClockedIn && (
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
            Location: {currentLocation ? '✓ Enabled' : '✗ Getting location...'} | Camera: {facing === 'back' ? 'Back' : 'Front'}
          </Text>
        )}
        {isClockedIn ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.clockOutButton,
                (!canClockOut || loading) && styles.disabledButton
              ]}
              onPress={handleClockOut}
              disabled={!canClockOut || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={20} color="#8B0000" style={{ marginRight: 8 }} />
                  <Text style={styles.clockOutButtonText}>Clock Out</Text>
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
                  style={[styles.flipButton, (loading || scanned || !locationPermission) && styles.disabledButton]}
                  onPress={toggleCameraFacing}
                  disabled={loading || scanned || !locationPermission}
                >
                  <Ionicons 
                    name={facing === 'back' ? 'camera-reverse' : 'camera'} 
                    size={24} 
                    color="#8B0000" 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.manualButton, (loading || scanned || !locationPermission) && styles.disabledButton]}
                  onPress={promptForOTP}
                  disabled={loading || scanned || !locationPermission}
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
});

export default QRScannerScreen;