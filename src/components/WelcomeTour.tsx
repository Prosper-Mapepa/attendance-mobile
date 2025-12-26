import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useResponsive } from '../utils/useResponsive';

interface WelcomeStep {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const WELCOME_STEPS: WelcomeStep[] = [
  {
    id: 1,
    title: 'Welcome to AttendIQ!',
    description: 'Your smart attendance tracking companion. Mark attendance easily with QR codes or OTP.',
    icon: 'rocket',
    color: '#FBBC04',
  },
  {
    id: 2,
    title: 'Quick & Easy',
    description: 'Enroll in Classes and scan QR codes or enter OTP codes to mark your attendance in seconds.',
    icon: 'flash',
    color: '#FBBC04',
  },
  {
    id: 3,
    title: 'Track Everything',
    description: 'View your attendance history, manage classes, and stay on top of your schedule.',
    icon: 'stats-chart',
    color: '#FBBC04',
  },
];

interface WelcomeTourProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const WelcomeTour: React.FC<WelcomeTourProps> = ({ visible, onComplete, onSkip }) => {
  const responsive = useResponsive();
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNext = () => {
    if (currentStep < WELCOME_STEPS.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep + 1);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenWelcomeTour', 'true');
    onSkip();
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem('hasSeenWelcomeTour', 'true');
    onComplete();
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep - 1);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const step = WELCOME_STEPS[currentStep];
  const isLastStep = currentStep === WELCOME_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(139, 0, 0, 0.95)', 'rgba(139, 0, 0, 0.98)']}
          style={styles.container}
        >
          <View style={[
            styles.contentWrapper,
            responsive.isTablet && {
              maxWidth: responsive.maxContentWidth,
              alignSelf: 'center',
              width: '100%',
            }
          ]}>
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                responsive.isTablet && {
                  paddingHorizontal: responsive.horizontalPadding,
                }
              ]}
              showsVerticalScrollIndicator={false}
            >
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              {WELCOME_STEPS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentStep && styles.progressDotActive,
                    index < currentStep && styles.progressDotCompleted,
                  ]}
                />
              ))}
            </View>

            {/* Skip Button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            {/* Content */}
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Icon */}
              <View style={[
                styles.iconContainer, 
                { backgroundColor: `${step.color}15` },
                responsive.isTablet && responsive.isLandscape && styles.iconContainerTabletLandscape
              ]}>
                <View style={[
                  styles.iconCircle, 
                  { borderColor: step.color },
                  responsive.isTablet && responsive.isLandscape && styles.iconCircleTabletLandscape
                ]}>
                  <Ionicons 
                    name={step.icon} 
                    size={responsive.isTablet && responsive.isLandscape ? 90 : 70} 
                    color={step.color} 
                  />
                </View>
              </View>

              {/* Title */}
              <Text style={[
                styles.title,
                responsive.isTablet && responsive.isLandscape && styles.titleTabletLandscape
              ]}>
                {step.title}
              </Text>

              {/* Description */}
              <Text style={[
                styles.description,
                responsive.isTablet && responsive.isLandscape && styles.descriptionTabletLandscape
              ]}>
                {step.description}
              </Text>

              {/* Step Counter */}
              <Text style={styles.stepCounter}>
                {currentStep + 1} of {WELCOME_STEPS.length}
              </Text>
            </Animated.View>

            {/* Navigation Buttons */}
            <View style={styles.navigationContainer}>
              {!isFirstStep && (
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={handlePrevious}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                  <Text style={styles.navButtonText}>Previous</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.nextButton, { flex: isFirstStep ? 1 : 0.6 }]}
                onPress={handleNext}
                activeOpacity={0.9}
              >
                <Text style={styles.nextButtonText}>
                  {isLastStep ? 'Get Started' : 'Next'}
                </Text>
                {!isLastStep && (
                  <Ionicons name="chevron-forward" size={20} color="#8B0000" style={styles.nextIcon} />
                )}
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(139, 0, 0, 0.95)',
  },
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#FBBC04',
  },
  progressDotCompleted: {
    backgroundColor: '#FBBC04',
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconContainerTabletLandscape: {
    width: 220,
    height: 220,
    borderRadius: 110,
    marginBottom: 40,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconCircleTabletLandscape: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  titleTabletLandscape: {
    fontSize: 36,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  descriptionTabletLandscape: {
    fontSize: 20,
    lineHeight: 30,
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  stepCounter: {
    fontSize: 14,
    color: '#FBBC04',
    fontWeight: '600',
    marginTop: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#FBBC04',
    borderRadius: 12,
    shadowColor: '#FBBC04',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: '#8B0000',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  nextIcon: {
    marginLeft: 8,
  },
});

export default WelcomeTour;

