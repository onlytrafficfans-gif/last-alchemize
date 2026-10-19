import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CRYSTAL_BALL_IMAGE } from './shared';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AuthShellProps {
  children: React.ReactNode;
  /** Optional glow node rendered behind the form (used by the cinematic intro). */
  glow?: React.ReactNode;
}

/**
 * Full-screen crystal-ball background shared by the login and signup screens.
 * Preserves the original Alchemize brand artwork with layered midnight-purple
 * overlays for readability, plus safe-area + keyboard-aware layout.
 */
export default function AuthShell({ children, glow }: AuthShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Original crystal-ball background artwork */}
      <Image
        source={CRYSTAL_BALL_IMAGE}
        style={styles.backgroundImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
        transition={0}
      />

      {/* Atmospheric midnight-purple overlays for readability */}
      <LinearGradient
        colors={['rgba(8,2,20,0.35)', 'rgba(8,2,20,0.55)', 'rgba(8,2,20,0.88)', '#080214']}
        locations={[0, 0.35, 0.62, 0.85]}
        style={styles.gradient}
      />
      {/* Subtle violet vignette at the top for depth */}
      <LinearGradient
        colors={['rgba(76,29,149,0.18)', 'transparent']}
        locations={[0, 0.5]}
        style={styles.topGlow}
      />

      {glow}

      <View style={[styles.content, { paddingTop: insets.top + 8 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080214',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.62,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.4,
  },
  content: {
    flex: 1,
  },
});
