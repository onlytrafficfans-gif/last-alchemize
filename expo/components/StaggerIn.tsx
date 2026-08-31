import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface StaggerInProps {
  index: number;
  children: React.ReactNode;
  style?: ViewStyle;
  /** Delay per index, in ms. Keep small — this is a reveal, not a wait. */
  staggerMs?: number;
}

/**
 * Wraps a list/grid item in a fade + rise-in reveal, staggered by index.
 * Mounting everything instantly reads as static; a short cascade reads as
 * alive without adding any real latency (each item is already rendered,
 * this only animates its opacity/transform in).
 */
export default function StaggerIn({ index, children, style, staggerMs = 60 }: StaggerInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const delay = Math.min(index, 8) * staggerMs;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, speed: 14, bounciness: 4, useNativeDriver: true }),
    ]).start();
  }, [index, staggerMs, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
