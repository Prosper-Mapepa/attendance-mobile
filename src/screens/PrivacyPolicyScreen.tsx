import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/useResponsive';

const PrivacyPolicyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={40} color="#8B0000" />
          </View>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>Last updated: December 24, 2025</Text>
        </View>

        <View style={styles.content}>
          <Section
            title="Information We Collect"
            content={[
              "We collect the following information to provide our attendance tracking services:",
              "• Your name and email address",
              "• Attendance records and class information",
              "• Account information necessary for authentication",
            ]}
          />

          <Section
            title="How We Use Your Information"
            content={[
              "We use your information to:",
              "• Provide attendance tracking services",
              "• Authenticate your account",
              "• Send important notifications",
              "• Improve our services",
            ]}
          />

          <Section
            title="Data Security"
            content={[
              "We take reasonable measures to protect your information. Your data is encrypted and stored securely.",
            ]}
          />

          <Section
            title="Data Sharing"
            content={[
              "We do not sell your personal information. We may share your attendance information with your instructors for academic purposes.",
            ]}
          />

          <Section
            title="Your Rights"
            content={[
              "You can update or delete your account information at any time through the app settings.",
            ]}
          />

          <Section
            title="Contact Us"
            content={[
              "If you have questions about this Privacy Policy, please contact us at support@attendiq.app",
            ]}
          />

          <Section
            title="Changes to This Policy"
            content={[
              "We may update this Privacy Policy from time to time. The last updated date is shown at the top of this page.",
            ]}
          />
        </View>
      </View>
    </ScrollView>
  );
};

interface SectionProps {
  title: string;
  content: string[];
}

const Section: React.FC<SectionProps> = ({ title, content }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {content.map((paragraph, index) => {
        if (paragraph === '') return null;
        const isBullet = paragraph.startsWith('•');
        return (
          <Text key={index} style={[styles.sectionText, isBullet && styles.bulletText]}>
            {paragraph}
          </Text>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  contentWrapper: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#8B0000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B0000',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sectionContent: {
    marginTop: 0,
  },
  sectionText: {
    fontSize: 14,
    color: '#4a4a4a',
    lineHeight: 20,
    marginBottom: 6,
  },
  bulletText: {
    marginLeft: 0,
    paddingLeft: 0,
  },
});

export default PrivacyPolicyScreen;

