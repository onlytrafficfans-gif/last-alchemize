import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Text,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CRYSTAL_BALL_IMAGE, INTRO_SEEN_KEY } from '@/components/auth/shared';
import { useReducedMotion } from '@/components/auth/useAuthMotion';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Mode = 'loading' | 'cinematic';

interface BrandedSplashProps {
  /** 'loading' = persistent boot view while auth initializes.
   *  'cinematic' = one-time brand sequence that calls onComplete when done. */
  mode?: Mode;
  onComplete?: () => void;
}

/**
 * Premium branded splash. Two roles:
 *  1. A persistent loading view shown while auth/subscription boots.
 *  2. A short, skippable cinematic intro played once per cold launch for
 *     unauthenticated users, transitioning smoothly into authentication.
 *
 * Preserves the original crystal-ball background and Alchemize identity.
 * Respects iOS Reduce Motion (opacity-only fades, no transforms) and is
 * skippable by tap. Returning users (intro already seen) get an abbreviated
 * sequence so normal startup is never delayed.
 */
export default function BrandedSplash({ mode = 'loading', onComplete }: BrandedSplashProps) {
  const reduced = useReducedMotion();
  const cinematic = mode === 'cinematic' && !!onComplete;

  const bgAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const wordmarkAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (cinematic) {
      AsyncStorage.getItem(INTRO_SEEN_KEY)
        .then((v) => {
          if (!cancelled) setReturning(v === 'true');
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [cinematic]);

  useEffect(() => {
    // Always-on ambient motion (used in both modes).
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.05,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    breathe.start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    glow.start();

    return () => {
      breathe.stop();
      glow.stop();
    };
  }, [breatheAnim, glowAnim]);

  // Entrance + cinematic sequence.
  useEffect(() => {
    if (!cinematic) {
      // Loading mode: a single calm fade-in of the whole stack.
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: reduced ? 200 : 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      Animated.timing(wordmarkAnim, {
        toValue: 1,
        duration: reduced ? 200 : 600,
        delay: 100,
        useNativeDriver: true,
      }).start();
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: reduced ? 200 : 600,
        delay: 300,
        useNativeDriver: true,
      }).start();
      return;
    }

    // Cinematic mode.
    const fast = returning; // returning users get the abbreviated sequence
    const timings = fast
      ? { bg: 250, word: 350, wordDelay: 80, tag: 350, tagDelay: 260, hold: 350 }
      : { bg: 500, word: 700, wordDelay: 250, tag: 600, tagDelay: 900, hold: 500 };

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: reduced ? 200 : timings.bg,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(wordmarkAnim, {
        toValue: 1,
        duration: reduced ? 200 : timings.word,
        delay: timings.wordDelay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: reduced ? 200 : timings.tag,
        delay: timings.tagDelay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];

    animations.forEach((a) => a.start());

    const total = timings.bg + timings.tagDelay + timings.tag + timings.hold;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(INTRO_SEEN_KEY, 'true').catch(() => {});
      onComplete?.();
    }, total);

    return () => {
      clearTimeout(timer);
      animations.forEach((a) => a.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cinematic, returning, reduced]);

  const skip = () => {
    if (!cinematic) return;
    AsyncStorage.setItem(INTRO_SEEN_KEY, 'true').catch(() => {});
    onComplete?.();
  };

  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.45] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.4] });

  const wordmarkStyle = reduced
    ? { opacity: wordmarkAnim }
    : {
        opacity: wordmarkAnim,
        transform: [
          {
            translateY: wordmarkAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
          },
        ],
      };

  const taglineStyle = { opacity: taglineAnim };

  return (
    <Pressable onPress={skip} style={styles.container}>
      {/* Crystal-ball background */}
      <Animated.View style={[styles.bgWrap, { opacity: bgAnim }]}>
        <Image
          source={CRYSTAL_BALL_IMAGE}
          style={styles.background}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
        />
      </Animated.View>

      <LinearGradient
        colors={['rgba(8,2,20,0.4)', 'rgba(8,2,20,0.6)', 'rgba(8,2,20,0.9)', '#080214']}
        locations={[0, 0.35, 0.65, 0.9]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, { opacity: bgAnim }]}>
        <View style={styles.iconStack}>
          <Animated.View
            style={[
              styles.glow,
              { transform: [{ scale: glowScale }], opacity: glowOpacity },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: breatheAnim }] }}>
            <Image
              source={require('../assets/images/splash-icon.png')}
              style={styles.icon}
              contentFit="contain"
            />
          </Animated.View>
        </View>

        <Animated.View style={wordmarkStyle}>
          <Text style={styles.wordmark}>Alchemize</Text>
        </Animated.View>
        <Animated.View style={taglineStyle}>
          <Text style={styles.tagline}>Transform Your Life</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const GLOW_SIZE = 240;
const ICON_SIZE = 132;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080214',
  },
  bgWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.62,
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
    marginBottom: 30,
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
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2.5,
    marginBottom: 8,
    textShadowColor: 'rgba(139,92,246,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.7)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
});
