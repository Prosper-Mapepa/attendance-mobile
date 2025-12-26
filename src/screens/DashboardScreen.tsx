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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTour } from '../contexts/TourContext';
import { useResponsive } from '../utils/useResponsive';
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
  const navigation = useNavigation();
  const responsive = useResponsive();
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
      contentContainerStyle={responsive.isTablet ? {
        paddingHorizontal: 0,
      } : undefined}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* <View style={styles.userAvatar}>
            <Text style={styles.userInitials}>
              {user?.name 
                ? (() => {
                    const nameParts = user.name.trim().split(/\s+/);
                    if (nameParts.length >= 2) {
                      const firstInitial = nameParts[0][0]?.toUpperCase() || '';
                      const lastInitial = nameParts[nameParts.length - 1][0]?.toUpperCase() || '';
                      return `${firstInitial}${lastInitial}`;
                    }
                    return nameParts[0]?.[0]?.toUpperCase() || user.name;
                  })()
                : 'U'
              }
            </Text>
          </View> */}
          <View style={styles.userGreeting}>
            <Text style={styles.welcomeText}>Hello!</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'User'}</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.tourButton} 
            onPress={startTour}
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle" size={28} color="#8B0000" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.accountButton} 
            onPress={() => {
              // @ts-ignore - navigation type from Tab to Stack
              navigation.getParent()?.navigate('Profile');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="person-circle" size={28} color="#8B0000" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="power" size={24} color="#8B0000" />
          </TouchableOpacity>
        </View>
      </View>

    

      {/* Tabs */}
      <View style={[
        styles.tabContainer,
        responsive.isTablet && styles.tabContainerTablet
      ]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myClasses' && styles.activeTab]}
          onPress={() => {
            setActiveTab('myClasses');
            setMyClassesSearch('');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            {/* <Ionicons 
              name={activeTab === 'myClasses' ? 'book' : 'book-outline'} 
              size={20} 
              color={activeTab === 'myClasses' ? '#8B0000' : '#666'} 
              style={styles.tabIcon}
            /> */}
            <Text style={[styles.tabText, activeTab === 'myClasses' && styles.activeTabText]}>
              My Classes
            </Text>
            {/* <View style={[
              styles.tabBadge,
              activeTab === 'myClasses' && styles.tabBadgeActive
            ]}>
              <Text style={[
                styles.tabBadgeText,
                activeTab === 'myClasses' && styles.tabBadgeTextActive
              ]}>
                {enrollments.length}
              </Text>
            </View> */}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'enrollClass' && styles.activeTab]}
          onPress={() => {
            setActiveTab('enrollClass');
            setEnrollClassesSearch('');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            {/* <Ionicons 
              name={activeTab === 'enrollClass' ? 'add-circle' : 'add-circle-outline'} 
              size={20} 
              color={activeTab === 'enrollClass' ? '#8B0000' : '#666'} 
              style={styles.tabIcon}
            /> */}
            <Text style={[styles.tabText, activeTab === 'enrollClass' && styles.activeTabText]}>
              Enroll Classes
            </Text>
            {/* <View style={[
              styles.tabBadge,
              activeTab === 'enrollClass' && styles.tabBadgeActive
            ]}>
              <Text style={[
                styles.tabBadgeText,
                activeTab === 'enrollClass' && styles.tabBadgeTextActive
              ]}>
                {availableClassesToShow.length}
              </Text>
            </View> */}
          </View>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'myClasses' ? (
        <View style={[
          styles.section,
          responsive.isTablet && styles.sectionTablet
        ]}>
          <View style={[
            styles.searchContainer,
            responsive.isTablet && styles.searchContainerTablet
          ]}>
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
                Switch to "Enroll Classes" tab to browse available classes
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
            <View style={[
              responsive.isTablet ? styles.classesGrid : undefined,
              responsive.isTablet && styles.classesGridContainer
            ]}>
            {filteredMyClasses.map((classItem) => {
              const enrollment = enrollments.find(e => e.class.id === classItem.id);
              if (!enrollment) return null;
              return (
              <View key={enrollment.id} style={[
                styles.classCard,
                responsive.isTablet && styles.classCardTablet
              ]}>
                <View style={styles.classHeader}>
                  <View style={styles.classTitleRow}>
                    <Text style={styles.className}>{classItem.name}</Text>
                  </View>
                  {classItem.subject && (
                    <Text style={styles.classSubject}>{classItem.subject}</Text>
                  )}
                </View>
                {/* <View style={styles.classInfoContainer}>
                  {classItem.teacher && (
                    <View style={styles.classInfoRow}>
                      <Ionicons name="person" size={16} color="#8B0000" style={styles.infoIcon} />
                      <Text style={styles.teacherName}>{classItem.teacher.name}</Text>
                    </View>
                  )}
                  {classItem.schedule && (
                    <View style={styles.classInfoRow}>
                      <Ionicons name="time" size={16} color="#8B0000" style={styles.infoIcon} />
                      <Text style={styles.classSchedule}>{classItem.schedule}</Text>
                    </View>
                  )}
                </View> */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => setViewingClass(classItem)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="eye" size={16} color="#333" style={styles.buttonIcon} />
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.unenrollButton}
                    onPress={() => unenrollFromClass(classItem.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="remove-circle" size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.unenrollButtonText}>Unenroll</Text>
                  </TouchableOpacity>
                </View>
              </View>
              );
            })}
            </View>
          )}
        </View>
      ) : (
        <View style={[
          styles.section,
          responsive.isTablet && styles.sectionTablet
        ]}>
          <View style={[
            styles.searchContainer,
            responsive.isTablet && styles.searchContainerTablet
          ]}>
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
                Contact your Instructor to create classes
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
            <View style={[
              responsive.isTablet ? styles.classesGrid : undefined,
              responsive.isTablet && styles.classesGridContainer
            ]}>
            {filteredEnrollClasses.map((classItem) => (
              <View key={classItem.id} style={[
                styles.classCard,
                responsive.isTablet && styles.classCardTablet
              ]}>
                <View style={styles.classHeader}>
                  <View style={styles.classTitleRow}>
                    <Text style={styles.className}>{classItem.name}</Text>
                  </View>
                  {classItem.subject && (
                    <Text style={styles.classSubject}>{classItem.subject}</Text>
                  )}
                </View>
                {/* <View style={styles.classInfoContainer}>
                  {classItem.teacher && (
                    <View style={styles.classInfoRow}>
                      <Ionicons name="person" size={16} color="#8B0000" style={styles.infoIcon} />
                      <Text style={styles.teacherName}>{classItem.teacher.name}</Text>
                    </View>
                  )}
                  {classItem.schedule && (
                    <View style={styles.classInfoRow}>
                      <Ionicons name="time" size={16} color="#8B0000" style={styles.infoIcon} />
                      <Text style={styles.classSchedule}>{classItem.schedule}</Text>
                    </View>
                  )}
                </View> */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => setViewingClass(classItem)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="eye" size={16} color="#333" style={styles.buttonIcon} />
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.enrollButton,
                      enrolling === classItem.id && styles.enrollButtonDisabled,
                    ]}
                    onPress={() => enrollInClass(classItem.id)}
                    disabled={enrolling === classItem.id}
                    activeOpacity={0.8}
                  >
                    {enrolling === classItem.id ? (
                      <ActivityIndicator color="#8B0000" size="small" />
                    ) : (
                      <>
                        <Ionicons name="add-circle" size={16} color="#8B0000" style={styles.buttonIcon} />
                        <Text style={styles.enrollButtonText}>Enroll</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            </View>
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
      {/* <View style={[
        styles.section,
        responsive.isTablet && styles.sectionTablet
      ]}>
        <Text style={[
          styles.sectionTitle,
          responsive.isTablet && styles.sectionTitleTablet
        ]}>Recent Attendance</Text>
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
      </View> */}
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: '#8B0000',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  userGreeting: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  welcomeText: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.85,
    marginBottom: 2,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tourButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tourButtonText: {
    color: '#8B0000',
    fontWeight: '600',
    fontSize: 13,
  },
  accountButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutIcon: {
    marginRight: 0,
  },
  logoutText: {
    color: '#8B0000',
    fontWeight: '600',
    fontSize: 13,
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
    padding: 16,
    paddingTop: 20,
  },
  sectionTablet: {
    paddingHorizontal: 40,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  sectionTitleTablet: {
    fontSize: 22,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 0.2,
    borderColor: '#e9ecef',
    height: 48,
  },
  searchContainerTablet: {
    maxWidth: '100%',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  emptyState: {
    backgroundColor: '#f8f9fa',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  classCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  classCardTablet: {
    flex: 1,
    minWidth: 300,
    maxWidth: 400,
    marginBottom: 0,
  },
  classesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  classesGridContainer: {
    marginTop: 0,
  },
  classHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  classTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  className: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  classSubject: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginTop: 4,
  },
  classInfoContainer: {
    marginBottom: 16,
    gap: 10,
  },
  classInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    marginRight: 2,
  },
  classSchedule: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  viewButtonText: {
    color: '#495057',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 0,
  },
  attendanceCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    paddingHorizontal: 0,
    // paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tabContainerTablet: {
    paddingHorizontal: 0,
    maxWidth: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    backgroundColor: 'transparent',
    marginHorizontal: 0,
  },
  activeTab: {
    borderBottomColor: '#8B0000',
    backgroundColor: '#fff5f5',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabIcon: {
    marginRight: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.2,
  },
  activeTabText: {
    color: '#8B0000',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  tabBadgeActive: {
    backgroundColor: '#8B0000',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
  teacherName: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  enrollButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  enrollButtonDisabled: {
    opacity: 0.7,
  },
  enrollButtonText: {
    color: '#8B0000',
    fontSize: 15,
    fontWeight: '700',
  },
  unenrollButton: {
    flex: 1,
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  unenrollButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
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

