import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useResponsive } from '../utils/useResponsive';
import api from '../config/api';

const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const responsive = useResponsive();
  const { user, logout } = useAuth();
  const { showSuccess, showError, showConfirm } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  
  // Email change states
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [showEmailChangePassword, setShowEmailChangePassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  
  // Profile section states
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  
  // Change password states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'fair' | 'good' | 'strong'>('weak');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setName(response.data.name || '');
      setEmail(response.data.email || '');
      setOriginalEmail(response.data.email || '');
      // Note: pendingEmail would come from backend if we add it to profile endpoint
      // For now, we'll check if email changed locally
    } catch (error: any) {
      showError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password: string): 'weak' | 'fair' | 'good' | 'strong' => {
    if (password.length === 0) return 'weak';
    
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    
    if (hasLowercase && hasUppercase && hasNumbers && hasSpecial && password.length >= 8) {
      return 'strong';
    }
    
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (hasLowercase) score += 1;
    if (hasUppercase) score += 1;
    if (hasNumbers) score += 1;
    if (hasSpecial) score += 1;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'fair';
    return 'good';
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

  const getPasswordRequirements = (password: string): { met: boolean; text: string }[] => {
    return [
      { met: password.length >= 6, text: 'At least 6 characters' },
      { met: /[a-z]/.test(password), text: 'One lowercase letter' },
      { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { met: /[0-9]/.test(password), text: 'One number' },
      { met: /[^a-zA-Z0-9]/.test(password), text: 'One special character' },
    ];
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
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name.trim())) {
      return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }
    return { isValid: true };
  };

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

  const handleUpdateProfile = async () => {
    const nameValidation = validateName(name.trim());
    if (!nameValidation.isValid) {
      showError(nameValidation.error || 'Invalid name');
      return;
    }

    // Check if email changed
    const emailChanged = email.trim().toLowerCase() !== originalEmail.toLowerCase();
    
    if (emailChanged) {
      // Validate new email
      const emailValidation = validateEmail(email.trim());
      if (!emailValidation.isValid) {
        showError(emailValidation.error || 'Invalid email');
        return;
      }

      // Require password for email change
      if (!emailChangePassword.trim()) {
        showError('Please enter your current password to change email');
        return;
      }

      // Change email
      setChangingEmail(true);
      try {
        await api.post('/auth/change-email', {
          newEmail: email.trim().toLowerCase(),
          currentPassword: emailChangePassword,
        });
        
        showSuccess('Verification email sent to your new email address. Please check your inbox and click the verification link.');
        setPendingEmail(email.trim().toLowerCase());
        setEmailChangePassword('');
        // Don't update email yet - wait for verification
        setEmail(originalEmail);
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to change email');
        // Reset email to original on error
        setEmail(originalEmail);
      } finally {
        setChangingEmail(false);
      }
      return;
    }

    // Just update name if email hasn't changed
    setUpdating(true);
    try {
      await api.patch(`/users/${user?.id}`, { name: name.trim() });
      showSuccess('Profile updated successfully');
      // Refresh profile data
      await fetchProfile();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    const strength = calculatePasswordStrength(newPassword);
    if (strength !== 'strong') {
      showError('Password must be strong. Use uppercase, lowercase, numbers, and special characters.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      
      showSuccess('Password changed successfully');
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    showConfirm(
      'Are you sure you want to logout?',
      logout,
      'Logout',
      'Logout',
      'Cancel'
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[
        styles.contentWrapper,
        responsive.isTablet && {
          maxWidth: responsive.maxContentWidth,
          alignSelf: 'center',
          width: '100%',
        }
      ]}>
        {/* Profile Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowProfileInfo(!showProfileInfo)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="person-circle-outline" size={24} color="#8B0000" />
              <Text style={styles.sectionTitle}>Profile Information</Text>
            </View>
            <Ionicons
              name={showProfileInfo ? 'chevron-up' : 'chevron-down'}
              style={styles.sectionHeaderRight}
              size={20}
              color="#8B0000"
            />
          </TouchableOpacity>

          {showProfileInfo && (
            <View style={styles.profileSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <View style={styles.inputWrapper}>
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
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
                {email.trim().toLowerCase() !== originalEmail.toLowerCase() && (
                  <>
                    <Text style={styles.helperText}>
                      Enter your current password to change email
                    </Text>
                    <View style={[styles.inputWrapper, { marginTop: 12 }]}>
                      <TextInput
                        style={styles.input}
                        value={emailChangePassword}
                        onChangeText={setEmailChangePassword}
                        placeholder="Current Password"
                        placeholderTextColor="#adb5bd"
                        secureTextEntry={!showEmailChangePassword}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowEmailChangePassword(!showEmailChangePassword)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={showEmailChangePassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="#6c757d"
                        />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
                {pendingEmail && (
                  <View style={styles.pendingEmailBox}>
                    <Ionicons name="mail-outline" size={16} color="#FF8C00" />
                    <Text style={styles.pendingEmailText}>
                      Verification email sent to {pendingEmail}. Please check your inbox.
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.updateButton, (updating || changingEmail) && styles.buttonDisabled]}
                onPress={handleUpdateProfile}
                disabled={updating || changingEmail}
                activeOpacity={0.8}
              >
                {(updating || changingEmail) ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.updateButtonText}>
                      {email.trim().toLowerCase() !== originalEmail.toLowerCase() ? 'Change Email' : 'Update Profile'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Change Password Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowChangePassword(!showChangePassword)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="key-outline" size={24} color="#8B0000" />
              <Text style={styles.sectionTitle}>Change Password</Text>
            </View>
            <Ionicons
              name={showChangePassword ? 'chevron-up' : 'chevron-down'}
              style={styles.sectionHeaderRight}
              size={20}
              color="#8B0000"
            />
          </TouchableOpacity>

          {showChangePassword && (
            <View style={styles.passwordSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="#adb5bd"
                    secureTextEntry={!showCurrentPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      setPasswordStrength(calculatePasswordStrength(text));
                    }}
                    placeholder="Enter new password"
                    placeholderTextColor="#adb5bd"
                    secureTextEntry={!showNewPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
                {newPassword.length > 0 && (
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
                {passwordStrength !== 'strong' && newPassword.length > 0 && !isPasswordFocused && (
                  <View style={styles.passwordRequirementsContainer}>
                    <Text style={styles.passwordRequirementsTitle}>Password must include:</Text>
                    {getPasswordRequirements(newPassword).map((req, index) => (
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
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
                style={[styles.changePasswordButton, changingPassword && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={changingPassword}
                activeOpacity={0.8}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="key" size={20} color="#fff" />
                    <Text style={styles.changePasswordButtonText}>Change Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Privacy Policy Section */}
        <View style={styles.privacySection}>
          <TouchableOpacity
            style={styles.privacyButton}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#8B0000" />
            <Text style={styles.privacyButtonText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#8B0000" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  contentWrapper: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingTop: 30,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#e8e8e8',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.3,
    paddingLeft: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  disabledInput: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '400',
  },
  disabledText: {
    color: '#6c757d',
  },
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
    fontStyle: 'italic',
  },
  pendingEmailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderLeftWidth: 3,
    borderLeftColor: '#FF8C00',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
    gap: 8,
  },
  pendingEmailText: {
    fontSize: 12,
    color: '#856404',
    flex: 1,
  },
  passwordSection: {
    marginTop: 8,
  },
  profileSection: {
    marginTop: 8,
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
  updateButton: {
    backgroundColor: '#8B0000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
    shadowColor: '#8B0000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  changePasswordButton: {
    backgroundColor: '#8B0000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
    shadowColor: '#8B0000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutSection: {
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: '#8B0000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#dc3545',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  privacySection: {
    marginTop: 16,
  },
  privacyButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  privacyButtonText: {
    flex: 1,
    marginLeft: 12,
    color: '#8B0000',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sectionHeaderRight: {
    marginLeft: 'auto',
  },
});

export default ProfileScreen;

