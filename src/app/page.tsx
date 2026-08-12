"use client";

import React from "react";
import Link from "next/link";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { useAudioStore } from "@/stores/useAudioStore";
import { useTimerStore } from "@/stores/useTimerStore";
import { useHydrationStore } from "@/stores/useHydrationStore";
import { useCanvasStore } from "@/stores/useCanvasStore";
import { useChatStore } from "@/stores/useChatStore";
import {
  Heart,
  Music,
  Play,
  Pause,
  Pencil,
  MessageCircle,
  Timer,
  Droplet,
  Moon,
  Sparkles,
  ChevronRight,
  Plus,
  Video,
} from "lucide-react";

export default function HomeDashboard() {
  const { couple, currentUserId, toggleDnd, getActiveUser, getPartnerUser } = useCoupleStore();
  const { currentTrack, isPlaying, togglePlay } = useAudioStore();
  const { phase, remainingSeconds, isRunning, startFocus } = useTimerStore();
  const { getUserDailyTotal, dailyTargetMl, logWater } = useHydrationStore();
  const { savedDoodles } = useCanvasStore();
  const { messages, startCall } = useChatStore();

  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();

  const myWaterTotal = getUserDailyTotal(activeUser.id);
  const partnerWaterTotal = getUserDailyTotal(partnerUser.id);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const latestMessage = messages[messages.length - 1];

  return (
    <div className="space-y-4">
      {/* 1. Shared Presence Banner */}
      <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatars */}
            <div className="flex -space-x-3">
              <img
                src={activeUser.avatarUrl}
                alt={activeUser.displayName}
                className="w-11 h-11 rounded-full border-2 border-white object-cover shadow-sm"
              />
              <img
                src={partnerUser.avatarUrl}
                alt={partnerUser.displayName}
                className="w-11 h-11 rounded-full border-2 border-white object-cover shadow-sm"
              />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-1.5">
                <span>{activeUser.displayName} & {partnerUser.displayName}</span>
                <Heart className="w-4 h-4 text-rose-200 fill-rose-200" />
              </h2>
              <p className="text-xs text-rose-100 font-medium">
                Connected • Code: <span className="font-mono underline">{couple.pairingCode}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleDnd(activeUser.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              activeUser.isDnd
                ? "bg-slate-900 text-white"
                : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{activeUser.isDnd ? "DND On" : "DND Off"}</span>
          </button>
        </div>

        {/* Quick Call Action */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
          <span className="text-xs text-rose-100 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            {partnerUser.isDnd ? `${partnerUser.displayName} is in Do Not Disturb mode` : "Partner is available to talk"}
          </span>
          <button
            onClick={() => startCall("video")}
            className="px-3 py-1 bg-white text-rose-600 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-rose-50 transition-colors shadow-sm"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Call Now</span>
          </button>
        </div>
      </div>

      {/* Mobile Android APK Download Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-violet-500/10 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
            📱
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Get Mobile App (APK)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              100% Offline Chat & Cellular SMS Fallback
            </p>
          </div>
        </div>
        <a
          href="https://github.com/Sumitwod09/dumbo/releases/download/v1.0.0/dumbo-app-debug.apk"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1 hover:scale-105 active:scale-95"
        >
          <span>Download</span>
        </a>
      </div>

      {/* 2. Grid Shortcuts */}
      <div className="grid grid-cols-2 gap-3">
        {/* Audio Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <Link href="/music" className="text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center">
              Queue <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-400 font-medium">Now Playing</p>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
              {currentTrack?.title || "No Track Selected"}
            </p>
          </div>
          <button
            onClick={togglePlay}
            className="mt-3 w-full py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>
        </div>

        {/* Pomodoro Focus Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
            <Link href="/focus" className="text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center">
              Focus <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-400 font-medium">Pomodoro Timer</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {formatTimer(remainingSeconds)}
            </p>
          </div>
          {!isRunning ? (
            <button
              onClick={() => startFocus(25, activeUser.displayName)}
              className="mt-3 w-full py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 text-violet-600 dark:text-violet-300 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start 25m Focus</span>
            </button>
          ) : (
            <span className="mt-3 w-full py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 font-semibold text-[11px] text-center block">
              Active ({phase})
            </span>
          )}
        </div>
      </div>

      {/* 3. Hydration Mutual Progress */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Daily Hydration Log</h3>
              <p className="text-[11px] text-slate-400">Target: {dailyTargetMl}ml each</p>
            </div>
          </div>
          <Link href="/hydration" className="text-xs font-medium text-sky-600 dark:text-sky-400 flex items-center">
            View Log <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {/* Progress Bars for Both Partners */}
        <div className="space-y-2 pt-1">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">You ({activeUser.displayName})</span>
              <span className="text-slate-500 font-mono">{myWaterTotal} / {dailyTargetMl} ml</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((myWaterTotal / dailyTargetMl) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{partnerUser.displayName}</span>
              <span className="text-slate-500 font-mono">{partnerWaterTotal} / {dailyTargetMl} ml</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((partnerWaterTotal / dailyTargetMl) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Log Button */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => logWater(250, activeUser.id, activeUser.displayName)}
            className="flex-1 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-600 dark:text-sky-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> +250ml
          </button>
          <button
            onClick={() => logWater(500, activeUser.id, activeUser.displayName)}
            className="flex-1 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-600 dark:text-sky-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> +500ml
          </button>
        </div>
      </div>

      {/* 4. Canvas Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Collaborative Canvas</h3>
            <p className="text-[11px] text-slate-500">
              {savedDoodles.length} saved doodles in library
            </p>
          </div>
        </div>
        <Link
          href="/canvas"
          className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-semibold text-xs hover:bg-rose-600 transition-colors shadow-sm"
        >
          Open Canvas
        </Link>
      </div>

      {/* 5. Recent Chat Snippet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Recent Chat</h3>
          </div>
          <Link href="/chat" className="text-xs font-medium text-rose-500 flex items-center">
            Open Chat <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {latestMessage && (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {latestMessage.senderName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {latestMessage.senderName}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(latestMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
                {latestMessage.content || "Uploaded a photo"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
