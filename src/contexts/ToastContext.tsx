import React, { createContext, useContext, useState, useCallback } from 'react';
import Popup, { PopupType } from '../components/Popup';

interface PopupContextType {
  showPopup: (message: string, type?: PopupType, title?: string, duration?: number) => void;
  showSuccess: (message: string, title?: string, duration?: number) => void;
  showError: (message: string, title?: string, duration?: number) => void;
  showInfo: (message: string, title?: string, duration?: number) => void;
  showConfirm: (
    message: string,
    onConfirm: () => void,
    title?: string,
    confirmText?: string,
    cancelText?: string
  ) => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('useToast must be used within a PopupProvider');
  }
  return context;
};

interface PopupState {
  title?: string;
  message: string;
  type: PopupType;
  visible: boolean;
  duration?: number;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface PopupProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<PopupProviderProps> = ({ children }) => {
  const [popup, setPopup] = useState<PopupState>({
    message: '',
    type: 'info',
    visible: false,
    duration: 3000,
  });

  const showPopup = useCallback(
    (message: string, type: PopupType = 'info', title?: string, duration: number = 3000) => {
      setPopup({
        message,
        type,
        title,
        visible: true,
        duration,
      });
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, title: string = 'Success', duration: number = 3000) => {
      showPopup(message, 'success', title, duration);
    },
    [showPopup]
  );

  const showError = useCallback(
    (message: string, title: string = 'Error', duration: number = 0) => {
      showPopup(message, 'error', title, duration);
    },
    [showPopup]
  );

  const showInfo = useCallback(
    (message: string, title: string = 'Info', duration: number = 3000) => {
      showPopup(message, 'info', title, duration);
    },
    [showPopup]
  );

  const showConfirm = useCallback(
    (
      message: string,
      onConfirm: () => void,
      title: string = 'Confirm',
      confirmText: string = 'Confirm',
      cancelText: string = 'Cancel'
    ) => {
      setPopup({
        message,
        type: 'confirm',
        title,
        visible: true,
        onConfirm,
        confirmText,
        cancelText,
        duration: 0,
      });
    },
    []
  );

  const hidePopup = useCallback(() => {
    setPopup((prev) => ({ ...prev, visible: false, onConfirm: undefined }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (popup.onConfirm) {
      popup.onConfirm();
    }
    hidePopup();
  }, [popup.onConfirm, hidePopup]);

  return (
    <PopupContext.Provider value={{ showPopup, showSuccess, showError, showInfo, showConfirm }}>
      {children}
      <Popup
        title={popup.title}
        message={popup.message}
        type={popup.type}
        visible={popup.visible}
        onHide={hidePopup}
        onConfirm={popup.type === 'confirm' ? handleConfirm : undefined}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        duration={popup.duration}
      />
    </PopupContext.Provider>
  );
};

