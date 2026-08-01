"use client";

import React, { useState } from "react";
import { useAudioStore } from "@/stores/useAudioStore";
import {
  Play,
  Pause,
  SkipForward,
  Music,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export function DockedAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    positionSeconds,
    durationSeconds,
    seek,
    volume,
    setVolume,
    queue,
  } = useAudioStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);

  if (!currentTrack) return null;

  const progressPercent =
    durationSeconds > 0 ? (positionSeconds / durationSeconds) * 100 : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <>
      {/* Expanded Player Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 text-white backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-rose-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Shared Queue Playing
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              aria-label="Collapse Player"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto w-full">
            {/* Album Cover Art */}
            <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 mb-6 group relative">
              <img
                src={
                  currentTrack.coverArtUrl ||
                  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300"
                }
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <h3 className="text-xl font-bold text-slate-50 line-clamp-1">
              {currentTrack.title}
            </h3>
            <p className="text-sm text-slate-400 mt-1 line-clamp-1">
              {currentTrack.artist}
            </p>
            <p className="text-xs text-rose-400 mt-1 font-medium">
              Added by {currentTrack.addedByName}
            </p>

            {/* Seek Bar */}
            <div className="w-full mt-6 space-y-1">
              <input
                type="range"
                min={0}
                max={durationSeconds || 100}
                value={positionSeconds}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                aria-label="Seek position"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>{formatTime(positionSeconds)}</span>
                <span>{formatTime(durationSeconds)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6 mt-6">
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transition-transform active:scale-95"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 ml-1" />
                )}
              </button>
              <button
                onClick={nextTrack}
                className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                aria-label="Next track"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="w-full mt-6 flex items-center gap-3 px-4">
              <button
                onClick={handleMuteToggle}
                className="p-1.5 rounded-full text-slate-400 hover:text-white transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  setIsMuted(v === 0);
                }}
                className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                aria-label="Volume"
              />
              <span className="text-xs text-slate-500 font-mono w-8 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Audio Drawer (Docked at bottom-16 above sticky navbar) */}
      <div className="fixed inset-x-0 bottom-16 z-40 max-w-md mx-auto px-2">
        <div className="border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg transition-all">
          {/* Progress Line */}
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-3 px-3 py-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 group"
              aria-label="Expand player"
            >
              <img
                src={
                  currentTrack.coverArtUrl ||
                  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=100"
                }
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronUp className="w-4 h-4 text-white" />
              </div>
            </button>

            <div
              className="min-w-0 flex-1 cursor-pointer"
              onClick={() => setIsExpanded(true)}
            >
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-50">
                {currentTrack.title}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {currentTrack.artist} •{" "}
                <span className="text-rose-500 font-medium">
                  {currentTrack.addedByName}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={togglePlay}
                className="rounded-full p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-rose-500" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <button
                onClick={nextTrack}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Skip Next"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
