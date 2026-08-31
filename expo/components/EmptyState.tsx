import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from '@/components/HapticTouchable';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  accentColor?: string;
}

/**
 * Shared empty-state layout so every list screen (goals, habits, fitness,
 * financial, etc.) stops hand-rolling its own icon/title/subtitle block with
 * slightly different spacing and copy tone.
 */
export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  accentColor = '#6366f1',
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: `${accentColor}1f`, borderColor: `${accentColor}40` }]}>
        <Icon color={accentColor} size={28} strokeWidth={1.75} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: accentColor }]}
          onPress={onAction}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600' as const,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 19,
  },
  actionButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
