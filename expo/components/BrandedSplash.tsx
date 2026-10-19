import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

/**
 * Premium branded splash shown while auth/subscription boot completes.
 * Preserves the original app background (#0c0520) and splash icon, adding
 * the app wordmark, a soft glow, and a gentle entrance + breathing animation.
 */
export default function BrandedSplash() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance: fade + lift the whole stack in.
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Expanding glow ring behind the icon.
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Gentle breathing scale on the icon itself.
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.06,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim, glowAnim, breatheAnim]);

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.4],
  });
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.45],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0c0520', '#0a0418', '#0c0520']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.iconStack}>
          {/* Soft glow ring */}
          <Animated.View
            style={[
              styles.glow,
              {
                transform: [{ scale: glowScale }],
                opacity: glowOpacity,
              },
            ]}
          />
          {/* Breathing icon */}
          <Animated.View style={{ transform: [{ scale: breatheAnim }] }}>
            <Image
              source={require('../assets/images/splash-icon.png')}
              style={styles.icon}
              contentFit="contain"
            />
          </Animated.View>
        </View>

        <Text style={styles.wordmark}>Alchemize</Text>
        <Text style={styles.tagline}>Transform your life</Text>
      </Animated.View>
    </View>
  );
}

const GLOW_SIZE = 220;
const ICON_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0c0520',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconStack: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  glow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: '#7c5cff',
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
