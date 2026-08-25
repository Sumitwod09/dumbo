import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClerkProvider, useUser, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/auth/tokenCache";
import { hydrateStorageCache } from "@/lib/offline/storageEngine";
import { syncEngine } from "@/lib/offline/syncEngine";
import { pingSupabaseKeepAlive } from "@/lib/supabase/keepAlive";
import { useThemeStore } from "@/stores/useThemeStore";
import { useTimerStore } from "@/stores/useTimerStore";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { useChatStore } from "@/stores/useChatStore";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isSignedIn && !inAuthGroup) {
      // User is not signed in and not on auth screen → redirect to sign-in
      router.replace("/(auth)/sign-in");
    } else if (isSignedIn && inAuthGroup) {
      // User is signed in but still on auth screen → redirect to tabs
      router.replace("/(tabs)");
    }
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <View style={styles.heartIcon}>
            <Text style={styles.heartText}>D</Text>
          </View>
          <Text style={styles.loadingTitle}>Dumbo</Text>
          <Text style={styles.loadingSub}>Private 2-User Hub</Text>
          <ActivityIndicator color="#f43f5e" style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

function AppContent() {
  const { user, isLoaded } = useUser();
  const { loadStoredTheme, computeThemeFromTime, isDark } = useThemeStore();
  const { tick, isRunning } = useTimerStore();
  const { syncUserSession, couple, isPaired } = useCoupleStore();
  const { subscribeToCallSignals } = useChatStore();

  // Initialize offline storage cache & network listener & keep-alive
  useEffect(() => {
    hydrateStorageCache();
    syncEngine.startListening();
    loadStoredTheme();
    pingSupabaseKeepAlive();

    const themeInterval = setInterval(computeThemeFromTime, 60000);

    return () => {
      syncEngine.stopListening();
      clearInterval(themeInterval);
    };
  }, []);

  // Sync Clerk session with store
  useEffect(() => {
    if (isLoaded) {
      syncUserSession(user);
    }
  }, [user, isLoaded]);

  // Subscribe to incoming call signals globally
  useEffect(() => {
    if (isPaired && couple.id) {
      const unsubscribe = subscribeToCallSignals(couple.id);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isPaired, couple.id]);

  // Pomodoro timer tick loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning) {
      interval = setInterval(tick, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </AuthGate>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <AppContent />
      </ClerkProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    alignItems: "center",
  },
  heartIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heartText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
  },
  loadingTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  loadingSub: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },
});
