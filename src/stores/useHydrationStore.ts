import { create } from "zustand";
import { HydrationLog } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { useCoupleStore } from "./useCoupleStore";

let hourlyReminderInterval: ReturnType<typeof setInterval> | null = null;

interface HydrationState {
  logs: HydrationLog[];
  dailyTargetMl: number;
  reminderActive: boolean;

  fetchLogs: (coupleId: string) => Promise<void>;
  logWater: (amountMl: number, userId: string, userName: string) => Promise<void>;
  triggerHourlyReminder: () => void;
  dismissReminder: () => void;
  getUserDailyTotal: (userId: string) => number;
  startHourlyReminder: () => void;
  stopHourlyReminder: () => void;
}

export const useHydrationStore = create<HydrationState>((set, get) => ({
  logs: [],
  dailyTargetMl: 2000,
  reminderActive: true,

  fetchLogs: async (coupleId: string) => {
    const { data, error } = await supabase
      .from("hydration_logs")
      .select("*")
      .eq("couple_id", coupleId)
      .order("logged_at", { ascending: false });

    if (!error && data) {
      set({
        logs: data.map((h) => ({
          id: h.id,
          coupleId: h.couple_id,
          userId: h.user_id,
          userName: h.user_name || "User",
          loggedAt: h.logged_at,
          amountMl: h.amount_ml,
        })),
      });
    }
  },

  logWater: async (amountMl, userId, userName) => {
    const { couple } = useCoupleStore.getState();
    if (!couple || !couple.id) return;

    const { data, error } = await supabase
      .from("hydration_logs")
      .insert({
        couple_id: couple.id,
        user_id: userId,
        user_name: userName,
        amount_ml: amountMl,
      })
      .select()
      .single();

    if (!error && data) {
      const newLog: HydrationLog = {
        id: data.id,
        coupleId: data.couple_id,
        userId: data.user_id,
        userName: data.user_name || userName,
        loggedAt: data.logged_at,
        amountMl: data.amount_ml,
      };

      set((state) => ({ logs: [newLog, ...state.logs], reminderActive: false }));
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
    if (hourlyReminderInterval) clearInterval(hourlyReminderInterval);
    hourlyReminderInterval = setInterval(() => {
      get().triggerHourlyReminder();
    }, 3600000);
  },

  stopHourlyReminder: () => {
    if (hourlyReminderInterval) {
      clearInterval(hourlyReminderInterval);
      hourlyReminderInterval = null;
    }
  },
}));
