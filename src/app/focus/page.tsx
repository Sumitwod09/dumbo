"use client";

import React from "react";
import { useTimerStore } from "@/stores/useTimerStore";
import { useCoupleStore } from "@/stores/useCoupleStore";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Moon,
  Sparkles,
  Coffee,
  PartyPopper,
} from "lucide-react";

export default function FocusPage() {
  const {
    phase,
    remainingSeconds,
    totalSeconds,
    isRunning,
    startedByName,
    showCompletionOverlay,
    completedPhase,
    startFocus,
    startBreak,
    pauseTimer,
    resumeTimer,
    stopTimer,
    dismissCompletionOverlay,
  } = useTimerStore();

  const { getActiveUser, toggleDnd } = useCoupleStore();
  const activeUser = getActiveUser();

  const progressPercent =
    totalSeconds > 0
      ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100
      : 0;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Timer className="w-5 h-5 text-violet-500" />
          Joint Focus Timer
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Synchronized Pomodoro timer for deep work together
        </p>
      </div>

      {/* Do Not Disturb Toggle Banner */}
      <div className="bg-gradient-to-r from-violet-900 to-indigo-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-800/60 flex items-center justify-center">
            <Moon className="w-5 h-5 text-violet-300" />
          </div>
          <div>
            <h3 className="text-xs font-bold">Do Not Disturb Status</h3>
            <p className="text-[11px] text-violet-200">
              {activeUser.isDnd
                ? "Your status is set to DND"
                : "Surfaces quiet mood to partner"}
            </p>
          </div>
        </div>

        <button
          onClick={() => toggleDnd(activeUser.id)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
            activeUser.isDnd
              ? "bg-violet-400 text-slate-950"
              : "bg-white/20 hover:bg-white/30 text-white"
          }`}
          aria-label={
            activeUser.isDnd
              ? "Disable Do Not Disturb"
              : "Enable Do Not Disturb"
          }
        >
          {activeUser.isDnd ? "Active (DND)" : "Toggle DND"}
        </button>
      </div>

      {/* Main Countdown Display Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-6">
        {/* Phase Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              phase === "focus"
                ? "bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-300"
                : phase === "break"
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            {phase === "idle" ? "Ready" : phase}
          </span>
          {startedByName && phase !== "idle" && (
            <span className="text-xs text-slate-400 font-medium">
              Started by {startedByName}
            </span>
          )}
        </div>

        {/* Radial Timer Counter */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="96"
              className="stroke-slate-100 dark:stroke-slate-800 fill-none"
              strokeWidth="12"
            />
            <circle
              cx="112"
              cy="112"
              r="96"
              className={`fill-none transition-all duration-1000 ${
                phase === "break" ? "stroke-emerald-500" : "stroke-violet-500"
              }`}
              strokeWidth="12"
              strokeDasharray="603"
              strokeDashoffset={603 - (603 * progressPercent) / 100}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold font-mono text-slate-900 dark:text-slate-50">
              {formatTimer(remainingSeconds)}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {phase === "break" ? "Relax & Hydrate" : "Deep Focus Session"}
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex gap-2">
          <button
            onClick={() => startFocus(25, activeUser.displayName)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-violet-500 hover:text-white transition-colors"
            aria-label="Start 25 minute focus session"
          >
            25m Focus
          </button>
          <button
            onClick={() => startFocus(45, activeUser.displayName)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-violet-500 hover:text-white transition-colors"
            aria-label="Start 45 minute deep focus session"
          >
            45m Deep
          </button>
          <button
            onClick={() => startBreak(5, activeUser.displayName)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-emerald-500 hover:text-white transition-colors"
            aria-label="Start 5 minute break"
          >
            <Coffee className="w-3.5 h-3.5 inline mr-1" /> 5m Break
          </button>
        </div>

        {/* Main Controls */}
        <div className="flex items-center gap-4">
          {!isRunning ? (
            <button
              onClick={() =>
                phase === "idle"
                  ? startFocus(25, activeUser.displayName)
                  : resumeTimer()
              }
              className="w-14 h-14 rounded-full bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 transition-transform active:scale-95"
              aria-label={phase === "idle" ? "Start timer" : "Resume timer"}
            >
              <Play className="w-6 h-6 ml-0.5" />
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
              aria-label="Pause timer"
            >
              <Pause className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={stopTimer}
            className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Reset timer"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Session Complete Overlay */}
      {showCompletionOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in"
          onClick={dismissCompletionOverlay}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center">
              <PartyPopper className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {completedPhase === "focus"
                ? "Focus Session Complete! 🎉"
                : "Break Time Over! ⏰"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {completedPhase === "focus"
                ? "Great work! Transitioning to a 5-minute break..."
                : "Ready to start another focus session?"}
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Auto-continuing in a moment...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
