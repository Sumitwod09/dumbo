import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { create } from "zustand";
import { Check, AlertTriangle, Info, X, WifiOff } from "lucide-react-native";

// ——————————— Toast Store ———————————
export type ToastType = "success" | "error" | "info" | "warning" | "offline";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastState {
  toasts: ToastItem[];
  show: (type: ToastType, title: string, message?: string, durationMs?: number) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  show: (type, title, message, durationMs = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newToast: ToastItem = { id, type, title, message, durationMs };

    set((state) => ({
      toasts: [...state.toasts.slice(-2), newToast], // Keep max 3 toasts
    }));

    // Auto-dismiss
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, durationMs);
  },

  dismiss: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// ——————————— Convenience helpers ———————————
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().show("success", title, message),
  error: (title: string, message?: string) =>
    useToastStore.getState().show("error", title, message, 5000),
  info: (title: string, message?: string) =>
    useToastStore.getState().show("info", title, message),
  warning: (title: string, message?: string) =>
    useToastStore.getState().show("warning", title, message, 4000),
  offline: (title: string, message?: string) =>
    useToastStore.getState().show("offline", title, message, 4000),
};

// ——————————— Individual Toast Component ———————————
function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const config = TOAST_CONFIG[item.type];
  const IconComp = config.Icon;

  return (
    <Animated.View
      style={[
        styles.toastCard,
        { backgroundColor: config.bg, borderLeftColor: config.accent },
        { transform: [{ translateY }], opacity },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
        <IconComp size={14} color={config.accent} />
      </View>
      <View style={styles.toastContent}>
        <Text style={[styles.toastTitle, { color: config.titleColor }]}>{item.title}</Text>
        {item.message && (
          <Text style={[styles.toastMessage, { color: config.messageColor }]} numberOfLines={2}>
            {item.message}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
        <X size={14} color={config.dismissColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ——————————— Toast Provider (render in root layout) ———————————
export function ToastProvider() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </View>
  );
}

// ——————————— Toast Configs ———————————
const TOAST_CONFIG: Record<
  ToastType,
  {
    Icon: any;
    bg: string;
    accent: string;
    iconBg: string;
    titleColor: string;
    messageColor: string;
    dismissColor: string;
  }
> = {
  success: {
    Icon: Check,
    bg: "#ecfdf5",
    accent: "#10b981",
    iconBg: "#d1fae5",
    titleColor: "#065f46",
    messageColor: "#047857",
    dismissColor: "#6ee7b7",
  },
  error: {
    Icon: AlertTriangle,
    bg: "#fff1f2",
    accent: "#ef4444",
    iconBg: "#fee2e2",
    titleColor: "#991b1b",
    messageColor: "#b91c1c",
    dismissColor: "#fca5a5",
  },
  info: {
    Icon: Info,
    bg: "#eff6ff",
    accent: "#3b82f6",
    iconBg: "#dbeafe",
    titleColor: "#1e40af",
    messageColor: "#1d4ed8",
    dismissColor: "#93c5fd",
  },
  warning: {
    Icon: AlertTriangle,
    bg: "#fffbeb",
    accent: "#f59e0b",
    iconBg: "#fef3c7",
    titleColor: "#92400e",
    messageColor: "#b45309",
    dismissColor: "#fcd34d",
  },
  offline: {
    Icon: WifiOff,
    bg: "#fefce8",
    accent: "#eab308",
    iconBg: "#fef9c3",
    titleColor: "#854d0e",
    messageColor: "#a16207",
    dismissColor: "#facc15",
  },
};

// ——————————— Styles ———————————
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  toastContent: {
    flex: 1,
    marginLeft: 10,
  },
  toastTitle: {
    fontSize: 12,
    fontWeight: "bold",
  },
  toastMessage: {
    fontSize: 11,
    marginTop: 1,
  },
  dismissBtn: {
    padding: 6,
  },
});
