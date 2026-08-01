"use client";

import React from "react";
import { useHydrationStore } from "@/stores/useHydrationStore";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { Droplet, Plus, Bell, CheckCircle2, History, Award } from "lucide-react";

export default function HydrationPage() {
  const { logs, dailyTargetMl, reminderActive, logWater, triggerHourlyReminder, dismissReminder, getUserDailyTotal } =
    useHydrationStore();

  const { getActiveUser, getPartnerUser } = useCoupleStore();
  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();

  const myTotal = getUserDailyTotal(activeUser.id);
  const partnerTotal = getUserDailyTotal(partnerUser.id);

  const myProgress = Math.min((myTotal / dailyTargetMl) * 100, 100);
  const partnerProgress = Math.min((partnerTotal / dailyTargetMl) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-sky-500" />
            Hydration Check-in
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mutual daily water accountability log
          </p>
        </div>

        <button
          onClick={triggerHourlyReminder}
          className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center gap-1 hover:bg-amber-200 transition-colors"
        >
          <Bell className="w-3.5 h-3.5" /> Hourly Reminder
        </button>
      </div>

      {/* Hourly Notification Alert Banner */}
      {reminderActive && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 shadow-md flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xs font-bold">Hourly Hydration Prompt 💧</h3>
              <p className="text-[11px] text-amber-100">Time for a glass of water! Log your intake below.</p>
            </div>
          </div>
          <button
            onClick={dismissReminder}
            className="px-3 py-1 rounded-xl bg-white text-amber-700 font-bold text-xs hover:bg-amber-50 transition-colors shadow-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Daily Target Progress Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Active User Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">You ({activeUser.displayName})</span>
            {myTotal >= dailyTargetMl && <Award className="w-4 h-4 text-amber-500" />}
          </div>

          <div className="text-center py-1">
            <span className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 font-mono">{myTotal}</span>
            <span className="text-xs text-slate-400 font-mono"> / {dailyTargetMl} ml</span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${myProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => logWater(250, activeUser.id, activeUser.displayName)}
              className="py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 text-xs font-semibold hover:bg-sky-100 transition-colors text-center"
            >
              +250ml
            </button>
            <button
              onClick={() => logWater(500, activeUser.id, activeUser.displayName)}
              className="py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 text-xs font-semibold hover:bg-sky-100 transition-colors text-center"
            >
              +500ml
            </button>
          </div>
        </div>

        {/* Partner Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{partnerUser.displayName}</span>
            {partnerTotal >= dailyTargetMl && <Award className="w-4 h-4 text-amber-500" />}
          </div>

          <div className="text-center py-1">
            <span className="text-2xl font-extrabold text-amber-500 font-mono">{partnerTotal}</span>
            <span className="text-xs text-slate-400 font-mono"> / {dailyTargetMl} ml</span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${partnerProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => logWater(250, partnerUser.id, partnerUser.displayName)}
              className="py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors text-center"
            >
              +250ml
            </button>
            <button
              onClick={() => logWater(500, partnerUser.id, partnerUser.displayName)}
              className="py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors text-center"
            >
              +500ml
            </button>
          </div>
        </div>
      </div>

      {/* Shared Log History Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-sky-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Log History Timeline</h3>
        </div>

        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Droplet className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No logs yet today
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Log your first glass of water above!
              </p>
            </div>
          ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center ${
                    log.userId === activeUser.id ? "bg-sky-500" : "bg-amber-500"
                  }`}
                >
                  {log.userName[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{log.userName}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(log.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold font-mono text-sky-600 dark:text-sky-400">
                +{log.amountMl} ml
              </span>
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
}
