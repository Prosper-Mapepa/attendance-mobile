import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type PopupType = 'success' | 'error' | 'info' | 'confirm';

interface PopupProps {
  title?: string;
  message: string;
  type: PopupType;
  visible: boolean;
  onHide: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  duration?: number;
}

const Popup: React.FC<PopupProps> = ({
  title,
  message,
  type,
  visible,
  onHide,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  duration,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide for non-confirmation popups
      if (type !== 'confirm' && duration && duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      // Reset animations when hidden
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, type, duration]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    handleClose();
  };

  const getPopupStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          iconColor: '#28a745',
          iconBg: '#e8f5e9',
          buttonColor: '#28a745',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          iconColor: '#8B0000',
          iconBg: '#ffebee',
          buttonColor: '#8B0000',
        };
      case 'info':
        return {
          icon: 'information-circle' as const,
          iconColor: '#FFD700',
          iconBg: '#fff9e6',
          buttonColor: '#FFD700',
        };
      case 'confirm':
        return {
          icon: 'help-circle' as const,
          iconColor: '#8B0000',
          iconBg: '#fff9e6',
          buttonColor: '#8B0000',
        };
      default:
        return {
          icon: 'information-circle' as const,
          iconColor: '#8B0000',
          iconBg: '#fff9e6',
          buttonColor: '#8B0000',
        };
    }
  };

  const popupStyles = getPopupStyles();
  const isConfirm = type === 'confirm';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={isConfirm ? undefined : handleClose}
        />
        <Animated.View
          style={[
            styles.popupContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.popup}>
            <View style={[styles.iconContainer, { backgroundColor: popupStyles.iconBg }]}>
              <Ionicons
                name={popupStyles.icon}
                size={48}
                color={popupStyles.iconColor}
              />
            </View>

            {title && (
              <Text style={styles.title}>{title}</Text>
            )}

            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonContainer}>
              {isConfirm ? (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleClose}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: popupStyles.buttonColor }]}
                    onPress={handleConfirm}
                  >
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.singleButton, { backgroundColor: popupStyles.buttonColor }]}
                  onPress={handleClose}
                >
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  popupContainer: {
    width: '85%',
    maxWidth: 400,
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
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
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Popup;

