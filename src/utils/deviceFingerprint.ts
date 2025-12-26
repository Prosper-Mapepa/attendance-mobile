import { Platform, Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';

export interface DeviceFingerprintData {
  deviceModel: string;
  osVersion: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  batteryLevel?: number;
  isCharging?: boolean;
  networkSSID?: string;
}

export async function collectDeviceFingerprint(): Promise<DeviceFingerprintData> {
  const { width, height } = Dimensions.get('window');
  const pixelRatio = PixelRatio.get();
  
  const fingerprint: DeviceFingerprintData = {
    deviceModel: Device.modelName || 'Unknown Device',
    osVersion: `${Platform.OS} ${Platform.Version}`,
    userAgent: `AttendIQ-Mobile/${Platform.OS}/${Platform.Version}`,
    screenResolution: `${Math.round(width * pixelRatio)}x${Math.round(height * pixelRatio)}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: Intl.DateTimeFormat().resolvedOptions().locale,
  };

  // Battery information is not available in expo-device v7+
  // These fields remain optional and will be undefined

  // Add network information (requires additional permissions)
  try {
    // This would require additional setup for network info
    // fingerprint.networkSSID = await getCurrentNetworkSSID();
  } catch (error) {
    console.log('Network info not available');
  }

  return fingerprint;
}

export function generateDeviceId(fingerprint: DeviceFingerprintData): string {
  const dataString = JSON.stringify({
    deviceModel: fingerprint.deviceModel,
    osVersion: fingerprint.osVersion,
    screenResolution: fingerprint.screenResolution,
    timezone: fingerprint.timezone,
    language: fingerprint.language,
  });
  
  // Simple hash function (in production, use a proper crypto library)
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}
