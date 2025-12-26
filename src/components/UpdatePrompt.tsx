import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkForUpdates, downloadAndApplyUpdate } from '../services/updateService';
import { useToast } from '../contexts/ToastContext';

interface UpdatePromptProps {
  autoCheck?: boolean;
  autoUpdate?: boolean;
  onUpdateComplete?: () => void;
}

const UpdatePrompt: React.FC<UpdatePromptProps> = ({
  autoCheck = true,
  autoUpdate = false,
  onUpdateComplete,
}) => {
  const [visible, setVisible] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    if (autoCheck) {
      checkForUpdate();
    }
  }, [autoCheck]);

  const checkForUpdate = async () => {
    setIsChecking(true);
    try {
      const updateInfo = await checkForUpdates();
      
      if (updateInfo.isAvailable) {
        setUpdateAvailable(true);
        setUpdateMessage('A new version of AttendIQ is available!');
        
        if (autoUpdate) {
          // Automatically download and apply update
          await handleUpdate();
        } else {
          // Show prompt to user
          setVisible(true);
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpdate = async () => {
    setIsDownloading(true);
    try {
      const success = await downloadAndApplyUpdate();
      
      if (success) {
        showSuccess('Update downloaded! Restarting app...');
        if (onUpdateComplete) {
          onUpdateComplete();
        }
        // App will reload automatically
      } else {
        showError('No update available or update failed');
        setVisible(false);
      }
    } catch (error) {
      console.error('Error updating app:', error);
      showError('Failed to update app. Please try again later.');
      setVisible(false);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLater = () => {
    setVisible(false);
  };

  if (isChecking && !visible) {
    return null; // Don't show anything while checking
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleLater}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-download-outline" size={48} color="#8B0000" />
          </View>
          
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.message}>
            {updateMessage || 'A new version of AttendIQ is available with improvements and bug fixes.'}
          </Text>
          
          <Text style={styles.subMessage}>
            Would you like to update now? The app will restart after the update.
          </Text>

          {isDownloading && (
            <View style={styles.downloadingContainer}>
              <ActivityIndicator size="small" color="#8B0000" />
              <Text style={styles.downloadingText}>Downloading update...</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.laterButton]}
              onPress={handleLater}
              disabled={isDownloading}
            >
              <Text style={styles.laterButtonText}>Later</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.updateButton, isDownloading && styles.buttonDisabled]}
              onPress={handleUpdate}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.updateButtonText}>Update Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff9e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  subMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  downloadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  downloadingText: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  laterButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  laterButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#8B0000',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default UpdatePrompt;

