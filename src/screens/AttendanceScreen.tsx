import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/useResponsive';

const AttendanceScreen: React.FC = () => {
  const responsive = useResponsive();

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[
        styles.scrollContainer,
        responsive.isTablet && {
          paddingHorizontal: responsive.horizontalPadding,
        }
      ]}
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
      <View style={styles.header}>
        {/* <View style={styles.iconContainer}>
          <Ionicons name="information-circle" size={48} color="#8B0000" />
        </View> */}
        {/* <Text style={styles.title}>How to Mark Attendance</Text> */}
        {/* <Text style={styles.subtitle}>
          Follow these simple steps to mark your attendance
        </Text> */}
      </View>

      <View style={styles.stepsContainer}>
        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <View style={styles.stepTitleRow}>
              {/* <Ionicons name="school" size={20} color="#8B0000" style={styles.stepIcon} /> */}
              <Text style={styles.stepTitle}>Enroll in Classes</Text>
            </View>
            <Text style={styles.stepDescription}>
              Go to Dashboard and enroll in the classes you're taking. You can only mark attendance for enrolled classes.
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <View style={styles.stepTitleRow}>
              {/* <Ionicons name="time" size={20} color="#8B0000" style={styles.stepIcon} /> */}
              <Text style={styles.stepTitle}>Clock In</Text>
            </View>
            <Text style={styles.stepDescription}>
              Use the QR Scanner tab to scan the QR code or enter the OTP code to clock in when class starts. Your location will be verified automatically.
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <View style={styles.stepTitleRow}>
              {/* <Ionicons name="hourglass" size={20} color="#8B0000" style={styles.stepIcon} /> */}
              <Text style={styles.stepTitle}>Wait for Class to End</Text>
            </View>
            <Text style={styles.stepDescription}>
              Stay in class and wait for the session to end. You'll see a countdown timer showing when you can clock out.
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <View style={styles.stepTitleRow}>
              {/* <Ionicons name="log-out" size={20} color="#8B0000" style={styles.stepIcon} /> */}     
              <Text style={styles.stepTitle}>Clock Out</Text>
            </View>
            <Text style={styles.stepDescription}>
              Once class ends, tap the "Clock Out" button to complete your attendance. Your attendance time will be recorded.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="location" size={22} color="#8B0000" />
          </View>
          <Text style={styles.infoTitle}>Location Requirements</Text>
        </View>
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={18} color="#8B0000" />
            <Text style={styles.infoText}>You must be physically present in the classroom for both clock in and clock out</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={18} color="#8B0000" />
            <Text style={styles.infoText}>Location services must be enabled on your device</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={18} color="#8B0000" />
            <Text style={styles.infoText}>You must be within 2 meters of the class location</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time" size={18} color="#8B0000" />
            <Text style={styles.infoText}>
              You must wait for the class session to end before you can clock out
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={18} color="#ff9800" />
            <Text style={styles.infoText}>
              If you're in the correct room but get an error, ask your instructor to check the class location settings
            </Text>
          </View>
        </View>
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  contentWrapper: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 5,
    // marginTop: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#8B0000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'left',
    lineHeight: 22,
    // paddingHorizontal: 20,
  },
  stepsContainer: {
    // marginBottom: 10,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  stepNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#8B0000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepIcon: {
    marginRight: 8,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B0000',
    marginLeft: 12,
    letterSpacing: -0.3,
  },
  infoList: {
    gap: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 21,
    flex: 1,
    marginLeft: 10,
    letterSpacing: -0.2,
  },
});

export default AttendanceScreen;

