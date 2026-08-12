"use client";

import React, { useState, useEffect } from "react";
import { useCoupleStore } from "@/stores/useCoupleStore";
import {
  User,
  AtSign,
  Heart,
  Search,
  Check,
  X,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Moon,
  Copy,
  Users,
  UserPlus,
} from "lucide-react";

export default function ProfilePage() {
  const {
    couple,
    currentUserId,
    availableUsers,
    searchQuery,
    setSearchQuery,
    updateProfile,
    checkUsernameAvailability,
    sendPartnerRequest,
    acceptPartnerRequest,
    declinePartnerRequest,
    getIncomingRequests,
    getRequestStatusForUser,
    toggleDnd,
    getActiveUser,
    getPartnerUser,
  } = useCoupleStore();

  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();
  const incomingRequests = getIncomingRequests();

  const [displayName, setDisplayName] = useState(activeUser.displayName || "");
  const [username, setUsername] = useState(activeUser.username || "");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setDisplayName(activeUser.displayName || "");
    setUsername(activeUser.username || "");
  }, [activeUser.displayName, activeUser.username]);

  const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
  const isUsernameAvailable =
    !cleanUsername ||
    cleanUsername === activeUser.username?.toLowerCase() ||
    checkUsernameAvailability(cleanUsername);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const res = await updateProfile(displayName, username);
    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: "success", text: "Profile settings & unique username updated!" });
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update profile." });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(couple.pairingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredUsers = availableUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Page Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <User className="w-5 h-5 text-rose-500" />
            <span>Profile & Account</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customize your unique username, profile, and partner connections
          </p>
        </div>
      </div>

      {/* 1. Active User Profile Summary Card */}
      <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-4">
          <img
            src={activeUser.avatarUrl}
            alt={activeUser.displayName}
            className="w-16 h-16 rounded-full border-2 border-white/80 object-cover shadow-md bg-white/20"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold truncate">{activeUser.displayName}</h2>
              {activeUser.username && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-mono font-semibold">
                  @{activeUser.username}
                </span>
              )}
            </div>
            <p className="text-xs text-rose-100 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online • Connected to {partnerUser.displayName}</span>
            </p>
          </div>

          <button
            onClick={() => toggleDnd(activeUser.id)}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              activeUser.isDnd
                ? "bg-slate-900 text-white"
                : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            }`}
            title="Toggle Do Not Disturb Mode"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Choose Unique Username & Profile Customization Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <AtSign className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Choose Unique Username & Settings
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Kirti Chaudhari"
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Unique Username */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Unique Username
              </label>
              {cleanUsername && (
                <span className="text-[11px] flex items-center gap-1 font-semibold">
                  {isUsernameAvailable ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Available
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Username Taken
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="choose_username (e.g. kirti, sumit)"
                className={`w-full pl-8 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${
                  cleanUsername && !isUsernameAvailable
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-slate-200 dark:border-slate-700 focus:ring-rose-500"
                }`}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Your unique username allows other users to search and connect with you directly.
            </p>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              }`}
            >
              {feedback.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              <span>{feedback.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || (!!cleanUsername && !isUsernameAvailable)}
            className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all"
          >
            {isSaving ? "Saving..." : "Save Profile Settings"}
          </button>
        </form>
      </div>

      {/* 3. Dedicated User Search Bar & Connections Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              User Search & Partner Requests
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {availableUsers.length} Registered Users
          </span>
        </div>

        {/* Incoming Partner Request Banner */}
        {incomingRequests.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-300">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-bounce" />
              <span>Incoming Partner Connection Request</span>
            </div>
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={req.fromUserAvatar}
                    alt={req.fromUserName}
                    className="w-8 h-8 rounded-full bg-slate-200"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {req.fromUserName}
                    </p>
                    <span className="text-[10px] text-slate-400">wants to connect with you</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => acceptPartnerRequest(req.id)}
                    className="text-[11px] px-3 py-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declinePartnerRequest(req.id)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dedicated User Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search registered users by @username, name, or email..."
            className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* User Search Results List */}
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No registered users match "{searchQuery}"
            </p>
          ) : (
            filteredUsers.map((u) => {
              const isCurrent = u.id === activeUser.id;
              const reqStatus = getRequestStatusForUser(u.id);

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={u.avatarUrl}
                      alt={u.displayName}
                      className="w-9 h-9 rounded-full bg-slate-200 object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        <span>{u.displayName}</span>
                        {isCurrent && <span className="text-[10px] text-rose-500 font-bold">(You)</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {u.username ? `@${u.username}` : "registered user"}
                      </p>
                    </div>
                  </div>

                  {!isCurrent && (
                    <div>
                      {reqStatus === "accepted" ? (
                        <span className="text-xs px-3 py-1.5 rounded-xl font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Connected ♥
                        </span>
                      ) : reqStatus === "pending_sent" ? (
                        <span className="text-xs px-3 py-1.5 rounded-xl font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          Connection Pending ⏳
                        </span>
                      ) : reqStatus === "pending_received" ? (
                        <button
                          onClick={() => {
                            const incoming = getIncomingRequests().find(
                              (r) => r.fromUserId === u.id
                            );
                            if (incoming) acceptPartnerRequest(incoming.id);
                          }}
                          className="text-xs px-3.5 py-1.5 rounded-xl font-extrabold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all"
                        >
                          Accept Connection
                        </button>
                      ) : (
                        <button
                          onClick={() => sendPartnerRequest(u)}
                          className="text-xs px-3.5 py-1.5 rounded-xl font-extrabold bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Pairing Code & Download APK Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Private Pairing Code
          </label>
          <button
            onClick={handleCopyCode}
            className="text-xs text-rose-500 font-semibold flex items-center gap-1 hover:underline"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-center font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-wider">
          {couple.pairingCode || "DUO-HUB"}
        </div>

        <a
          href="https://github.com/Sumitwod09/dumbo/releases/download/v1.0.0/dumbo-app-debug.apk"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs shadow-md transition-all mt-2"
        >
          <Smartphone className="w-4 h-4" />
          <span>Download Android APK 📱</span>
        </a>
      </div>
    </div>
  );
}
