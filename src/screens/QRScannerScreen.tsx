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
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
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
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  
  // Enhanced Security States
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');
  const [currentOTP, setCurrentOTP] = useState('');

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      // Request location permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(locationStatus === 'granted');

      if (locationStatus === 'granted') {
        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error('Permission request error:', error);
      showError('Failed to request location permission');
    }
  };

  const handleQRCodeScanned = async (data: string, smsCode?: string) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);
    let otp = '';

    try {
      if (!currentLocation) {
        showError('Location permission required for attendance marking');
        setScanned(false);
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

      setCurrentOTP(otp);
      
      // Extract any 6-digit number from the string
      const digitMatch = otp.match(/\d{6}/);
      if (digitMatch) {
        otp = digitMatch[0];
      }

      console.log('Extracted OTP:', otp);

      // Validate OTP format (should be 6 digits)
      if (!/^\d{6}$/.test(otp)) {
        showError('Invalid QR Code: Please scan a valid attendance QR code');
        setScanned(false);
        setLoading(false);
        return;
      }

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
      
      await api.post('/attendance/mark', attendanceData);

      showSuccess('Attendance marked successfully!');
      setScanned(false);
      setLoading(false);
      setShowSMSModal(false);
      setSmsCode('');
      setSecurityMessage('');
    } catch (error: any) {
      console.error('Attendance marking error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to mark attendance. Please try again.';
      
      // Check if SMS verification is required
      if (errorMessage.includes('SMS code sent') || errorMessage.includes('verification required')) {
        setSecurityMessage(errorMessage);
        setShowSMSModal(true);
        setLoading(false);
        return;
      }

      showError(errorMessage);
      setScanned(false);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.errorTitle}>Camera Permission Required</Text>
          <Text style={styles.errorText}>
            Please grant camera permission to scan QR codes for attendance.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Scanner</Text>
        <Text style={styles.subtitle}>
          Scan QR code from your teacher's screen
        </Text>
      </View>

      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={scanned ? undefined : ({ data }) => handleQRCodeScanned(data)}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame}>
              <View style={styles.corner} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.scannerText}>Position QR code within the frame</Text>
          </View>
        </CameraView>
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#8B0000" />
            <Text style={styles.loadingText}>Processing attendance...</Text>
          </View>
        )}
      </View>

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
              Please enter the OTP code from your teacher's QR code:
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
                  setScanned(false);
                  setLoading(false);
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
        <Text style={styles.footerText}>
          Location: {currentLocation ? '✓ Enabled' : '✗ Disabled'} | Camera: {facing === 'back' ? 'Back' : 'Front'}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.flipButton, (loading || scanned) && styles.disabledButton]}
            onPress={toggleCameraFacing}
            disabled={loading || scanned}
          >
            <Ionicons 
              name={facing === 'back' ? 'camera-reverse' : 'camera'} 
              size={24} 
              color="#8B0000" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.manualButton, (loading || scanned) && styles.disabledButton]}
            onPress={promptForOTP}
            disabled={loading || scanned}
          >
            <Text style={styles.manualButtonText}>Use OTP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#8B0000',
    alignItems: 'center',
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
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    backgroundColor: '#8B0000',
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 20,
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
});

export default QRScannerScreen;