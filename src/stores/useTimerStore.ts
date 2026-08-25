import { create } from "zustand";
import { Audio } from "expo-av";

interface TimerState {
  sessionId: string | null;
  phase: "focus" | "break" | "idle";
  remainingSeconds: number;
  totalSeconds: number;
  startedBy: string | null;
  startedByName: string | null;
  isRunning: boolean;
  showCompletionOverlay: boolean;
  completedPhase: "focus" | "break" | null;

  startFocus: (durationMinutes?: number, userName?: string) => void;
  startBreak: (durationMinutes?: number, userName?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  dismissCompletionOverlay: () => void;
}

async function playTimerDoneSound() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/sounds/timer-done.wav"),
      { shouldPlay: true, volume: 0.7 }
    );
    // Auto-unload after playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch {
    // Sound file may not exist yet - ignore
    console.warn("Timer sound not found, skipping");
  }
}

export const useTimerStore = create<TimerState>((set, get) => ({
  sessionId: "session-1",
  phase: "idle",
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  startedBy: null,
  startedByName: null,
  isRunning: false,
  showCompletionOverlay: false,
  completedPhase: null,

  startFocus: (durationMinutes = 25, userName = "You") => {
    const total = durationMinutes * 60;
    set({
      sessionId: `timer-${Date.now()}`,
      phase: "focus",
      remainingSeconds: total,
      totalSeconds: total,
      startedByName: userName,
      isRunning: true,
      showCompletionOverlay: false,
      completedPhase: null,
    });
  },

  startBreak: (durationMinutes = 5, userName = "You") => {
    const total = durationMinutes * 60;
    set({
      sessionId: `timer-${Date.now()}`,
      phase: "break",
      remainingSeconds: total,
      totalSeconds: total,
      startedByName: userName,
      isRunning: true,
      showCompletionOverlay: false,
      completedPhase: null,
    });
  },

  pauseTimer: () => set({ isRunning: false }),
  resumeTimer: () => set({ isRunning: true }),

  stopTimer: () =>
    set({
      phase: "idle",
      remainingSeconds: 25 * 60,
      totalSeconds: 25 * 60,
      isRunning: false,
      showCompletionOverlay: false,
      completedPhase: null,
    }),

  dismissCompletionOverlay: () =>
    set({ showCompletionOverlay: false, completedPhase: null }),

  tick: () => {
    const { remainingSeconds, isRunning, phase } = get();
    if (!isRunning || remainingSeconds <= 0) return;

    if (remainingSeconds === 1) {
      playTimerDoneSound();

      if (phase === "focus") {
        set({
          showCompletionOverlay: true,
          completedPhase: "focus",
        });
        setTimeout(() => {
          get().dismissCompletionOverlay();
          get().startBreak(5);
        }, 3000);
      } else {
        set({
          showCompletionOverlay: true,
          completedPhase: "break",
          phase: "idle",
          remainingSeconds: 25 * 60,
          totalSeconds: 25 * 60,
          isRunning: false,
        });
        setTimeout(() => {
          get().dismissCompletionOverlay();
        }, 3000);
      }
    } else {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },
}));
