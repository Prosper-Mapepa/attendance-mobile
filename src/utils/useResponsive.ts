import { useState, useEffect } from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

interface ResponsiveValues {
  isTablet: boolean;
  isPhone: boolean;
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  maxContentWidth: number;
  horizontalPadding: number;
  scale: number;
}

// Tablet breakpoint: typically 600dp or more width
const TABLET_BREAKPOINT = 600;

export const useResponsive = (): ResponsiveValues => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({ window }: { window: ScaledSize }) => {
        setDimensions({ width: window.width, height: window.height });
      }
    );

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;
  
  // Consider it a tablet if width is >= 600dp (typical tablet breakpoint)
  // Or if it's an iPad (iOS) or has a large screen (Android)
  const isTablet = width >= TABLET_BREAKPOINT || 
    (Platform.OS === 'ios' && (Platform.isPad || width >= TABLET_BREAKPOINT)) ||
    (Platform.OS === 'android' && width >= TABLET_BREAKPOINT);
  
  const isPhone = !isTablet;

  // For tablets, constrain content width for better readability
  // For phones, use full width with padding
  const maxContentWidth = isTablet 
    ? (isLandscape ? 900 : 600) // Wider in landscape, narrower in portrait
    : width;

  // Responsive padding
  const horizontalPadding = isTablet 
    ? (isLandscape ? 40 : 32)
    : 20;

  // Scale factor for adjusting font sizes and spacing
  const scale = isTablet 
    ? (isLandscape ? 1.1 : 1.0)
    : 1.0;

  return {
    isTablet,
    isPhone,
    width,
    height,
    isLandscape,
    isPortrait,
    maxContentWidth,
    horizontalPadding,
    scale,
  };
};
