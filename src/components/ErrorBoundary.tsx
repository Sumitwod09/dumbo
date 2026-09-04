import React, { Component, ErrorInfo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { AlertTriangle, RefreshCw } from "lucide-react-native";

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <AlertTriangle size={32} color="#ffffff" />
            </View>
            <Text style={styles.title}>
              {this.props.fallbackTitle || "Something went wrong"}
            </Text>
            <Text style={styles.subtitle}>
              An unexpected error occurred. Please try again.
            </Text>

            {this.state.error && (
              <ScrollView style={styles.errorDetailBox}>
                <Text style={styles.errorDetailText}>
                  {this.state.error.message}
                </Text>
              </ScrollView>
            )}

            <TouchableOpacity onPress={this.handleReset} style={styles.retryBtn}>
              <RefreshCw size={14} color="#ffffff" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
  errorDetailBox: {
    maxHeight: 80,
    width: "100%",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  errorDetailText: {
    color: "#f87171",
    fontSize: 10,
    fontFamily: "monospace",
  },
  retryBtn: {
    backgroundColor: "#f43f5e",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
});
