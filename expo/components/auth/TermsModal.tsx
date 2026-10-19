import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { TouchableOpacity } from '@/components/HapticTouchable';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldAlert, Check } from 'lucide-react-native';
import { AUTH_STRINGS, TERMS_BODY_EN, TERMS_BODY_ES, type Language } from './shared';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TermsModalProps {
  visible: boolean;
  language: Language;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Frosted Terms & Privacy agreement modal. Shared by login and signup so the
 * legal copy stays in one place. Preserves the original agreement text.
 */
export default function TermsModal({ visible, language, onAccept, onDecline }: TermsModalProps) {
  const t = AUTH_STRINGS[language];
  const body = language === 'es' ? TERMS_BODY_ES : TERMS_BODY_EN;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <ShieldAlert color="#fbbf24" size={22} />
            </View>
            <Text style={styles.title}>{t.termsTitle}</Text>
            <Text style={styles.intro}>{t.termsIntro}</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            <Text style={styles.body}>{body}</Text>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline} activeOpacity={0.8}>
              <Text style={styles.declineText}>{t.decline}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.agreeBtn} onPress={onAccept} activeOpacity={0.85}>
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.agreeGradient}
              >
                <Check color="#fff" size={16} strokeWidth={3} />
                <Text style={styles.agreeText}>{t.iAgree}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,1,12,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    backgroundColor: '#120824',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.28)',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 14,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(139,92,246,0.18)',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  intro: {
    fontSize: 12,
    color: 'rgba(196,181,253,0.7)',
    textAlign: 'center',
  },
  scroll: {
    maxHeight: SCREEN_HEIGHT * 0.42,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.82)',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(139,92,246,0.18)',
  },
  declineBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontSize: 14,
  },
  agreeBtn: {
    flex: 1.4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  agreeGradient: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  agreeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
