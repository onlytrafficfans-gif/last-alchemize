import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Mail, Lock, User, Globe, Check, ChevronLeft } from 'lucide-react-native';
import { TouchableOpacity } from '@/components/HapticTouchable';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '@/contexts/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AUTH_STRINGS,
  isValidEmail,
  getPasswordStrength,
  TERMS_ACCEPTED_KEY,
  type Language,
} from '@/components/auth/shared';
import { useReducedMotion } from '@/components/auth/useAuthMotion';
import AuthShell from '@/components/auth/AuthShell';
import AuthField from '@/components/auth/AuthField';
import AuthButton from '@/components/auth/AuthButton';
import TermsModal from '@/components/auth/TermsModal';

export default function SignupScreen() {
  const router = useRouter();
  const { signup, loginWithApple } = useAuth();
  const reduced = useReducedMotion();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [checkingTerms, setCheckingTerms] = useState(true);

  const t = AUTH_STRINGS[language];
  const strength = getPasswordStrength(password, t.strengthLabels);
  const confirmTouched = confirmPassword.length > 0;
  const confirmMismatch = confirmTouched && password !== confirmPassword;

  // Entrance animations
  const brandAnim = useRef(new Animated.Value(0)).current;
  const headlineAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const fieldAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const socialAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.info('[Startup] SIGNUP_SCREEN_RENDERED');
    if (Platform.OS !== 'web') {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAuthAvailable)
        .catch(() => setAppleAuthAvailable(false));
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(TERMS_ACCEPTED_KEY);
        if (v === 'true') setTermsAccepted(true);
      } catch {
        /* ignore */
      } finally {
        setCheckingTerms(false);
      }
    })();
  }, []);

  useEffect(() => {
    const fade = (a: Animated.Value, delay: number, dur = 500) =>
      Animated.timing(a, {
        toValue: 1,
        duration: reduced ? 200 : dur,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    const anims = [
      fade(brandAnim, 0),
      fade(headlineAnim, 120),
      fade(cardAnim, 220),
      ...fieldAnims.map((a, i) => fade(a, 320 + i * 80, 450)),
      fade(buttonAnim, 320 + fieldAnims.length * 80 + 60),
      fade(socialAnim, 320 + fieldAnims.length * 80 + 160),
      fade(footerAnim, 320 + fieldAnims.length * 80 + 240),
    ];
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lift = (a: Animated.Value) =>
    reduced
      ? { opacity: a }
      : {
          opacity: a,
          transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        };

  const showError = () => {
    Animated.sequence([
      Animated.timing(errorOpacity, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.timing(errorOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      ]),
    ]).start();
  };

  const handleSignup = async () => {
    if (!termsAccepted) {
      setShowTermsModal(true);
      setError(t.termsRequired);
      showError();
      return;
    }
    if (!name || !email || !password || !confirmPassword) {
      setError(t.fillFields);
      showError();
      return;
    }
    if (!isValidEmail(email)) {
      setError(t.invalidEmail);
      showError();
      return;
    }
    if (password.length < 6) {
      setError(t.weakPassword);
      showError();
      return;
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      showError();
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await signup(email, password, name);
    setIsLoading(false);
    if (result.success) {
      router.replace('/');
    } else {
      setError(result.error || 'Signup failed');
      showError();
    }
  };

  const handleApple = async () => {
    setAppleLoading(true);
    setError('');
    const result = await loginWithApple();
    setAppleLoading(false);
    if (result.success) {
      router.replace('/');
    } else if (result.error && result.error !== 'Sign in was cancelled') {
      setError(result.error);
      showError();
    }
  };

  const acceptTerms = async () => {
    try {
      await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, 'true');
    } catch {
      /* ignore */
    }
    setTermsAccepted(true);
    setShowTermsModal(false);
  };

  const showAppleNative = appleAuthAvailable && Platform.OS !== 'web';
  const showAppleWeb = Platform.OS === 'web';

  return (
    <AuthShell>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.spacer} />

          <Animated.View style={[styles.brandSection, lift(brandAnim)]}>
            <Text style={styles.wordmark}>{t.brand}</Text>
            <Text style={styles.tagline}>{t.tagline}</Text>
          </Animated.View>

          <Animated.View style={[styles.headlineWrap, lift(headlineAnim)]}>
            <Text style={styles.headline}>{t.beginJourney}</Text>
            <Text style={styles.headlineSub}>{t.beginJourneySub}</Text>
          </Animated.View>

          <Animated.View style={[styles.cardWrap, lift(cardAnim)]}>
            <View style={styles.card}>
              <BlurView
                intensity={Platform.OS === 'web' ? 18 : 38}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cardInner}>
                <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                  <Animated.View style={lift(fieldAnims[0])}>
                    <AuthField
                      icon={<User color="rgba(167,139,250,0.55)" size={18} />}
                      placeholder={t.fullName}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      autoComplete="name"
                      accessibilityLabel={t.fullName}
                      returnKeyType="next"
                      hasError={!!error}
                    />
                  </Animated.View>

                  <Animated.View style={lift(fieldAnims[1])}>
                    <AuthField
                      icon={<Mail color="rgba(167,139,250,0.55)" size={18} />}
                      placeholder={t.email}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoComplete="email"
                      accessibilityLabel={t.email}
                      returnKeyType="next"
                      hasError={!!error}
                    />
                  </Animated.View>

                  <Animated.View style={lift(fieldAnims[2])}>
                    <AuthField
                      icon={<Lock color="rgba(167,139,250,0.55)" size={18} />}
                      placeholder={t.password}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete="new-password"
                      accessibilityLabel={t.password}
                      returnKeyType="next"
                      hasError={!!error}
                    />
                    {password.length > 0 && (
                      <View style={styles.strengthRow}>
                        {[1, 2, 3, 4].map((i) => (
                          <View
                            key={i}
                            style={[
                              styles.strengthBar,
                              {
                                backgroundColor:
                                  i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)',
                              },
                            ]}
                          />
                        ))}
                        <Text style={[styles.strengthLabel, { color: strength.color }]}>
                          {strength.label}
                        </Text>
                      </View>
                    )}
                  </Animated.View>

                  <Animated.View style={lift(fieldAnims[3])}>
                    <AuthField
                      icon={<Lock color="rgba(167,139,250,0.55)" size={18} />}
                      placeholder={t.confirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoComplete="new-password"
                      accessibilityLabel={t.confirmPassword}
                      returnKeyType="go"
                      onSubmitEditing={handleSignup}
                      hasError={confirmMismatch || !!error}
                    />
                    {confirmMismatch && (
                      <Text style={styles.matchError}>{t.passwordMismatch}</Text>
                    )}
                  </Animated.View>
                </Animated.View>

                {/* Terms */}
                <TouchableOpacity
                  style={styles.termsRow}
                  onPress={() => {
                    if (termsAccepted) {
                      setTermsAccepted(false);
                      AsyncStorage.removeItem(TERMS_ACCEPTED_KEY).catch(() => {});
                    } else {
                      setShowTermsModal(true);
                    }
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: termsAccepted }}
                  accessibilityLabel={t.agreeLabel + ' ' + t.termsLink}
                >
                  <View style={[styles.check, termsAccepted && styles.checkOn]}>
                    {termsAccepted && <Check color="#fff" size={11} strokeWidth={3} />}
                  </View>
                  <Text style={styles.termsText}>
                    {t.agreeLabel} <Text style={styles.termsLink}>{t.termsLink}</Text>
                  </Text>
                </TouchableOpacity>

                <Animated.Text style={[styles.errorMsg, { opacity: errorOpacity }]}>
                  {error}
                </Animated.Text>

                <Animated.View style={lift(buttonAnim)}>
                  <AuthButton
                    label={t.createAccount}
                    onPress={handleSignup}
                    loading={isLoading}
                    accessibilityLabel={t.createAccount}
                  />
                </Animated.View>

                <Animated.View style={lift(socialAnim)}>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerLabel}>{t.or}</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.socialRow}>
                    {showAppleNative &&
                      (appleLoading ? (
                        <View style={styles.appleLoading}>
                          <ActivityIndicator color="#fff" size="small" />
                        </View>
                      ) : (
                        <AppleAuthentication.AppleAuthenticationButton
                          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                          cornerRadius={16}
                          style={styles.appleNativeBtn}
                          onPress={handleApple}
                        />
                      ))}
                    {showAppleWeb && (
                      <View style={styles.socialBtnDisabled}>
                        <Text style={styles.appleIcon}>🍎</Text>
                        <Text style={styles.socialLabel}>{t.signInWithApple}</Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.footer, lift(footerAnim)]}>
            <Text style={styles.footerText}>{t.haveAccount}</Text>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.footerLink}> {t.signInHere}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Back to login */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        activeOpacity={0.7}
        accessibilityLabel="Back to sign in"
      >
        <ChevronLeft color="#c4b5fd" size={20} />
      </TouchableOpacity>

      {/* Language toggle */}
      <TouchableOpacity
        onPress={() => setLanguage(language === 'en' ? 'es' : 'en')}
        style={styles.langToggle}
        activeOpacity={0.7}
        accessibilityLabel="Change language"
      >
        <Globe color="#c4b5fd" size={14} />
        <Text style={styles.langText}>{language === 'en' ? 'ES' : 'EN'}</Text>
      </TouchableOpacity>

      <TermsModal
        visible={showTermsModal && !checkingTerms}
        language={language}
        onAccept={acceptTerms}
        onDecline={() => setShowTermsModal(false)}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
  },
  spacer: { flex: 1, minHeight: 40 },
  brandSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
    textShadowColor: 'rgba(139,92,246,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 11,
    color: 'rgba(196,181,253,0.65)',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  headlineWrap: {
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 24,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headlineSub: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.6)',
  },
  cardWrap: {
    marginHorizontal: 20,
  },
  card: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.18)',
    backgroundColor: 'rgba(12,5,24,0.55)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 14,
  },
  cardInner: {
    padding: 22,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    marginTop: -4,
    paddingHorizontal: 2,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 6,
  },
  matchError: {
    color: '#f87171',
    fontSize: 11,
    marginBottom: 8,
    marginTop: -4,
    paddingHorizontal: 2,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.4)',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkOn: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(196,181,253,0.65)',
    lineHeight: 15,
  },
  termsLink: {
    color: '#a78bfa',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  errorMsg: {
    color: '#f87171',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
    minHeight: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(139,92,246,0.2)',
  },
  dividerLabel: {
    marginHorizontal: 12,
    fontSize: 11,
    color: 'rgba(196,181,253,0.4)',
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
  },
  appleLoading: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  appleNativeBtn: {
    width: '100%',
    height: 50,
  },
  socialBtnDisabled: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
    opacity: 0.6,
  },
  appleIcon: {
    fontSize: 16,
    color: '#fff',
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.55)',
  },
  footerLink: {
    fontSize: 13,
    color: '#a78bfa',
    fontWeight: '700',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  langToggle: {
    position: 'absolute',
    top: 54,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  langText: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '600',
  },
});
