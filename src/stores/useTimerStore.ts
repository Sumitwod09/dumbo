import { create } from "zustand";

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

  // Actions
  startFocus: (durationMinutes?: number, userName?: string) => void;
  startBreak: (durationMinutes?: number, userName?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  dismissCompletionOverlay: () => void;
}

function playTimerDoneSound() {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio("/sounds/timer-done.wav");
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch {
    // ignore errors in non-browser environments
  }
}

function showBrowserNotification(phase: "focus" | "break") {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  const title =
    phase === "focus"
      ? "Focus Session Complete! 🎉"
      : "Break Time Over! ⏰";
  const body =
    phase === "focus"
      ? "Great work! Time to take a break."
      : "Ready to get back to focus mode?";

  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/icons/icon-192.png" });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        new Notification(title, { body, icon: "/icons/icon-192.png" });
      }
    });
  }
}

function triggerCelebration() {
  if (typeof window === "undefined") return;
  import("canvas-confetti")
    .then((mod) => {
      const confetti = mod.default;
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#f43f5e", "#8b5cf6", "#f59e0b", "#10b981"],
      });
    })
    .catch(() => {});
}

export const useTimerStore = create<TimerState>((set, get) => ({
  sessionId: "session-1",
  phase: "idle",
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  startedBy: "partner-1-alex",
  startedByName: "Alex",
  isRunning: false,
  showCompletionOverlay: false,
  completedPhase: null,

  startFocus: (durationMinutes = 25, userName = "Alex") => {
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

  startBreak: (durationMinutes = 5, userName = "Alex") => {
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
      // Session is ending — fire notifications
      playTimerDoneSound();
      showBrowserNotification(phase as "focus" | "break");
      triggerCelebration();

      if (phase === "focus") {
        set({
          showCompletionOverlay: true,
          completedPhase: "focus",
        });
        // Auto-transition to break after showing overlay
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
