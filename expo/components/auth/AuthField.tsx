import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { TouchableOpacity } from '@/components/HapticTouchable';
import { Eye, EyeOff } from 'lucide-react-native';

interface AuthFieldProps {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'visible-password';
  autoComplete?: string;
  accessibilityLabel: string;
  returnKeyType?: 'done' | 'next' | 'go' | 'send';
  onSubmitEditing?: () => void;
  hasError?: boolean;
  style?: ViewStyle;
}

/**
 * Frosted-glass auth input field with leading icon, optional visibility toggle,
 * and an error state. Reused across login and signup.
 */
export default function AuthField({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  autoComplete,
  accessibilityLabel,
  returnKeyType,
  onSubmitEditing,
  hasError,
  style,
}: AuthFieldProps) {
  const [hidden, setHidden] = React.useState(!!secureTextEntry);

  return (
    <View
      style={[
        styles.field,
        hasError && styles.fieldError,
        style,
      ]}
      accessibilityRole={undefined}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.32)"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={hidden && secureTextEntry ? true : false}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoComplete={autoComplete as any}
        accessibilityLabel={accessibilityLabel}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoCorrect={false}
        spellCheck={false}
      />
      {secureTextEntry && (
        <TouchableOpacity
          onPress={() => setHidden((h) => !h)}
          style={styles.eyeBtn}
          activeOpacity={0.6}
          accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          accessibilityRole="button"
        >
          {hidden ? (
            <Eye color="rgba(196,181,253,0.45)" size={17} />
          ) : (
            <EyeOff color="rgba(196,181,253,0.6)" size={17} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.07)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.16)',
    height: 54,
    marginBottom: 12,
  },
  fieldError: {
    borderColor: 'rgba(248,113,113,0.55)',
    backgroundColor: 'rgba(248,113,113,0.06)',
  },
  iconWrap: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: '100%',
    paddingRight: 10,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
  },
});
