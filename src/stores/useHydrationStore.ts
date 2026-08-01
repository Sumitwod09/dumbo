import { create } from "zustand";
import { HydrationLog } from "@/types";
import { MOCK_HYDRATION_LOGS } from "@/lib/mock/mockData";

let hourlyReminderInterval: ReturnType<typeof setInterval> | null = null;

interface HydrationState {
  logs: HydrationLog[];
  dailyTargetMl: number;
  reminderActive: boolean;

  // Actions
  logWater: (amountMl: number, userId: string, userName: string) => void;
  triggerHourlyReminder: () => void;
  dismissReminder: () => void;
  getUserDailyTotal: (userId: string) => number;
  startHourlyReminder: () => void;
  stopHourlyReminder: () => void;
}

export const useHydrationStore = create<HydrationState>((set, get) => ({
  logs: MOCK_HYDRATION_LOGS,
  dailyTargetMl: 2000,
  reminderActive: true,

  logWater: (amountMl, userId, userName) => {
    const newLog: HydrationLog = {
      id: `hyd-${Date.now()}`,
      coupleId: "couple-888-999-111",
      userId,
      userName,
      loggedAt: new Date().toISOString(),
      amountMl,
    };

    const updatedLogs = [newLog, ...get().logs];
    set({ logs: updatedLogs, reminderActive: false });

    // Check if target reached and trigger celebration
    const total = get().getUserDailyTotal(userId);
    if (total >= get().dailyTargetMl) {
      if (typeof window !== "undefined") {
        import("canvas-confetti").then((mod) => {
          const confetti = mod.default;
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }).catch(() => {});
      }
    }
  },

  triggerHourlyReminder: () => set({ reminderActive: true }),
  dismissReminder: () => set({ reminderActive: false }),

  getUserDailyTotal: (userId) => {
    const todayStr = new Date().toISOString().split("T")[0];
    return get()
      .logs.filter((l) => l.userId === userId && l.loggedAt.startsWith(todayStr))
      .reduce((sum, l) => sum + l.amountMl, 0);
  },

  startHourlyReminder: () => {
    if (typeof window === "undefined") return;
    if (hourlyReminderInterval) clearInterval(hourlyReminderInterval);
    hourlyReminderInterval = setInterval(() => {
      get().triggerHourlyReminder();
    }, 3600000); // 1 hour
  },

  stopHourlyReminder: () => {
    if (hourlyReminderInterval) {
      clearInterval(hourlyReminderInterval);
      hourlyReminderInterval = null;
    }
  },
}));
