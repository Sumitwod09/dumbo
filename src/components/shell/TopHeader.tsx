"use client";

import React, { useState, useEffect } from "react";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { syncEngine, SyncState } from "@/lib/offline/syncEngine";
import {
  Sun,
  Moon,
  Sunset,
  Sunrise,
  UserCheck,
  Shield,
  MoonStar,
  Key,
  Copy,
  Check,
  Wifi,
  WifiOff,
  RefreshCw,
  Users,
  Heart,
} from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function TopHeader() {
  const {
    couple,
    currentUserId,
    availableUsers,
    pairWithUser,
    getActiveUser,
    getPartnerUser,
  } = useCoupleStore();
  const { currentTheme, overrideTheme } = useThemeStore();

  const [showPairModal, setShowPairModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ state: SyncState; pendingCount: number }>({
    state: typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline",
    pendingCount: 0,
  });

  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();

  // Subscribe to offline sync status updates
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((status) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  const getThemeIcon = () => {
    switch (currentTheme) {
      case "morning":
        return <Sunrise className="w-3.5 h-3.5 text-amber-500" />;
      case "day":
        return <Sun className="w-3.5 h-3.5 text-sky-500" />;
      case "evening":
        return <Sunset className="w-3.5 h-3.5 text-rose-500" />;
      case "night":
        return <MoonStar className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(couple.pairingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5">
      <div className="flex items-center justify-between">
        {/* Brand & Partner Presence */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 p-0.5 shadow-sm">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center font-bold text-xs text-rose-600 dark:text-rose-400">
              D
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Dumbo
              </h1>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300">
                2-User Hub
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              {/* Reactive online/offline partner indicator */}
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  partnerUser.isOnline
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-slate-400"
                }`}
              />
              <span>
                {partnerUser.displayName}
                {!partnerUser.isOnline && (
                  <span className="text-[10px] text-slate-400 ml-1">
                    (offline)
                  </span>
                )}
              </span>
              {partnerUser.isDnd && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-300">
                  DND
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          {/* Real-time Network Sync Pill */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              syncStatus.state === "online"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : syncStatus.state === "syncing"
                ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-800 animate-pulse"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            }`}
            title={
              syncStatus.state === "online"
                ? "Connected & Synced"
                : syncStatus.state === "syncing"
                ? "Re-syncing offline edits to internet..."
                : `Offline mode. ${syncStatus.pendingCount} edits queued for auto-sync.`
            }
          >
            {syncStatus.state === "online" ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span>Synced</span>
              </>
            ) : syncStatus.state === "syncing" ? (
              <>
                <RefreshCw className="w-3 h-3 text-sky-500 animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-500" />
                <span>Offline ({syncStatus.pendingCount})</span>
              </>
            )}
          </div>

          <Show when="signed-in">
            <UserButton />
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="text-xs px-3 py-1 rounded-full bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all">
                Sign In
              </button>
            </SignInButton>
          </Show>

          {/* Theme Indicator & Toggle */}
          <button
            onClick={() => {
              const themes: ("morning" | "day" | "evening" | "night")[] = [
                "morning",
                "day",
                "evening",
                "night",
              ];
              const nextIndex =
                (themes.indexOf(currentTheme) + 1) % themes.length;
              overrideTheme(themes[nextIndex]);
            }}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            aria-label={`Current theme: ${currentTheme}. Click to cycle.`}
            title={`Current theme: ${currentTheme} (click to cycle)`}
          >
            {getThemeIcon()}
          </button>

          {/* Pairing Code Modal Button */}
          <button
            onClick={() => setShowPairModal(true)}
            className="p-1.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 hover:bg-rose-200 transition-colors"
            aria-label="Connect Partner"
            title="Connect / Pair Partner"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </button>
        </div>
      </div>

      {/* Pairing & Partner Connection Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center mb-2">
                <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                2-User Private Pairing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Connect your account with your partner to enable shared real-time chat, canvas, music, and hydration.
              </p>
            </div>

            {/* Direct 1-Click Registered User Pairing List */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Connect Registered User:
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {availableUsers.map((u) => {
                  const isCurrent = u.id === activeUser.id;
                  const isAlreadyPartner = u.id === partnerUser.id;

                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={u.avatarUrl}
                          alt={u.displayName}
                          className="w-7 h-7 rounded-full bg-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {u.displayName} {isCurrent && "(You)"}
                          </p>
                          <span className="text-[10px] text-slate-400">Registered User</span>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => {
                            pairWithUser(u);
                            setShowPairModal(false);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                            isAlreadyPartner
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                          }`}
                        >
                          {isAlreadyPartner ? "Connected ♥" : "Pair Now"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pairing Code Fallback */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                Pairing Code:
              </label>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-2.5 flex items-center justify-between font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                <span>{couple.pairingCode || "DUO-HUB"}</span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm"
                  aria-label="Copy pairing code"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowPairModal(false)}
              className="w-full py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

