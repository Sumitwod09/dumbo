import { create } from "zustand";
import { Audio } from "expo-av";
import { Song } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { useCoupleStore } from "./useCoupleStore";

interface AudioState {
  currentTrack: Song | null;
  queue: Song[];
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  volume: number;
  soundObject: Audio.Sound | null;

  fetchSongs: (coupleId: string) => Promise<void>;
  setQueue: (queue: Song[]) => void;
  playTrack: (track: Song) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  addTrack: (track: Omit<Song, "id" | "createdAt" | "queuePosition">) => Promise<void>;
  removeTrack: (id: string) => Promise<void>;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  cleanup: () => void;
}

let positionInterval: ReturnType<typeof setInterval> | null = null;

function stopPositionPolling() {
  if (positionInterval) {
    clearInterval(positionInterval);
    positionInterval = null;
  }
}

export const useAudioStore = create<AudioState>((set, get) => {
  function startPositionPolling() {
    stopPositionPolling();
    positionInterval = setInterval(async () => {
      const { soundObject, isPlaying } = get();
      if (soundObject && isPlaying) {
        try {
          const status = await soundObject.getStatusAsync();
          if (status.isLoaded) {
            set({
              positionSeconds: (status.positionMillis || 0) / 1000,
              durationSeconds: (status.durationMillis || 180000) / 1000,
            });
          }
        } catch {
          // ignore
        }
      }
    }, 500);
  }

  return {
    currentTrack: null,
    queue: [],
    isPlaying: false,
    positionSeconds: 0,
    durationSeconds: 180,
    volume: 0.8,
    soundObject: null,

    fetchSongs: async (coupleId: string) => {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .eq("couple_id", coupleId)
        .order("queue_position", { ascending: true });

      if (!error && data) {
        const mappedSongs: Song[] = data.map((s) => ({
          id: s.id,
          coupleId: s.couple_id,
          title: s.title,
          artist: s.artist || "Unknown Artist",
          storagePath: s.storage_path,
          coverArtUrl: s.cover_art_url,
          durationSeconds: s.duration_seconds || 180,
          addedBy: s.added_by,
          addedByName: s.added_by_name || "Partner",
          queuePosition: s.queue_position || 1,
          createdAt: s.created_at,
        }));
        set({
          queue: mappedSongs,
          currentTrack: mappedSongs[0] || null,
          durationSeconds: mappedSongs[0]?.durationSeconds || 180,
        });
      }
    },

    setQueue: (queue) => set({ queue }),

    playTrack: async (track) => {
      const { soundObject: oldSound } = get();
      stopPositionPolling();

      if (oldSound) {
        try {
          await oldSound.unloadAsync();
        } catch {}
      }

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: track.storagePath },
          { shouldPlay: true, volume: get().volume },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              stopPositionPolling();
              get().nextTrack();
            }
          }
        );

        set({
          currentTrack: track,
          soundObject: sound,
          isPlaying: true,
          durationSeconds: track.durationSeconds,
          positionSeconds: 0,
        });
        startPositionPolling();
      } catch (err) {
        console.warn("Audio playback error:", err);
        set({
          currentTrack: track,
          isPlaying: false,
          durationSeconds: track.durationSeconds,
          positionSeconds: 0,
        });
      }
    },

    togglePlay: async () => {
      const { soundObject, currentTrack, isPlaying, playTrack } = get();
      if (!currentTrack) return;

      if (!soundObject) {
        playTrack(currentTrack);
        return;
      }

      try {
        if (isPlaying) {
          await soundObject.pauseAsync();
          stopPositionPolling();
          set({ isPlaying: false });
        } else {
          await soundObject.playAsync();
          set({ isPlaying: true });
          startPositionPolling();
        }
      } catch (err) {
        console.warn("Toggle play error:", err);
      }
    },

    seek: async (seconds) => {
      const { soundObject } = get();
      if (soundObject) {
        try {
          await soundObject.setPositionAsync(seconds * 1000);
        } catch {}
      }
      set({ positionSeconds: seconds });
    },

    setVolume: async (volume) => {
      const { soundObject } = get();
      if (soundObject) {
        try {
          await soundObject.setVolumeAsync(volume);
        } catch {}
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

    addTrack: async (trackData) => {
      const { couple } = useCoupleStore.getState();
      if (!couple || !couple.id) return;
      const { queue } = get();

      const { data, error } = await supabase
        .from("songs")
        .insert({
          couple_id: couple.id,
          title: trackData.title,
          artist: trackData.artist,
          storage_path: trackData.storagePath,
          cover_art_url: trackData.coverArtUrl || "",
          duration_seconds: trackData.durationSeconds,
          added_by: trackData.addedBy,
          added_by_name: trackData.addedByName,
          queue_position: queue.length + 1,
        })
        .select()
        .single();

      if (!error && data) {
        const newTrack: Song = {
          id: data.id,
          coupleId: data.couple_id,
          title: data.title,
          artist: data.artist || "Unknown Artist",
          storagePath: data.storage_path,
          coverArtUrl: data.cover_art_url,
          durationSeconds: data.duration_seconds || 180,
          addedBy: data.added_by,
          addedByName: data.added_by_name || "Partner",
          queuePosition: data.queue_position || 1,
          createdAt: data.created_at,
        };
        set({ queue: [...queue, newTrack] });
      }
    },

    removeTrack: async (id) => {
      const { queue, currentTrack } = get();
      await supabase.from("songs").delete().eq("id", id);

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

    cleanup: async () => {
      const { soundObject } = get();
      stopPositionPolling();
      if (soundObject) {
        try {
          await soundObject.unloadAsync();
        } catch {}
      }
    },
  };
});
