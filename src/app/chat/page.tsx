"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useCoupleStore } from "@/stores/useCoupleStore";
import {
  MessageCircle,
  Send,
  Image as ImageIcon,
  Video,
  Phone,
  Check,
  CheckCheck,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
} from "lucide-react";

export default function ChatPage() {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const {
    messages,
    callState,
    sendMessage,
    sendPhotoMessage,
    markAllPartnerMessagesAsRead,
    startCall,
    endCall,
    toggleMute,
    toggleCamera,
    incrementCallDuration,
  } = useChatStore();

  const { getActiveUser, getPartnerUser, isPaired } = useCoupleStore();
  const activeUser = getActiveUser();
  const partnerUser = getPartnerUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-mark partner messages as read when chat is visible
  useEffect(() => {
    const markRead = () => {
      if (document.visibilityState === "visible") {
        markAllPartnerMessagesAsRead(activeUser.id);
      }
    };

    // Mark on mount
    markRead();

    // Mark when tab becomes visible
    document.addEventListener("visibilitychange", markRead);
    return () => document.removeEventListener("visibilitychange", markRead);
  }, [activeUser.id, markAllPartnerMessagesAsRead, messages]);

  // Call duration interval timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (callState.isCallActive) {
      interval = setInterval(incrementCallDuration, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState.isCallActive, incrementCallDuration]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim(), activeUser.id, activeUser.displayName);
    setInputText("");
  };

  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      sendPhotoMessage(
        dataUrl,
        activeUser.id,
        activeUser.displayName,
        "Shared a photo ✨"
      );
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const formatCallDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Top Action Bar: Calling buttons */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-rose-500" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              Private Chat
            </h2>
            <p className="text-[11px] text-slate-400">
              End-to-End Isolated (2-User)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => startCall("audio")}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            aria-label="Start audio call"
            title="Audio Call"
          >
            <Phone className="w-4 h-4 text-emerald-500" />
          </button>
          <button
            onClick={() => startCall("video")}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            aria-label="Start video call"
            title="Video Call"
          >
            <Video className="w-4 h-4 text-rose-500" />
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No messages yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Say hi to your partner! 💬
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === activeUser.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isMine ? "items-end" : "items-start"
                }`}
              >
                <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                  {msg.senderName}
                </span>
                <div
                  className={`max-w-[78%] rounded-2xl p-3 text-xs shadow-sm space-y-1 ${
                    isMine
                      ? "bg-rose-500 text-white rounded-br-xs"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs"
                  }`}
                >
                  {msg.photoStoragePath && (
                    <div className="rounded-lg overflow-hidden my-1">
                      <img
                        src={msg.photoStoragePath}
                        alt="Attached photo"
                        className="w-full h-auto object-cover max-h-48"
                      />
                    </div>
                  )}
                  {msg.content && (
                    <p className="leading-relaxed">{msg.content}</p>
                  )}

                  <div
                    className={`flex items-center justify-end gap-1 text-[9px] pt-0.5 ${
                      isMine ? "text-rose-100" : "text-slate-400"
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMine && (
                      <span title={msg.readAt ? "Read by partner" : "Sent"}>
                        {msg.readAt ? (
                          <CheckCheck className="w-3 h-3 text-sky-200" />
                        ) : (
                          <Check className="w-3 h-3 text-rose-200" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Controls or Invitation Guard Card */}
      {isPaired ? (
        <form onSubmit={handleSend} className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
            aria-label="Share a photo"
            title="Share photo"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoFileSelect}
            className="hidden"
            aria-label="Select photo to share"
          />

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message your partner..."
            className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
            aria-label="Type a message"
          />

          <button
            type="submit"
            className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/40 rounded-2xl p-4 text-center mt-2 shadow-sm">
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
            No one to chat with yet. Invite your partner to start chatting.
          </p>
        </div>
      )}

      {/* WebRTC Video Call Modal Overlay */}
      {callState.isCallActive && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-6 animate-in fade-in">
          {/* Header */}
          <div className="w-full flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                1-on-1 {callState.callType === "video" ? "Video" : "Audio"} Call
              </span>
            </div>
            <span className="text-sm font-mono text-slate-300">
              {formatCallDuration(callState.durationSeconds)}
            </span>
          </div>

          {/* Video Streams Display */}
          <div className="w-full max-w-sm flex-1 my-6 relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
            {/* Remote Partner Feed */}
            <img
              src={partnerUser.avatarUrl}
              alt={partnerUser.displayName}
              className="w-full h-full object-cover opacity-85"
            />

            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white font-medium">
              {partnerUser.displayName}
            </div>

            {/* Self Video PiP Preview */}
            <div className="absolute bottom-4 right-4 w-28 h-40 bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl">
              {callState.isCameraOff ? (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs text-slate-400">
                  Cam Off
                </div>
              ) : (
                <img
                  src={activeUser.avatarUrl}
                  alt={activeUser.displayName}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex items-center gap-6">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-colors ${
                callState.isMuted
                  ? "bg-rose-500 text-white"
                  : "bg-slate-800 text-slate-200"
              }`}
              aria-label={callState.isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {callState.isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={endCall}
              className="p-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/40 transition-transform active:scale-95"
              aria-label="End call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            {callState.callType === "video" && (
              <button
                onClick={toggleCamera}
                className={`p-4 rounded-full transition-colors ${
                  callState.isCameraOff
                    ? "bg-rose-500 text-white"
                    : "bg-slate-800 text-slate-200"
                }`}
                aria-label={
                  callState.isCameraOff ? "Turn on camera" : "Turn off camera"
                }
              >
                {callState.isCameraOff ? (
                  <VideoOff className="w-6 h-6" />
                ) : (
                  <Video className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
