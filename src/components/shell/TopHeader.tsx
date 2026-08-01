"use client";

import React, { useState } from "react";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { useThemeStore } from "@/stores/useThemeStore";
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
} from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function TopHeader() {
  const {
    couple,
    currentUserId,
    switchActiveUser,
    getActiveUser,
    getPartnerUser,
  } = useCoupleStore();
  const { currentTheme, overrideTheme } = useThemeStore();

  const [showPairModal, setShowPairModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();

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
              {/* Reactive online/offline indicator */}
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
          <Show when="signed-in">
            {/* Persona Switcher for interactive testing */}
            <button
              onClick={() =>
                switchActiveUser(
                  currentUserId === couple.partner1.id
                    ? couple.partner2.id
                    : couple.partner1.id
                )
              }
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Switch partner view"
              title="Switch partner view"
            >
              <UserCheck className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-medium truncate max-w-[65px]">
                {activeUser.displayName}
              </span>
            </button>
            <UserButton />
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="text-xs px-3 py-1 rounded-full bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                Sign Up
              </button>
            </SignUpButton>
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
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            aria-label="Show pairing code"
            title="Pairing Code"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
          </button>
        </div>
      </div>

      {/* Pairing Code Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-xs shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Private 2-User Scope
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Share this pairing code with your partner to grant symmetric
                access.
              </p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-sm font-bold text-slate-900 dark:text-slate-100 tracking-wider">
              <span>{couple.pairingCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm"
                aria-label="Copy pairing code"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
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
