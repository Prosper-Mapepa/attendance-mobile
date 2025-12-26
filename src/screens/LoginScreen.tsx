import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../../Logo';

const LoginScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'fair' | 'good' | 'strong'>('weak');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const { login, register, biometricAvailable, enableBiometric, loginWithBiometric, hasBiometricEnabled } = useAuth();
  const { showSuccess, showError, showConfirm } = useToast();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      showConfirm(
        'Are you sure you want to exit AttendIQ?',
        () => BackHandler.exitApp(),
        'Exit App',
        'Exit',
        'Cancel'
      );
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [showConfirm]);

  useEffect(() => {
    // Check if biometric is enabled
    const checkBiometric = async () => {
      if (biometricAvailable) {
        const enabled = await hasBiometricEnabled();
        setBiometricEnabled(enabled);
      }
    };
    checkBiometric();
  }, [biometricAvailable, hasBiometricEnabled]);

  const validateEmail = (email: string): { isValid: boolean; error?: string } => {
    if (!email.trim()) {
      return { isValid: false, error: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  };

  const validateName = (name: string): { isValid: boolean; error?: string } => {
    if (!name.trim()) {
      return { isValid: false, error: 'Name is required' };
    }
    if (name.trim().length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters' };
    }
    if (name.trim().length > 50) {
      return { isValid: false, error: 'Name must be less than 50 characters' };
    }
    // Name should only contain letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name.trim())) {
      return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }
    return { isValid: true };
  };

  const calculatePasswordStrength = (password: string): 'weak' | 'fair' | 'good' | 'strong' => {
    if (password.length === 0) return 'weak';
    
    // Character variety checks
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    
    // Strong password requires ALL character types and at least 8 characters
    if (hasLowercase && hasUppercase && hasNumbers && hasSpecial && password.length >= 8) {
      return 'strong';
    }
    
    // Calculate score for other strength levels
    let score = 0;
    
    // Length checks
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (hasLowercase) score += 1;
    if (hasUppercase) score += 1;
    if (hasNumbers) score += 1;
    if (hasSpecial) score += 1;
    
    // Determine strength level (but never return 'strong' here - only above)
    if (score <= 2) return 'weak';
    if (score <= 4) return 'fair';
    return 'good';
  };

  const getPasswordRequirements = (password: string): { met: boolean; text: string }[] => {
    return [
      {
        met: password.length >= 6,
        text: 'At least 6 characters',
      },
      {
        met: /[a-z]/.test(password),
        text: 'One lowercase letter',
      },
      {
        met: /[A-Z]/.test(password),
        text: 'One uppercase letter',
      },
      {
        met: /[0-9]/.test(password),
        text: 'One number',
      },
      {
        met: /[^a-zA-Z0-9]/.test(password),
        text: 'One special character',
      },
    ];
  };

  const getPasswordStrengthGradient = (strength: 'weak' | 'fair' | 'good' | 'strong'): string[] => {
    switch (strength) {
      case 'weak': return ['#FF6B6B', '#FF8E8E']; // Light red/pink gradient
      case 'fair': return ['#FF8C00', '#FFA500']; // Orange gradient
      case 'good': return ['#FFD700', '#FFED4E']; // Gold gradient
      case 'strong': return ['#8B0000', '#A00000']; // Maroon gradient
      default: return ['#FF6B6B', '#FF8E8E'];
    }
  };

  const getPasswordStrengthColor = (strength: 'weak' | 'fair' | 'good' | 'strong'): string => {
    switch (strength) {
      case 'weak': return '#FF6B6B'; // Light red/pink
      case 'fair': return '#FF8C00'; // Orange
      case 'good': return '#FFD700'; // Gold
      case 'strong': return '#8B0000'; // Theme maroon
      default: return '#FF6B6B';
    }
  };

  const getPasswordStrengthText = (strength: 'weak' | 'fair' | 'good' | 'strong'): string => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'fair': return 'Fair';
      case 'good': return 'Good';
      case 'strong': return 'Strong';
      default: return 'Weak';
    }
  };

  const validatePassword = (password: string): { isValid: boolean; error?: string } => {
    if (password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters' };
    }
    if (password.length > 50) {
      return { isValid: false, error: 'Password must be less than 50 characters' };
    }
    
    const strength = calculatePasswordStrength(password);
    if (strength === 'weak') {
      return { 
        isValid: false, 
        error: 'Password is too weak. Use uppercase, lowercase, numbers, and special characters.' 
      };
    }
    
    return { isValid: true };
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // Always calculate password strength for both login and registration
    setPasswordStrength(calculatePasswordStrength(text));
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showError('Please fill in all fields');
      return;
    }

    const emailValidation = validateEmail(email.trim());
    if (!emailValidation.isValid) {
      showError(emailValidation.error || 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      
      // Offer to enable biometric after successful login
      if (biometricAvailable && !biometricEnabled) {
        setTimeout(() => {
          showConfirm(
            'Enable biometric login?\n\n' +
            'DISCLAIMER:\n\n' +
            '• We do NOT collect or store your biometric data\n' +
            '• Uses Face ID, Touch ID, or fingerprint (device dependent)\n' +
            '• Your credentials are stored securely on this device only\n' +
            '• You can disable this feature anytime\n' +
            '• This feature is for faster login and enhanced security',
            async () => {
              try {
                await enableBiometric(email.trim(), password);
                setBiometricEnabled(true);
                showSuccess('Biometric login enabled!');
              } catch (error: any) {
                showError('Failed to enable biometric login');
              }
            },
            'Enable Biometric Login',
            'Enable',
            'Not Now'
          );
        }, 500);
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      await loginWithBiometric();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      showError('Please fill in all fields');
      return;
    }

    const nameValidation = validateName(name.trim());
    if (!nameValidation.isValid) {
      showError(nameValidation.error || 'Invalid name');
      return;
    }

    const emailValidation = validateEmail(email.trim());
    if (!emailValidation.isValid) {
      showError(emailValidation.error || 'Please enter a valid email address');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      showError(passwordValidation.error || 'Invalid password');
      return;
    }

    // Check password strength for registration - must be strong
    const strength = calculatePasswordStrength(password);
    if (strength !== 'strong') {
      showError('Password must be strong. Please use uppercase, lowercase, numbers, and special characters.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      // User will be automatically redirected to dashboard via navigation
      // Show success message after a brief delay to allow navigation to complete
      setTimeout(() => {
        showSuccess('Account created successfully! Welcome to AttendIQ.');
      }, 400);
    } catch (error: any) {
      showError(error.message);
      setLoading(false);
    }
    // Note: Don't set loading to false on success - let navigation handle it
    // The loading state will be reset when the component unmounts or navigation completes
  };

  return (
    <LinearGradient
      colors={[
        '#A00000',  // Deep dark red
        '#8B0000',  // Medium dark red
        '#8B0000',  // Maroon (brand)
        '#8B0000',  // Bright maroon
        '#6B0000'   // Back to maroon
      ]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.3, 0.5, 0.7, 1]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}> 
            <View style={styles.logoContainer}>
              <Logo size={90} variant="simple" />
            </View>
            <Text style={styles.title}>Attend<Text style={styles.subtitlex}>IQ</Text></Text>
            <Text style={styles.subtitle}>Smart Attendance Tracking</Text>
          </View>

        <View style={styles.form}>

          {isRegistering && (
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                  placeholderTextColor="#adb5bd"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#6c757d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor="#adb5bd"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.passwordInputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6c757d" style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={handlePasswordChange}
                  placeholder="Password"
                  placeholderTextColor="#adb5bd"
                secureTextEntry={!showPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6c757d"
                />
              </TouchableOpacity>
            </View>
            {isRegistering && password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.passwordStrengthSegments}>
                  {[1, 2, 3, 4].map((segment) => {
                    const isActive = 
                      (passwordStrength === 'weak' && segment <= 1) ||
                      (passwordStrength === 'fair' && segment <= 2) ||
                      (passwordStrength === 'good' && segment <= 3) ||
                      (passwordStrength === 'strong' && segment <= 4);
                    
                    // Unified gradient that flows across all stages
                    const unifiedGradient = ['#FF6B6B', '#FF8C00', '#FFD700', '#8B0000'];
                    const segmentColor = isActive 
                      ? unifiedGradient[segment - 1] 
                      : '#d1d5db';
                    
                    return (
                      <View
                        key={segment}
                        style={[
                          styles.passwordStrengthSegment,
                          { backgroundColor: segmentColor },
                          isActive && styles.passwordStrengthSegmentActive,
                        ]}
                      />
                    );
                  })}
                </View>
                <Text style={[styles.passwordStrengthText, { color: getPasswordStrengthColor(passwordStrength) }]}>
                  {getPasswordStrengthText(passwordStrength)}
                </Text>
              </View>
            )}
            {!isRegistering && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => {
                  if (navigation) {
                    navigation.navigate('ForgotPassword');
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
            {isRegistering && passwordStrength !== 'strong' && password.length > 0 && !isPasswordFocused && (
              <View style={styles.passwordRequirementsContainer}>
                <Text style={styles.passwordRequirementsTitle}>Password must include:</Text>
                {getPasswordRequirements(password).map((req, index) => (
                  <View key={index} style={styles.passwordRequirementItem}>
                    <Ionicons
                      name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={req.met ? '#10b981' : '#9ca3af'}
                      style={styles.requirementIcon}
                    />
                    <Text style={[
                      styles.passwordRequirementText,
                      { color: req.met ? '#10b981' : '#6b7280' }
                    ]}>
                      {req.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>


          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonLoading]}
            onPress={isRegistering ? handleRegister : handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>
                  {isRegistering ? 'Create Account' : 'Sign In'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>

          {!isRegistering && biometricAvailable && biometricEnabled && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="scan" size={24} color="#8B0000" />
              <Text style={styles.biometricButtonText}>Use Biometric</Text>
            </TouchableOpacity>
          )}

          {!loading && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => {
                  setIsRegistering(!isRegistering);
                  setName('');
                  setPassword('');
                  setPasswordStrength('weak');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleButtonText}>
                  {isRegistering 
                    ? 'Already have an account? ' 
                    : "Don't have an account? "
                  }
                  <Text style={styles.toggleButtonTextBold}>
                    {isRegistering ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

          <View style={styles.footer}>
            {/* <Text style={styles.footerText}>
            </Text> */}
            <Text style={styles.footerSubtext}>
              Version 1.0.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    marginBottom: 24,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonLoading: {
    opacity: 0.8,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  subtitlex: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: -1
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    paddingTop: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 6,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 14,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '400',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 6,
    minHeight: 56,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '400',
  },
  eyeButton: {
    padding: 6,
    marginLeft: 4,
  },
  passwordStrengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  passwordStrengthSegments: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  passwordStrengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  passwordStrengthSegmentActive: {
    opacity: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  passwordStrengthText: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'right',
    letterSpacing: 0.3,
  },
  passwordRequirementsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  passwordRequirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  passwordRequirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementIcon: {
    marginRight: 8,
  },
  passwordRequirementText: {
    fontSize: 12,
    fontWeight: '400',
  },
  loginButton: {
    backgroundColor: '#8B0000',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    // marginTop: 0,
    shadowColor: '#8B0000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  biometricButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: '#8B0000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  biometricButtonText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 12,
    color: '#adb5bd',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  toggleButton: {
    // marginTop: 4,
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  toggleButtonTextBold: {
    color: '#8B0000',
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 1,
  },
  forgotPasswordText: {
    color: '#8B0000',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '300',
    letterSpacing: 0.3,
  },
});

export default LoginScreen;
