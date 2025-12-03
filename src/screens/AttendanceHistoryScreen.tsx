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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../config/api';

interface AttendanceRecord {
  id: string;
  timestamp: string;
  session: {
    id: string;
    otp: string;
    createdAt: string;
    validUntil: string;
    class: {
      id: string;
      name: string;
      subject?: string;
    };
  };
}

const AttendanceHistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const { showError } = useToast();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  const fetchAttendanceRecords = async () => {
    try {
      const response = await api.get('/attendance');
      setAttendanceRecords(response.data);
    } catch (error: any) {
      showError('Failed to fetch attendance records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendanceRecords();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAttendanceStats = () => {
    const totalRecords = attendanceRecords.length;
    const thisWeek = attendanceRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return recordDate >= weekAgo;
    }).length;
    
    const thisMonth = attendanceRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return recordDate >= monthAgo;
    }).length;

    return { totalRecords, thisWeek, thisMonth };
  };

  const groupRecordsByClass = () => {
    const grouped: { [key: string]: AttendanceRecord[] } = {};
    
    attendanceRecords.forEach(record => {
      const classId = record.session.class.id;
      if (!grouped[classId]) {
        grouped[classId] = [];
      }
      grouped[classId].push(record);
    });

    // Sort records within each class by timestamp (most recent first)
    Object.keys(grouped).forEach(classId => {
      grouped[classId].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });

    return grouped;
  };

  const toggleClass = (classId: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  const isClassExpanded = (classId: string) => {
    return expandedClasses.has(classId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading attendance records...</Text>
      </View>
    );
  }

  const stats = getAttendanceStats();
  const groupedRecords = groupRecordsByClass();
  const classIds = Object.keys(groupedRecords);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalRecords}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.thisWeek}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.thisMonth}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      {/* Attendance Records by Class */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Attendance History ({attendanceRecords.length})
        </Text>
        {attendanceRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No attendance records</Text>
            <Text style={styles.emptySubtext}>
              Mark attendance when your instructor starts a session
            </Text>
          </View>
        ) : (
          classIds.map((classId) => {
            const records = groupedRecords[classId];
            const firstRecord = records[0];
            const className = firstRecord.session.class.name;
            const classSubject = firstRecord.session.class.subject;
            const isExpanded = isClassExpanded(classId);

            return (
              <View key={classId} style={styles.classSection}>
                <TouchableOpacity
                  style={styles.classHeader}
                  onPress={() => toggleClass(classId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.classHeaderContent}>
                    <Text style={styles.classSectionTitle}>{className}</Text>
                    {classSubject && (
                      <Text style={styles.classSectionSubject}>{classSubject}</Text>
                    )}
                  </View>
                  <View style={styles.classHeaderRight}>
                    <View style={styles.classCountBadge}>
                      <Text style={styles.classCountText}>{records.length}</Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                      size={24}
                      color="#8B0000"
                      style={styles.dropdownIcon}
                    />
                  </View>
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.recordsContainer}>
                    {records.map((record) => (
                      <View key={record.id} style={styles.recordCard}>
                        <View style={styles.recordDetails}>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date:</Text>
                            <Text style={styles.detailValue}>{formatDate(record.timestamp)}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Time:</Text>
                            <Text style={styles.detailValue}>{formatTime(record.timestamp)}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>OTP:</Text>
                            <Text style={styles.detailValue}>{record.session.otp}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Session:</Text>
                            <Text style={styles.detailValue}>
                              {formatTime(record.session.createdAt)} - {formatTime(record.session.validUntil)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>✓ Present</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
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
  classSection: {
    marginBottom: 24,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    borderRadius: 8,
  },
  classHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  classHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  recordsContainer: {
    marginTop: 4,
  },
  classSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  classSectionSubject: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '600',
  },
  classCountBadge: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 36,
    alignItems: 'center',
  },
  classCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recordCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  recordDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#28a745',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AttendanceHistoryScreen;

