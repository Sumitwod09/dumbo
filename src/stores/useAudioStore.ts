import { create } from "zustand";
import { Howl } from "howler";
import { Song } from "@/types";
import { MOCK_SONGS } from "@/lib/mock/mockData";
import { createTrackHowl } from "@/lib/audio/howler-instance";

// Module-level RAF id — not in Zustand state (non-serializable)
let positionRafId: number | null = null;

function stopPositionPolling() {
  if (positionRafId !== null) {
    cancelAnimationFrame(positionRafId);
    positionRafId = null;
  }
}

interface AudioState {
  currentTrack: Song | null;
  queue: Song[];
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  volume: number;
  howlInstance: Howl | null;

  // Actions
  setQueue: (queue: Song[]) => void;
  playTrack: (track: Song) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  addTrack: (track: Omit<Song, "id" | "createdAt" | "queuePosition">) => void;
  removeTrack: (id: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => {
  function startPositionPolling() {
    stopPositionPolling();

    const poll = () => {
      const { howlInstance, isPlaying } = get();
      if (howlInstance && isPlaying) {
        const seek = howlInstance.seek();
        if (typeof seek === "number" && !isNaN(seek)) {
          set({ positionSeconds: seek });
        }
      }
      positionRafId = requestAnimationFrame(poll);
    };

    if (typeof window !== "undefined") {
      positionRafId = requestAnimationFrame(poll);
    }
  }

  return {
    currentTrack: MOCK_SONGS[0],
    queue: MOCK_SONGS,
    isPlaying: false,
    positionSeconds: 0,
    durationSeconds: MOCK_SONGS[0].durationSeconds,
    volume: 0.8,
    howlInstance: null,

    setQueue: (queue) => set({ queue }),

    playTrack: (track) => {
      const { howlInstance } = get();
      stopPositionPolling();
      if (howlInstance) {
        howlInstance.unload();
      }

      const newHowl = createTrackHowl(track.storagePath, {
        onEnd: () => {
          stopPositionPolling();
          get().nextTrack();
        },
        onLoadError: (_id, err) => {
          console.warn("Howler load error, fallback playhead simulation", err);
        },
      });

      newHowl.volume(get().volume);
      newHowl.play();
      set({
        currentTrack: track,
        howlInstance: newHowl,
        isPlaying: true,
        durationSeconds: track.durationSeconds,
        positionSeconds: 0,
      });
      startPositionPolling();
    },

    togglePlay: () => {
      const { howlInstance, currentTrack, isPlaying, playTrack } = get();
      if (!currentTrack) return;

      if (!howlInstance) {
        playTrack(currentTrack);
        return;
      }

      if (isPlaying) {
        howlInstance.pause();
        stopPositionPolling();
        set({ isPlaying: false });
      } else {
        howlInstance.play();
        set({ isPlaying: true });
        startPositionPolling();
      }
    },

    seek: (seconds) => {
      const { howlInstance } = get();
      if (howlInstance) {
        howlInstance.seek(seconds);
      }
      set({ positionSeconds: seconds });
    },

    setVolume: (volume) => {
      const { howlInstance } = get();
      if (howlInstance) {
        howlInstance.volume(volume);
      }
      set({ volume });
    },

    nextTrack: () => {
      const { queue, currentTrack, playTrack } = get();
      if (!currentTrack || queue.length === 0) return;

      const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
      const nextIndex = (currentIndex + 1) % queue.length;
      playTrack(queue[nextIndex]);
    },

    prevTrack: () => {
      const { queue, currentTrack, playTrack } = get();
      if (!currentTrack || queue.length === 0) return;

      const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
      const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
      playTrack(queue[prevIndex]);
    },

    addTrack: (trackData) => {
      const { queue } = get();
      const newTrack: Song = {
        ...trackData,
        id: `song-${Date.now()}`,
        createdAt: new Date().toISOString(),
        queuePosition: queue.length + 1,
      };
      const updatedQueue = [...queue, newTrack];
      set({ queue: updatedQueue });
    },

    removeTrack: (id) => {
      const { queue, currentTrack } = get();
      const updatedQueue = queue
        .filter((t) => t.id !== id)
        .map((t, idx) => ({ ...t, queuePosition: idx + 1 }));
      set({ queue: updatedQueue });
      if (currentTrack?.id === id && updatedQueue.length > 0) {
        get().playTrack(updatedQueue[0]);
      }
    },

    reorderQueue: (fromIndex, toIndex) => {
      const { queue } = get();
      const updated = [...queue];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      set({
        queue: updated.map((t, idx) => ({ ...t, queuePosition: idx + 1 })),
      });
    },
  };
});

