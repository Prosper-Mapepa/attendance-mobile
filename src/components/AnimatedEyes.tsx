import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface AnimatedEyesProps {
  size?: number;
  className?: string;
}

const AnimatedEyes: React.FC<AnimatedEyesProps> = ({ size = 24 }) => {
  const [blink, setBlink] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const blinkAnimation = new Animated.Value(1);
  const pupilAnimation = new Animated.Value(0);

  useEffect(() => {
    // Blinking animation
    const blinkInterval = setInterval(() => {
      setBlink(true);
      Animated.sequence([
        Animated.timing(blinkAnimation, {
          toValue: 0.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => setBlink(false), 200);
    }, 3000 + Math.random() * 2000);

    // Pupil movement animation
    const pupilInterval = setInterval(() => {
      const newOffset = {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 2,
      };
      setPupilOffset(newOffset);
      
      Animated.timing(pupilAnimation, {
        toValue: newOffset.x,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, 2000 + Math.random() * 3000);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(pupilInterval);
    };
  }, []);

  const eyeSize = size;
  const pupilSize = eyeSize * 0.4;
  const pupilRadius = pupilSize / 2;

  return (
    <View style={styles.container}>
      <View style={styles.eyesContainer}>
        {/* Left Eye */}
        <View style={[styles.eye, { width: eyeSize, height: eyeSize }]}>
          <Animated.View
            style={[
              styles.pupil,
              {
                width: blink ? 2 : pupilSize,
                height: blink ? 2 : pupilSize,
                borderRadius: blink ? 1 : pupilRadius,
                backgroundColor: blink ? '#8B0000' : '#4ECDC4',
                transform: [
                  { translateX: pupilOffset.x },
                  { translateY: pupilOffset.y },
                  { scaleY: blinkAnimation },
                ],
              },
            ]}
          />
          {!blink && (
            <View
              style={[
                styles.highlight,
                {
                  width: pupilRadius * 0.6,
                  height: pupilRadius * 0.6,
                  borderRadius: pupilRadius * 0.3,
                },
              ]}
            />
          )}
        </View>

        {/* Right Eye */}
        <View style={[styles.eye, { width: eyeSize, height: eyeSize }]}>
          <Animated.View
            style={[
              styles.pupil,
              {
                width: blink ? 2 : pupilSize,
                height: blink ? 2 : pupilSize,
                borderRadius: blink ? 1 : pupilRadius,
                backgroundColor: blink ? '#8B0000' : '#FF6B6B',
                transform: [
                  { translateX: pupilOffset.x },
                  { translateY: pupilOffset.y },
                  { scaleY: blinkAnimation },
                ],
              },
            ]}
          />
          {!blink && (
            <View
              style={[
                styles.highlight,
                {
                  width: pupilRadius * 0.6,
                  height: pupilRadius * 0.6,
                  borderRadius: pupilRadius * 0.3,
                },
              ]}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  eye: {
    backgroundColor: '#fff',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#8B0000',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pupil: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlight: {
    position: 'absolute',
    backgroundColor: '#fff',
    opacity: 0.8,
    top: '25%',
    left: '30%',
  },
});

export default AnimatedEyes;
