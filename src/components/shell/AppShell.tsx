"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TopHeader } from "./TopHeader";
import { DockedAudioPlayer } from "./DockedAudioPlayer";
import { useThemeStore } from "@/stores/useThemeStore";
import { useTimerStore } from "@/stores/useTimerStore";
import { useHydrationStore } from "@/stores/useHydrationStore";
import { useCoupleStore } from "@/stores/useCoupleStore";
import {
  Home,
  Music,
  Pencil,
  MessageCircle,
  Timer,
  Droplet,
  User,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Landing page bypasses the full app shell
  if (pathname?.startsWith("/landing")) {
    return <>{children}</>;
  }

  const { user, isLoaded } = useUser();
  const { currentTheme, computeThemeFromTime } = useThemeStore();
  const { tick, isRunning } = useTimerStore();
  const { startHourlyReminder, stopHourlyReminder } = useHydrationStore();
  const { initPresence, syncUserSession, loading } = useCoupleStore();

  // Sync session with Supabase once Clerk is loaded
  useEffect(() => {
    if (isLoaded) {
      syncUserSession(user);
    }
  }, [user, isLoaded, syncUserSession]);

  // Compute initial theme and trigger timer tick loop
  useEffect(() => {
    computeThemeFromTime();
    const themeInterval = setInterval(computeThemeFromTime, 60000);
    return () => clearInterval(themeInterval);
  }, [computeThemeFromTime]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    if (isRunning) {
      timerInterval = setInterval(tick, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isRunning, tick]);

  // Start hourly hydration reminder
  useEffect(() => {
    startHourlyReminder();
    return () => stopHourlyReminder();
  }, [startHourlyReminder, stopHourlyReminder]);

  // Initialize online presence & register offline Service Worker
  useEffect(() => {
    const cleanup = initPresence();

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered:", reg.scope))
        .catch((err) => console.warn("Service Worker registration failed:", err));
    }

    return cleanup;
  }, [initPresence]);

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Music", href: "/music", icon: Music },
    { label: "Canvas", href: "/canvas", icon: Pencil },
    { label: "Chat", href: "/chat", icon: MessageCircle },
    { label: "Focus", href: "/focus", icon: Timer },
    { label: "Water", href: "/hydration", icon: Droplet },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div
      className={`min-h-dvh flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300 ${currentTheme}`}
    >
      {/* Mobile: centered max-w-md container, Desktop: wider with sidebar */}
      <div className="flex min-h-dvh w-full">
        {/* Desktop Sidebar Navigation (hidden on mobile) */}
        <aside className="hidden md:flex flex-col w-56 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 h-dvh py-6 px-3">
          <div className="flex items-center gap-2 px-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 p-0.5">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center font-bold text-xs text-rose-600 dark:text-rose-400">
                D
              </div>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
              Dumbo
            </span>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Column */}
        <div className="flex-1 max-w-md md:max-w-2xl mx-auto w-full min-h-dvh flex flex-col relative bg-slate-50 dark:bg-slate-950 md:border-x border-slate-200 dark:border-slate-800 md:shadow-2xl">
          {/* Top Header */}
          <TopHeader />

          {/* Main Content Area with reserved pb-32 spacing */}
          <main className="flex-1 overflow-y-auto pb-32 md:pb-6 p-4">
            {children}
          </main>

          {/* Docked Persistent Audio Player */}
          <DockedAudioPlayer />

          {/* Sticky Bottom Navigation Bar — mobile only */}
          <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95 backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition-all ${
                    isActive
                      ? "text-rose-600 dark:text-rose-400 font-semibold scale-105"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  aria-label={item.label}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-rose-600 dark:text-rose-400" : ""
                    }`}
                  />
                  <span className="text-[10px]">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
