"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp, signIn } from "@/lib/supabase/auth";
import { useCoupleStore } from "@/stores/useCoupleStore";
import { Heart, Sparkles, Key, Lock, Mail, User } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "pair">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pairingCodeInput, setPairingCodeInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { setPairingCode } = useCoupleStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (mode === "signup") {
        await signUp(email, password, displayName || "Partner");
        setMode("pair");
      } else if (mode === "login") {
        await signIn(email, password);
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePairing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCodeInput.trim()) return;
    setPairingCode(pairingCodeInput.trim().toUpperCase());
    router.push("/");
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 p-0.5 mx-auto shadow-lg shadow-rose-500/20">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center font-extrabold text-2xl text-rose-500">
              D
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight flex items-center justify-center gap-1.5">
            Dumbo <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          </h1>
          <p className="text-xs text-slate-400">
            Private 2-User Hub for Couples & Best Friends
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Mode Switcher */}
        {mode !== "pair" && (
          <div className="flex bg-slate-800/60 p-1 rounded-xl">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                mode === "login"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                mode === "signup"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Auth Form */}
        {mode !== "pair" ? (
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-[11px] text-slate-400 font-medium">Display Name</label>
                <div className="relative mt-1">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex 🌸"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] text-slate-400 font-medium">Email</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium">Password</label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 font-semibold text-xs transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50"
            >
              {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        ) : (
          /* Pairing Code Form */
          <form onSubmit={handlePairing} className="space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-100">Pair With Your Partner</h2>
              <p className="text-[11px] text-slate-400">
                Enter your partner's 8-character pairing code or use the default demo code.
              </p>
            </div>

            <div>
              <input
                type="text"
                required
                placeholder="e.g. DUMBO-2026"
                value={pairingCodeInput}
                onChange={(e) => setPairingCodeInput(e.target.value)}
                className="w-full text-center tracking-widest uppercase font-mono py-2.5 text-sm rounded-xl bg-slate-800 border border-slate-700 text-amber-400 placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-semibold text-xs text-slate-950 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> Link & Open Dashboard
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
