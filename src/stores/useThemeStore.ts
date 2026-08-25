import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeMode } from "@/types";

const THEME_KEY = "dumbo-theme";
const AUTO_MODE_KEY = "dumbo-theme-auto";

interface ThemeState {
  currentTheme: ThemeMode;
  isAutoMode: boolean;
  isDark: boolean;
  colors: {
    accent: string;
    accentLight: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  overrideTheme: (theme: ThemeMode) => void;
  toggleAutoMode: () => void;
  computeThemeFromTime: () => void;
  loadStoredTheme: () => Promise<void>;
}

function getThemeColors(theme: ThemeMode) {
  const isDark = theme === "evening" || theme === "night";
  return {
    isDark,
    colors: {
      accent: theme === "morning" ? "#f59e0b" : theme === "day" ? "#0284c7" : theme === "evening" ? "#e11d48" : "#4338ca",
      accentLight: theme === "morning" ? "#fef3c7" : theme === "day" ? "#e0f2fe" : theme === "evening" ? "#ffe4e6" : "#e0e7ff",
      background: isDark ? "#0f172a" : "#f8fafc",
      card: isDark ? "#1e293b" : "#ffffff",
      text: isDark ? "#f1f5f9" : "#0f172a",
      textSecondary: isDark ? "#94a3b8" : "#64748b",
      border: isDark ? "#334155" : "#e2e8f0",
    },
  };
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: "day",
  isAutoMode: true,
  ...getThemeColors("day"),

  loadStoredTheme: async () => {
    try {
      const [storedTheme, storedAuto] = await Promise.all([
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(AUTO_MODE_KEY),
      ]);
      const theme = (storedTheme as ThemeMode) || "day";
      const isAuto = storedAuto === null ? true : storedAuto === "true";

      if (isAuto) {
        get().computeThemeFromTime();
      } else {
        const themeColors = getThemeColors(theme);
        set({ currentTheme: theme, isAutoMode: false, ...themeColors });
      }
    } catch {
      get().computeThemeFromTime();
    }
  },

  overrideTheme: (theme) => {
    const themeColors = getThemeColors(theme);
    set({ currentTheme: theme, isAutoMode: false, ...themeColors });
    AsyncStorage.setItem(THEME_KEY, theme).catch(() => {});
    AsyncStorage.setItem(AUTO_MODE_KEY, "false").catch(() => {});
  },

  toggleAutoMode: () => {
    const nextAuto = !get().isAutoMode;
    set({ isAutoMode: nextAuto });
    if (nextAuto) {
      get().computeThemeFromTime();
    } else {
      AsyncStorage.setItem(AUTO_MODE_KEY, "false").catch(() => {});
    }
  },

  computeThemeFromTime: () => {
    if (!get().isAutoMode) return;

    const hour = new Date().getHours();
    let theme: ThemeMode = "day";

    if (hour >= 6 && hour < 12) {
      theme = "morning";
    } else if (hour >= 12 && hour < 18) {
      theme = "day";
    } else if (hour >= 18 && hour < 22) {
      theme = "evening";
    } else {
      theme = "night";
    }

    const themeColors = getThemeColors(theme);
    set({ currentTheme: theme, ...themeColors });
    AsyncStorage.setItem(THEME_KEY, theme).catch(() => {});
    AsyncStorage.setItem(AUTO_MODE_KEY, "true").catch(() => {});
  },
}));
