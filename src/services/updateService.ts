import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

export interface UpdateInfo {
  isAvailable: boolean;
  isUpdatePending: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  manifest?: Updates.Manifest;
  error?: Error;
}

/**
 * Check for available updates
 */
export const checkForUpdates = async (): Promise<UpdateInfo> => {
  try {
    // Only check for updates in production builds
    if (__DEV__) {
      return {
        isAvailable: false,
        isUpdatePending: false,
        isChecking: false,
        isDownloading: false,
      };
    }

    if (!Updates.isEnabled) {
      return {
        isAvailable: false,
        isUpdatePending: false,
        isChecking: false,
        isDownloading: false,
      };
    }

    const update = await Updates.checkForUpdateAsync();
    
    return {
      isAvailable: update.isAvailable,
      isUpdatePending: update.isAvailable && update.manifest !== null,
      isChecking: false,
      isDownloading: false,
      manifest: update.manifest || undefined,
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return {
      isAvailable: false,
      isUpdatePending: false,
      isChecking: false,
      isDownloading: false,
      error: error as Error,
    };
  }
};

/**
 * Download and apply the update
 */
export const downloadAndApplyUpdate = async (): Promise<boolean> => {
  try {
    if (__DEV__ || !Updates.isEnabled) {
      return false;
    }

    const result = await Updates.fetchUpdateAsync();
    
    if (result.isNew) {
      // Update downloaded, reload app to apply
      await Updates.reloadAsync();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error downloading update:', error);
    return false;
  }
};

/**
 * Get current update info
 */
export const getUpdateInfo = (): {
  updateId: string | null;
  createdAt: Date | null;
  runtimeVersion: string | null;
  channel: string | null;
} => {
  if (__DEV__ || !Updates.isEnabled) {
    return {
      updateId: null,
      createdAt: null,
      runtimeVersion: null,
      channel: null,
    };
  }

  return {
    updateId: Updates.updateId || null,
    createdAt: Updates.createdAt || null,
    runtimeVersion: Updates.runtimeVersion || null,
    channel: Updates.channel || null,
  };
};

