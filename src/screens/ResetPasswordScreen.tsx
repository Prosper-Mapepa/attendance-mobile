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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../../Logo';

const ResetPasswordScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { token } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'fair' | 'good' | 'strong'>('weak');
  const { resetPassword } = useAuth();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (!token) {
      showError('Invalid reset link');
      navigation.navigate('Login');
    }
  }, [token]);

  const calculatePasswordStrength = (password: string): 'weak' | 'fair' | 'good' | 'strong' => {
    if (password.length === 0) return 'weak';
    
    let score = 0;
    
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'fair';
    if (score <= 6) return 'good';
    return 'strong';
  };

  const getPasswordStrengthColor = (strength: 'weak' | 'fair' | 'good' | 'strong'): string => {
    switch (strength) {
      case 'weak': return '#FF6B6B';
      case 'fair': return '#FF8C00';
      case 'good': return '#FFD700';
      case 'strong': return '#8B0000';
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
    setPasswordStrength(calculatePasswordStrength(text));
  };

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      showError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      showError(passwordValidation.error || 'Invalid password');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      showSuccess('Password reset successfully! You can now login with your new password.');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (error: any) {
      showError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[
        '#A00000',
        '#8B0000',
        '#8B0000',
        '#8B0000',
        '#6B0000'
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password below
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.passwordInputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="New Password"
                  placeholderTextColor="#adb5bd"
                  secureTextEntry={!showPassword}
                  autoFocus={true}
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
              {password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthSegments}>
                    {[1, 2, 3, 4].map((segment) => {
                      const isActive = 
                        (passwordStrength === 'weak' && segment <= 1) ||
                        (passwordStrength === 'fair' && segment <= 2) ||
                        (passwordStrength === 'good' && segment <= 3) ||
                        (passwordStrength === 'strong' && segment <= 4);
                      
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
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordInputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm Password"
                  placeholderTextColor="#adb5bd"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6c757d"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonLoading]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Reset Password</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
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
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '300',
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: 20,
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
  inputContainer: {
    marginBottom: 16,
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
  inputIcon: {
    marginRight: 14,
    opacity: 0.6,
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
    gap: 8,
  },
  passwordStrengthSegments: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  passwordStrengthSegment: {
    flex: 1,
    height: 3,
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
  submitButton: {
    backgroundColor: '#8B0000',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
    shadowColor: '#8B0000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  submitButtonLoading: {
    opacity: 0.8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default ResetPasswordScreen;

