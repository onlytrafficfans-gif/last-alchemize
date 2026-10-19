import React from 'react';
import { ActivityIndicator, StyleSheet, View, Platform, Text } from 'react-native';
import { TouchableOpacity } from '@/components/HapticTouchable';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from './useAuthMotion';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/**
 * Premium gradient submit button with a press-scale microinteraction and a
 * light haptic on tap. Respects Reduce Motion (no scale animation).
 */
export default function AuthButton({
  label,
  onPress,
  loading,
  disabled,
  accessibilityLabel,
}: AuthButtonProps) {
  const reduced = useReducedMotion();
  const [scale, setScale] = React.useState(1);

  const handlePressIn = () => {
    if (reduced || disabled || loading) return;
    setScale(0.97);
  };
  const handlePressOut = () => setScale(1);

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      style={[styles.wrap, { transform: [{ scale }] }]}
    >
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View style={styles.inner}>
            <View style={styles.labelWrap}>
              <Text style={styles.label}>{label}</Text>
            </View>
            <ChevronRight color="#fff" size={19} strokeWidth={2.5} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelWrap: {},
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
  },
});
