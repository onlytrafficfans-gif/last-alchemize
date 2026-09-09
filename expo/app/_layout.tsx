import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useRootNavigationState, useSegments } from "expo-router";
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, Platform, View, Image } from 'react-native';
import { TouchableOpacity } from '@/components/HapticTouchable';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { SubscriptionProvider, useSubscription } from "@/contexts/subscription-context";
import NetworkBanner from "@/components/NetworkBanner";
import GestureOnboarding from "@/components/GestureOnboarding";
import { applyWebPolish } from "@/lib/web-polish";
import { useFonts, SpaceMono_400Regular } from "@expo-google-fonts/space-mono";
import { isGatedFeature } from "@/constants/features";

console.info('[Startup] JS_STARTED');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function BackButton() {
  const router = useRouter();
  const canGoBack = router.canGoBack();
  if (!canGoBack) return null;
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={layoutStyles.backButton}
      activeOpacity={0.7}
      testID="global-back-button"
    >
      <ChevronLeft color="#ffffff" size={18} strokeWidth={2.5} />
      <Text style={layoutStyles.backButtonText}>Back</Text>
    </TouchableOpacity>
  );
}

function GestureOnboardingGate() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading || !isAuthenticated) return null;
  return <GestureOnboarding />;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();
  const navReadyLogged = useRef(false);

  useEffect(() => {
    if (navState?.key && !navReadyLogged.current) {
      navReadyLogged.current = true;
      console.info('[Startup] NAV_READY');
    }
  }, [navState?.key]);

  useEffect(() => {
    if (isLoading) return;
    if (!navState?.key) return;
    const inAuth = segments[0] === 'auth';
    if (!isAuthenticated && !inAuth) {
      router.replace('/auth');
    } else if (isAuthenticated && inAuth) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments, navState?.key, router]);

  if (isLoading) {
    return (
      <View style={layoutStyles.splash}>
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={layoutStyles.splashImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  return <>{children}</>;
}

function PaywallGate({ children }: { children: React.ReactNode }) {
  const { isPro, isLoading: subLoading } = useSubscription();
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();

  const topSegment = segments[0] as string | undefined;
  const isGatedRoute = !!topSegment && isGatedFeature(topSegment);

  useEffect(() => {
    if (subLoading) return;
    if (!navState?.key) return;
    if (isGatedRoute && !isPro) {
      router.replace('/paywall');
    }
  }, [isGatedRoute, isPro, subLoading, navState?.key, router]);

  // Never render a gated screen's real content while entitlement is still
  // resolving or before the redirect above has taken effect — otherwise a
  // free user briefly sees the feature before being bounced out of it.
  // This only blocks the gated screen itself, never the whole app, so a
  // hung subscription check (or one that never grants Pro) leaves the user
  // able to back out to the free features rather than stuck entirely.
  if (isGatedRoute && (subLoading || !isPro)) {
    return <View style={layoutStyles.splash} />;
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerTintColor: "#ffffff",
        headerStyle: { backgroundColor: '#0c0520' },
        headerShadowVisible: false,
        headerTitleStyle: { color: '#ffffff' },
        headerLeft: () => <BackButton />,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animation: 'slide_from_right',
        animationDuration: 280,
        contentStyle: { backgroundColor: '#0c0520' },
      }}
    >
      <Stack.Screen name="auth" options={{ title: "Welcome", headerShown: false }} />
      <Stack.Screen name="paywall" options={{ title: "Alchemize Pro", headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="index" options={{ title: "Alchemize", headerShown: false }} />
      <Stack.Screen name="manifestation-board/index" options={{ title: "Portal Board", headerShown: true }} />
      <Stack.Screen name="manifestation-board/[id]" options={{ title: "Manifestation Detail", headerStyle: { backgroundColor: '#0c0520' }, headerTintColor: '#ffffff' }} />
      <Stack.Screen name="manifestation-board/add" options={{ title: "Add Manifestation", headerShown: true, presentation: "modal" }} />
      <Stack.Screen name="manifestation-board/slideshow" options={{ title: "Slideshow", headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="goals/index" options={{ title: "Goals" }} />
      <Stack.Screen name="goals/[id]" options={{ title: "Goal Detail" }} />
      <Stack.Screen name="goals/add" options={{ title: "Add Goal", presentation: "modal" }} />
      <Stack.Screen name="habits/index" options={{ title: "Habits" }} />
      <Stack.Screen name="habits/add" options={{ title: "Add Habit", presentation: "modal" }} />
      <Stack.Screen name="financial/index" options={{ title: "Financial Tracker" }} />
      <Stack.Screen name="calorie/index" options={{ title: "Calorie Tracker" }} />
      <Stack.Screen name="calorie/add" options={{ title: "Add Meal", presentation: "modal" }} />
      <Stack.Screen name="todos/index" options={{ title: "To-Do List" }} />
      <Stack.Screen name="todos/add" options={{ title: "Add Task", presentation: "modal" }} />
      <Stack.Screen name="gratitude/index" options={{ title: "Gratitude Journal" }} />
      <Stack.Screen name="gratitude/add" options={{ title: "Add Entry", presentation: "modal" }} />
      <Stack.Screen name="fitness/index" options={{ title: "Fitness" }} />
      <Stack.Screen name="fitness/add" options={{ title: "Add Workout", presentation: "modal" }} />
      <Stack.Screen name="fitness/session/[id]" options={{ title: "Edit Workout", presentation: "modal" }} />
      <Stack.Screen name="fitness/workout" options={{ title: "Workout", presentation: "modal" }} />
      <Stack.Screen name="fitness/browse" options={{ title: "Browse Workouts" }} />
      <Stack.Screen name="calorie/scan" options={{ title: "Scan Food", presentation: "modal" }} />
      <Stack.Screen name="calorie/profile" options={{ title: "Profile", presentation: "modal" }} />
      <Stack.Screen name="calorie/meal-prep" options={{ title: "Meal Prep" }} />
      <Stack.Screen name="financial/notes" options={{ title: "Financial Notes" }} />
      <Stack.Screen name="affirmations/index" options={{ title: "Affirmations" }} />
      <Stack.Screen name="affirmations/[id]" options={{ title: "Edit Affirmation" }} />
      <Stack.Screen name="affirmations/add" options={{ title: "Add Affirmation", presentation: "modal" }} />
      <Stack.Screen name="affirmations/play" options={{ title: "Play Mode", headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="quick-add" options={{ title: "Quick Add", presentation: "modal" }} />
      <Stack.Screen name="appointments/index" options={{ title: "Appointments" }} />
      <Stack.Screen name="appointments/add" options={{ title: "Add Appointment", presentation: "modal" }} />
      <Stack.Screen name="pwa-install-prompt" options={{ title: "Install App", presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Not gated on — screens referencing 'SpaceMono_400Regular' just fall back
  // to the system font until this resolves, so it can never block the splash
  // screen the way an awaited load would.
  useFonts({ SpaceMono_400Regular });

  useEffect(() => {
    console.info('[Startup] ROOT_MOUNTED');

    let splashHidden = false;
    let fallback: ReturnType<typeof setTimeout> | undefined;

    const hideNativeSplash = async (source: 'root-mount' | 'fallback') => {
      try {
        await SplashScreen.hideAsync();
        if (!splashHidden) {
          splashHidden = true;
          console.info('[Startup] NATIVE_SPLASH_HIDDEN', source);
        }
        if (fallback) clearTimeout(fallback);
      } catch (error) {
        console.error(`[Startup] Native splash hide failed (${source})`, error);
      }
    };

    // We intentionally do not call preventAutoHideAsync. Expo may release the
    // native splash on the first rendered frame, and this explicit call makes
    // root mount the only other owner. Auth and native services are never part
    // of the splash lifecycle. The retry protects against a transient failure.
    fallback = setTimeout(() => {
      void hideNativeSplash('fallback');
    }, 3000);
    void hideNativeSplash('root-mount');

    return () => {
      if (fallback) clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    applyWebPolish();
    if (Platform.OS !== 'web') {
      console.log('[App] Initializing database...');
      // Load optional native startup services only after the first React frame.
      // Import or initialization failures must never block root mount.
      import('@/lib/db/core')
        .then(({ initDatabase }) => initDatabase())
        .then(() => console.log('[App] Database ready'))
        .catch((err) => console.error('[App] Database init failed:', err));

      console.log('[App] Registering for push notifications...');
      import('@/lib/notifications')
        .then(({ registerForPushNotifications }) => registerForPushNotifications())
        .then((token) => {
          if (token) console.log('[App] Push token registered:', token);
          else console.log('[App] Push notification registration skipped or failed');
        })
        .catch((err) => console.error('[App] Push registration error:', err));
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <SubscriptionProvider>
          <ThemeProvider>
            <GestureHandlerRootView style={layoutStyles.root}>
              <View style={layoutStyles.root}>
                <AuthGate>
                  <PaywallGate>
                    <RootLayoutNav />
                  </PaywallGate>
                </AuthGate>
                <NetworkBanner />
                <GestureOnboardingGate />
              </View>
            </GestureHandlerRootView>
          </ThemeProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const layoutStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingRight: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0c0520',
  },
  splashImage: {
    width: 200,
    height: 200,
  },
});
