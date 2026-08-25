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
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useThemeStore } from "@/stores/useThemeStore";
import { Heart, Lock, Mail, User } from "lucide-react-native";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    if (!isLoaded || !email || !password || !fullName) return;
    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: fullName.split(" ")[0] || fullName,
        lastName: fullName.split(" ").slice(1).join(" ") || "",
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Failed to sign up.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || !code) return;
    setLoading(true);
    setError("");

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        // Auth guard in _layout.tsx will automatically redirect to /(tabs)
      } else {
        setError("Verification incomplete.");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Failed to verify code.");
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

        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Join Dumbo to connect with your partner
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!pendingVerification ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
                <User size={16} color="#94a3b8" />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Kirti Chaudhari"
                  placeholderTextColor="#94a3b8"
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

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
              onPress={handleSignUp}
              disabled={loading}
              style={styles.signInBtn}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.signInBtnText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              style={styles.signUpLink}
            >
              <Text style={styles.signUpLinkText}>
                Already have an account? <Text style={styles.signUpBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Verification Code</Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
                <Lock size={16} color="#94a3b8" />
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="Enter code from email"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleVerify}
              disabled={loading}
              style={styles.signInBtn}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.signInBtnText}>Verify Email</Text>
              )}
            </TouchableOpacity>
          </>
        )}
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
