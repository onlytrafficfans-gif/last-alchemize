import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';

interface SkeletonBlockProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * A single shimmering placeholder block. Compose several of these into a
 * layout that mirrors the real content's shape (see SkeletonLoader below) —
 * a generic centered spinner tells the user nothing about what's loading;
 * a shaped skeleton does.
 */
export function SkeletonBlock({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonBlockProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: 'rgba(255,255,255,0.08)', opacity },
        style,
      ]}
    />
  );
}

interface SkeletonLoaderProps {
  /** Shape preset matching a common screen layout. */
  variant?: 'stats' | 'list' | 'card';
  rows?: number;
}

/**
 * Shaped skeleton placeholders for the two most common loading layouts in
 * this app: a row of stat rings/tiles, and a vertical list of cards.
 */
export default function SkeletonLoader({ variant = 'list', rows = 3 }: SkeletonLoaderProps) {
  if (variant === 'stats') {
    return (
      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.statItem}>
            <SkeletonBlock width={72} height={72} borderRadius={36} />
            <SkeletonBlock width={40} height={10} style={styles.statLabel} />
          </View>
        ))}
      </View>
    );
  }

  if (variant === 'card') {
    return (
      <View style={styles.card}>
        <SkeletonBlock width="60%" height={18} style={{ marginBottom: 12 }} />
        <SkeletonBlock width="90%" height={12} style={{ marginBottom: 8 }} />
        <SkeletonBlock width="40%" height={12} />
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.listRow}>
          <SkeletonBlock width={40} height={40} borderRadius={20} />
          <View style={styles.listRowText}>
            <SkeletonBlock width="70%" height={14} style={{ marginBottom: 6 }} />
            <SkeletonBlock width="40%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    marginTop: 8,
  },
  card: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  list: {
    gap: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listRowText: {
    flex: 1,
  },
});
