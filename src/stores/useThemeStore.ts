import { create } from "zustand";
import { ThemeMode } from "@/types";

const THEME_KEY = "dumbo-theme";
const AUTO_MODE_KEY = "dumbo-theme-auto";

function getStoredTheme(): { theme: ThemeMode; isAuto: boolean } {
  if (typeof window === "undefined") return { theme: "day", isAuto: true };
  try {
    const storedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const storedAuto = localStorage.getItem(AUTO_MODE_KEY);
    return {
      theme: storedTheme || "day",
      isAuto: storedAuto === null ? true : storedAuto === "true",
    };
  } catch {
    return { theme: "day", isAuto: true };
  }
}

function persistTheme(theme: ThemeMode, isAuto: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(AUTO_MODE_KEY, String(isAuto));
  } catch {
    // localStorage unavailable
  }
}

function applyDarkClass(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  if (theme === "evening" || theme === "night") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

interface ThemeState {
  currentTheme: ThemeMode;
  isAutoMode: boolean;
  overrideTheme: (theme: ThemeMode) => void;
  toggleAutoMode: () => void;
  computeThemeFromTime: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const stored = getStoredTheme();

  return {
    currentTheme: stored.theme,
    isAutoMode: stored.isAuto,

    overrideTheme: (theme) => {
      set({ currentTheme: theme, isAutoMode: false });
      applyDarkClass(theme);
      persistTheme(theme, false);
    },

    toggleAutoMode: () => {
      const nextAuto = !get().isAutoMode;
      set({ isAutoMode: nextAuto });
      if (nextAuto) {
        get().computeThemeFromTime();
      } else {
        persistTheme(get().currentTheme, false);
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

      set({ currentTheme: theme });
      applyDarkClass(theme);
      persistTheme(theme, true);
    },
  };
});
