import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';

interface LogoProps {
  size?: number;
  variant?: 'dark' | 'light' | 'color' | 'simple';
}

export default function Logo({ size = 48, variant = 'color' }: LogoProps) {
  const colors = {
    dark: {
      primary: '#8B0000', // Deep Red
      secondary: '#1F2937',
      checkmark: '#FFFFFF',
    },
    light: {
      primary: '#FFFFFF',
      secondary: '#F3F4F6',
      checkmark: '#8F1A27',
    },
    color: {
      primary: '#8B0000', // Deep Red
      secondary: '#FDB913', // CMU Gold
      checkmark: '#FFFFFF',
    },
    simple: {
      checkmark: '#FBBC04', // Gold checkmark only
    }
  };

  // Simple variant - logo-style gold checkmark with border
  if (variant === 'simple') {
    const simpleColor = colors.simple;
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Outer ring for depth */}
          <Circle
            cx="50"
            cy="50"
            r="48"
            stroke={simpleColor.checkmark}
            strokeWidth="1.5"
            fill="none"
            opacity="0.3"
          />
          {/* Main border circle */}
          <Circle
            cx="50"
            cy="50"
            // r="42"
            stroke={simpleColor.checkmark}
            strokeWidth="4"
            fill="none"
          />
          {/* Inner accent circle */}
          <Circle
            cx="50"
            cy="50"
            r="36"
            stroke={simpleColor.checkmark}
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          {/* Checkmark */}
          <Path
            d="M 32 50 L 43 62 L 68 38"
            stroke={simpleColor.checkmark}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  // For non-simple variants, we know they have primary property
  const color = colors[variant] as { primary: string; secondary: string; checkmark: string };

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Outer glow circle */}
        <Circle
          cx="50"
          cy="50"
          r="45"
          fill={color.primary}
          opacity="0.1"
        />
        
        {/* Main circle */}
        <Circle
          cx="50"
          cy="50"
          // r="35"
          fill={color.primary}
        />
        
        {/* Checkmark */}
        <Path
          d="M 32 50 L 43 62 L 68 38"
          stroke={color.checkmark}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

