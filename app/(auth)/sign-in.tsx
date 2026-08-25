import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useThemeStore } from "@/stores/useThemeStore";
import { Heart, Lock, Mail } from "lucide-react-native";

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!isLoaded || !email || !password) return;
    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        // Auth guard in _layout.tsx will automatically redirect to /(tabs)
      } else {
        setError("Sign in incomplete. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Heart size={32} color="#ffffff" fill="#ffffff" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Welcome to Dumbo</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Private 2-User Digital Space for Paired Partners
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
            <Mail size={16} color="#94a3b8" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. kirti@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { color: colors.text }]}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Password</Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
            <Lock size={16} color="#94a3b8" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              style={[styles.input, { color: colors.text }]}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading}
          style={styles.signInBtn}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.signInBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/sign-up")}
          style={styles.signUpLink}
        >
          <Text style={styles.signUpLinkText}>
            Don't have an account? <Text style={styles.signUpBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: "#fff1f2",
    padding: 10,
    borderRadius: 10,
    width: "100%",
    marginBottom: 16,
  },
  errorText: {
    color: "#e11d48",
    fontSize: 12,
    textAlign: "center",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
  },
  signInBtn: {
    width: "100%",
    height: 46,
    borderRadius: 12,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  signInBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  signUpLink: {
    marginTop: 20,
  },
  signUpLinkText: {
    fontSize: 12,
    color: "#64748b",
  },
  signUpBold: {
    color: "#f43f5e",
    fontWeight: "bold",
  },
});
