import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

interface Class {
  id: string;
  name: string;
  subject?: string;
  schedule?: string;
  description?: string;
  teacher: {
    name: string;
  };
}

interface Enrollment {
  id: string;
  class: Class;
  enrolledAt: string;
}

const ClassesScreen: React.FC = () => {
  const { user } = useAuth();
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [availableRes, enrollmentsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/enrollments'),
      ]);
      
      console.log('Available classes response:', availableRes.data);
      console.log('Enrollments response:', enrollmentsRes.data);
      
      setAvailableClasses(availableRes.data || []);
      setEnrollments(enrollmentsRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', `Failed to fetch classes: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const enrollInClass = async (classId: string) => {
    setEnrolling(classId);
    try {
      await api.post(`/enrollments/${classId}`);
      fetchData(); // Refresh data
      Alert.alert('Success', 'Successfully enrolled in class!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to enroll in class');
    } finally {
      setEnrolling(null);
    }
  };

  const unenrollFromClass = async (classId: string) => {
    Alert.alert(
      'Unenroll',
      'Are you sure you want to unenroll from this class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unenroll',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/enrollments/${classId}`);
              fetchData(); // Refresh data
              Alert.alert('Success', 'Successfully unenrolled from class!');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to unenroll from class');
            }
          },
        },
      ]
    );
  };

  const isEnrolled = (classId: string) => {
    return enrollments.some(enrollment => enrollment.class.id === classId);
  };

  // Filter out enrolled classes from available classes
  const availableClassesToShow = availableClasses.filter(classItem => !isEnrolled(classItem.id));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading classes...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* My Enrolled Classes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Classes ({enrollments.length})</Text>
        {enrollments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No classes enrolled</Text>
            <Text style={styles.emptySubtext}>
              Browse available classes below to enroll
            </Text>
          </View>
        ) : (
          enrollments.map((enrollment) => (
            <View key={enrollment.id} style={styles.classCard}>
              <View style={styles.classHeader}>
                <Text style={styles.className}>{enrollment.class.name}</Text>
                {enrollment.class.subject && (
                  <Text style={styles.classSubject}>{enrollment.class.subject}</Text>
                )}
              </View>
              <Text style={styles.teacherName}>
                Instructor: {enrollment.class.teacher.name}
              </Text>
              {enrollment.class.schedule && (
                <Text style={styles.classSchedule}>{enrollment.class.schedule}</Text>
              )}
              {enrollment.class.description && (
                <Text style={styles.classDescription}>{enrollment.class.description}</Text>
              )}
              <TouchableOpacity
                style={styles.unenrollButton}
                onPress={() => unenrollFromClass(enrollment.class.id)}
              >
                <Text style={styles.unenrollButtonText}>Unenroll</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>


      {/* Available Classes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Available Classes ({availableClassesToShow.length})
        </Text>
        {availableClassesToShow.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No classes available</Text>
            <Text style={styles.emptySubtext}>
              Contact your instructor to create classes
            </Text>
          </View>
        ) : (
          availableClassesToShow.map((classItem) => (
            <View key={classItem.id} style={styles.classCard}>
              <View style={styles.classHeader}>
                <Text style={styles.className}>{classItem.name}</Text>
                {classItem.subject && (
                  <Text style={styles.classSubject}>{classItem.subject}</Text>
                )}
              </View>
              <Text style={styles.teacherName}>
                Instructor: {classItem.teacher.name}
              </Text>
              {classItem.schedule && (
                <Text style={styles.classSchedule}>{classItem.schedule}</Text>
              )}
              {classItem.description && (
                <Text style={styles.classDescription}>{classItem.description}</Text>
              )}
              <TouchableOpacity
                style={[
                  styles.enrollButton,
                  enrolling === classItem.id && styles.enrollButtonDisabled,
                ]}
                onPress={() => enrollInClass(classItem.id)}
                disabled={enrolling === classItem.id}
              >
                {enrolling === classItem.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.enrollButtonText}>Enroll</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  classCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classHeader: {
    marginBottom: 8,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  classSubject: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '600',
  },
  teacherName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  classSchedule: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  classDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  enrollButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  enrolledButton: {
    backgroundColor: '#28a745',
  },
  enrollButtonDisabled: {
    opacity: 0.7,
  },
  enrollButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
  unenrollButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  unenrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ClassesScreen;

