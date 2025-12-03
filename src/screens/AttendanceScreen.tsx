import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AttendanceScreen: React.FC = () => {

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="information-circle" size={48} color="#8B0000" />
        </View>
        {/* <Text style={styles.title}>How to Mark Attendance</Text> */}
        <Text style={styles.subtitle}>
          Follow these simple steps to mark your attendance
        </Text>
      </View>

      <View style={styles.stepsContainer}>
        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Ionicons name="qr-code" size={20} color="#fff" />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Scan QR Code</Text>
            <Text style={styles.stepDescription}>
              Use the QR Scanner tab to scan the QR code displayed by your instructor
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Ionicons name="keypad" size={20} color="#fff" />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Or Enter OTP</Text>
            <Text style={styles.stepDescription}>
              If scanning doesn't work, tap "Enter OTP" in the QR Scanner and enter the code manually
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Ionicons name="location" size={20} color="#fff" />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Verify Location</Text>
            <Text style={styles.stepDescription}>
              Make sure you're physically present in the classroom with location services enabled
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
            <Text style={styles.infoText}>You must be physically present in the classroom</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={18} color="#8B0000" />
            <Text style={styles.infoText}>Location services must be enabled</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={18} color="#8B0000" />
            <Text style={styles.infoText}>You must be within 50 meters of the class location</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={18} color="#ff9800" />
            <Text style={styles.infoText}>
              If you're in the correct room but get an error, ask your instructor to check the class location settings
            </Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
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
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  stepsContainer: {
    marginBottom: 28,
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
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
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

