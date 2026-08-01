"use client";

import React, { useState, useRef } from "react";
import { useAudioStore } from "@/stores/useAudioStore";
import { useCoupleStore } from "@/stores/useCoupleStore";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
  Plus,
  Trash2,
  ListMusic,
  Volume2,
  VolumeX,
  Upload,
} from "lucide-react";

export default function MusicPage() {
  const {
    currentTrack,
    queue,
    isPlaying,
    positionSeconds,
    durationSeconds,
    volume,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    addTrack,
    removeTrack,
  } = useAudioStore();

  const { getActiveUser } = useCoupleStore();
  const activeUser = getActiveUser();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [url, setUrl] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const audioFileRef = useRef<HTMLInputElement | null>(null);

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

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    addTrack({
      coupleId: "couple-888-999-111",
      title,
      artist: artist || "Unknown Artist",
      storagePath:
        url ||
        "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
      durationSeconds: 180,
      addedBy: activeUser.id,
      addedByName: activeUser.displayName,
      coverArtUrl:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
    });

    setTitle("");
    setArtist("");
    setUrl("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Music className="w-5 h-5 text-rose-500" />
            Shared Music Queue
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Synched queue for both partners
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors"
          aria-label="Add new song to queue"
        >
          <Plus className="w-4 h-4" /> Add Song
        </button>
      </div>

      {/* Main Track Display Card */}
      {currentTrack && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-xl border border-slate-800 flex flex-col items-center text-center">
          <div className="w-40 h-40 rounded-xl overflow-hidden shadow-2xl mb-4 border border-slate-700">
            <img
              src={
                currentTrack.coverArtUrl ||
                "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300"
              }
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>

          <h3 className="text-lg font-bold line-clamp-1">
            {currentTrack.title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
            {currentTrack.artist}
          </p>
          <p className="text-[11px] text-rose-400 font-medium mt-1">
            Added by {currentTrack.addedByName}
          </p>

          {/* Seek Bar */}
          <div className="w-full mt-4 space-y-1">
            <input
              type="range"
              min={0}
              max={durationSeconds || 100}
              value={positionSeconds}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              aria-label="Seek position"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>{formatTime(positionSeconds)}</span>
              <span>{formatTime(durationSeconds)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <button
              onClick={prevTrack}
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              aria-label="Previous track"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transition-transform active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </button>
            <button
              onClick={nextTrack}
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              aria-label="Next track"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="w-full mt-4 flex items-center gap-3 px-2">
            <button
              onClick={handleMuteToggle}
              className="p-1.5 rounded-full text-slate-400 hover:text-white transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
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
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              aria-label="Volume"
            />
            <span className="text-[10px] text-slate-500 font-mono w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Playlist / Queue List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Playlist Queue
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {queue.length} tracks
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="text-center py-10">
            <Music className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No tracks in queue
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Add songs to start listening together!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {queue.map((track, idx) => {
              const isSelected = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  className={`py-2.5 px-2 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? "bg-rose-50 dark:bg-rose-950/40"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => playTrack(track)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Play ${track.title} by ${track.artist}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") playTrack(track);
                    }}
                  >
                    <span className="text-xs font-bold text-slate-400 w-4 text-center">
                      {idx + 1}
                    </span>
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0">
                      <img
                        src={
                          track.coverArtUrl ||
                          "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=100"
                        }
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isSelected
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {track.artist} •{" "}
                        <span className="text-slate-500">
                          Added by {track.addedByName}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeTrack(track.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    aria-label={`Remove ${track.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Song Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleAddSong}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-xs shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
              Add Song to Queue
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Song Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunset Reverie"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Artist
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chill Beats"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Audio Source
                </label>
                <input
                  type="url"
                  placeholder="Paste MP3 URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
                />
                <div className="mt-2 text-center">
                  <span className="text-[10px] text-slate-400">or</span>
                </div>
                <button
                  type="button"
                  onClick={() => audioFileRef.current?.click()}
                  className="w-full mt-1 py-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5 hover:border-rose-400 hover:text-rose-500 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Audio File
                </button>
                <input
                  ref={audioFileRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileSelect}
                  className="hidden"
                  aria-label="Upload audio file"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white font-semibold text-xs hover:bg-rose-600 transition-colors"
              >
                Add Track
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
