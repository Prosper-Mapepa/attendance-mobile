import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTour } from '../contexts/TourContext';
import api from '../config/api';

interface Class {
  id: string;
  name: string;
  subject?: string;
  schedule?: string;
  description?: string;
  teacher?: {
    name: string;
  };
}

interface Enrollment {
  id: string;
  class: Class;
  enrolledAt: string;
}

interface AttendanceRecord {
  id: string;
  timestamp: string;
  session: {
    id: string;
    otp: string;
    class: {
      name: string;
      subject?: string;
    };
  };
}

const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError, showConfirm } = useToast();
  const { startTour } = useTour();
  const [activeTab, setActiveTab] = useState<'myClasses' | 'enrollClass'>('myClasses');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [viewingClass, setViewingClass] = useState<Class | null>(null);
  const [myClassesSearch, setMyClassesSearch] = useState('');
  const [enrollClassesSearch, setEnrollClassesSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enrollmentsRes, attendanceRes, availableRes] = await Promise.all([
        api.get('/enrollments'),
        api.get('/attendance'),
        api.get('/classes'),
      ]);
      setEnrollments(enrollmentsRes.data);
      setAttendanceRecords(attendanceRes.data);
      setAvailableClasses(availableRes.data || []);
    } catch (error: any) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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

  const enrollInClass = async (classId: string) => {
    setEnrolling(classId);
    try {
      await api.post(`/enrollments/${classId}`);
      fetchData(); // Refresh data
      showSuccess('Successfully enrolled in class!');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to enroll in class');
    } finally {
      setEnrolling(null);
    }
  };

  const unenrollFromClass = async (classId: string) => {
    showConfirm(
      'Are you sure you want to unenroll from this class?',
      async () => {
        try {
          await api.delete(`/enrollments/${classId}`);
          fetchData(); // Refresh data
          showSuccess('Successfully unenrolled from class!');
        } catch (error: any) {
          showError(error.response?.data?.message || 'Failed to unenroll from class');
        }
      },
      'Unenroll',
      'Unenroll',
      'Cancel'
    );
  };

  const isEnrolled = (classId: string) => {
    return enrollments.some(enrollment => enrollment.class.id === classId);
  };

  const availableClassesToShow = availableClasses.filter(classItem => !isEnrolled(classItem.id));

  const filterClasses = (classes: Class[], searchQuery: string) => {
    if (!searchQuery.trim()) {
      return classes;
    }
    const query = searchQuery.toLowerCase().trim();
    return classes.filter(classItem => {
      const nameMatch = classItem.name.toLowerCase().includes(query);
      const subjectMatch = classItem.subject?.toLowerCase().includes(query);
      const teacherMatch = classItem.teacher?.name.toLowerCase().includes(query);
      const scheduleMatch = classItem.schedule?.toLowerCase().includes(query);
      return nameMatch || subjectMatch || teacherMatch || scheduleMatch;
    });
  };

  const filteredMyClasses = filterClasses(
    enrollments.map(e => e.class),
    myClassesSearch
  );

  const filteredEnrollClasses = filterClasses(
    availableClassesToShow,
    enrollClassesSearch
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading...</Text>
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
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.tourButton} 
            onPress={startTour}
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle-outline" size={20} color="#8B0000" />
            <Text style={styles.tourButtonText}>Tour</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

    

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myClasses' && styles.activeTab]}
          onPress={() => {
            setActiveTab('myClasses');
            setMyClassesSearch('');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'myClasses' && styles.activeTabText]}>
            My Classes <Text style={styles.tabTextCount}>({enrollments.length})</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'enrollClass' && styles.activeTab]}
          onPress={() => {
            setActiveTab('enrollClass');
            setEnrollClassesSearch('');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'enrollClass' && styles.activeTabText]}>
            Enroll Classes <Text style={styles.tabTextCount}>({availableClassesToShow.length})</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'myClasses' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Classes </Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search classes..."
              placeholderTextColor="#999"
              value={myClassesSearch}
              onChangeText={setMyClassesSearch}
            />
            {myClassesSearch.length > 0 && (
              <TouchableOpacity
                onPress={() => setMyClassesSearch('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          {enrollments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No classes enrolled</Text>
              <Text style={styles.emptySubtext}>
                Switch to "Enroll Class" tab to browse available classes
              </Text>
            </View>
          ) : filteredMyClasses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No classes found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search query
              </Text>
            </View>
          ) : (
            filteredMyClasses.map((classItem) => {
              const enrollment = enrollments.find(e => e.class.id === classItem.id);
              if (!enrollment) return null;
              return (
              <View key={enrollment.id} style={styles.classCard}>
                <View style={styles.classHeader}>
                  <Text style={styles.className}>{classItem.name}</Text>
                  {classItem.subject && (
                    <Text style={styles.classSubject}>{classItem.subject}</Text>
                  )}
                </View>
                {classItem.teacher && (
                  <Text style={styles.teacherName}>
                    Teacher: {classItem.teacher.name}
                  </Text>
                )}
                {classItem.schedule && (
                  <Text style={styles.classSchedule}>{classItem.schedule}</Text>
                )}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => setViewingClass(classItem)}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.unenrollButton}
                    onPress={() => unenrollFromClass(classItem.id)}
                  >
                    <Text style={styles.unenrollButtonText}>Unenroll</Text>
                  </TouchableOpacity>
                </View>
              </View>
              );
            })
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Classes 
          </Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search classes..."
              placeholderTextColor="#999"
              value={enrollClassesSearch}
              onChangeText={setEnrollClassesSearch}
            />
            {enrollClassesSearch.length > 0 && (
              <TouchableOpacity
                onPress={() => setEnrollClassesSearch('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          {availableClassesToShow.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No classes available</Text>
              <Text style={styles.emptySubtext}>
                Contact your teacher to create classes
              </Text>
            </View>
          ) : filteredEnrollClasses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No classes found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search query
              </Text>
            </View>
          ) : (
            filteredEnrollClasses.map((classItem) => (
              <View key={classItem.id} style={styles.classCard}>
                <View style={styles.classHeader}>
                  <Text style={styles.className}>{classItem.name}</Text>
                  {classItem.subject && (
                    <Text style={styles.classSubject}>{classItem.subject}</Text>
                  )}
                </View>
                {classItem.teacher && (
                  <Text style={styles.teacherName}>
                    Teacher: {classItem.teacher.name}
                  </Text>
                )}
                {classItem.schedule && (
                  <Text style={styles.classSchedule}>{classItem.schedule}</Text>
                )}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => setViewingClass(classItem)}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.enrollButton,
                      enrolling === classItem.id && styles.enrollButtonDisabled,
                    ]}
                    onPress={() => enrollInClass(classItem.id)}
                    disabled={enrolling === classItem.id}
                  >
                    {enrolling === classItem.id ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (
                      <Text style={styles.enrollButtonText}>Enroll</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Class Detail Modal */}
      <Modal
        visible={viewingClass !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setViewingClass(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {viewingClass && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{viewingClass.name}</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setViewingClass(null)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                {viewingClass.subject && (
                  <Text style={styles.modalSubject}>{viewingClass.subject}</Text>
                )}
                
                <View style={styles.modalInfo}>
                  {viewingClass.teacher && (
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="person" size={20} color="#8B0000" />
                      <Text style={styles.modalInfoText}>
                        {viewingClass.teacher.name}
                      </Text>
                    </View>
                  )}
                  {viewingClass.schedule && (
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="time" size={20} color="#8B0000" />
                      <Text style={styles.modalInfoText}>
                        {viewingClass.schedule}
                      </Text>
                    </View>
                  )}
                </View>
                
                {viewingClass.description && (
                  <View style={styles.modalDescriptionContainer}>
                    <Text style={styles.modalDescriptionTitle}>Description</Text>
                    <Text style={styles.modalDescription}>
                      {viewingClass.description}
                    </Text>
                  </View>
                )}
                
                <View style={styles.modalButtonRow}>
                  {!isEnrolled(viewingClass.id) && (
                    <TouchableOpacity
                      style={[
                        styles.modalEnrollButton,
                        enrolling === viewingClass.id && styles.enrollButtonDisabled,
                      ]}
                      onPress={() => {
                        enrollInClass(viewingClass.id);
                        setViewingClass(null);
                      }}
                      disabled={enrolling === viewingClass.id}
                    >
                      {enrolling === viewingClass.id ? (
                        <ActivityIndicator color="#000" size="small" />
                      ) : (
                        <Text style={styles.modalEnrollButtonText}>Enroll</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  {isEnrolled(viewingClass.id) && (
                    <TouchableOpacity
                      style={styles.modalUnenrollButton}
                      onPress={() => {
                        setViewingClass(null);
                        unenrollFromClass(viewingClass.id);
                      }}
                    >
                      <Text style={styles.modalUnenrollButtonText}>Unenroll</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Recent Attendance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Attendance</Text>
        {attendanceRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No attendance records</Text>
            <Text style={styles.emptySubtext}>
              Mark attendance when your instructor starts a session
            </Text>
          </View>
        ) : (
          attendanceRecords.slice(0, 5).map((record) => (
            <View key={record.id} style={styles.attendanceCard}>
              <View style={styles.attendanceHeader}>
                <Text style={styles.attendanceClass}>
                  {record.session.class.name}
                </Text>
                <Text style={styles.attendanceTime}>
                  {new Date(record.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.attendanceOTP}>
                OTP: {record.session.otp}
              </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#8B0000',
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tourButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  tourButtonText: {
    color: '#8B0000',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#FFD700', // CMU Gold
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#8B0000',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
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
  classSchedule: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  viewButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  attendanceCard: {
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
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceClass: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  attendanceTime: {
    fontSize: 14,
    color: '#666',
  },
  attendanceOTP: {
    fontSize: 14,
    color: '#8B0000',
    fontFamily: 'monospace',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#8B0000',
  },
  tabText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#8B0000',
  },
  teacherName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  enrollButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  enrollButtonDisabled: {
    opacity: 0.7,
  },
  enrollButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  unenrollButton: {
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  modalSubject: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: '600',
    marginBottom: 20,
  },
  modalInfo: {
    marginBottom: 20,
    gap: 12,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalInfoText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  modalDescriptionContainer: {
    marginBottom: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalDescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  modalButtonRow: {
    gap: 12,
  },
  modalEnrollButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalEnrollButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalUnenrollButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalUnenrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;

