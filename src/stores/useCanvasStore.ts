import { create } from "zustand";
import { CanvasStroke, SavedDoodle } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { useCoupleStore } from "./useCoupleStore";
import {
  saveLocalStrokes,
  getLocalStrokes,
} from "@/lib/offline/storageEngine";

interface CanvasState {
  strokes: CanvasStroke[];
  savedDoodles: SavedDoodle[];
  activeColor: string;
  brushWidth: number;
  canvasTitle: string;
  isSynced: boolean;

  fetchDoodles: (coupleId: string) => Promise<void>;
  subscribeToCanvas: (coupleId: string) => void;
  cleanupCanvasSubscription: () => void;
  addStroke: (stroke: CanvasStroke, shouldBroadcast?: boolean) => void;
  undoLastStroke: (shouldBroadcast?: boolean) => void;
  clearCanvas: (shouldBroadcast?: boolean) => void;
  setActiveColor: (color: string) => void;
  setBrushWidth: (width: number) => void;
  setCanvasTitle: (title: string) => void;
  saveDoodle: (dataUrl: string, createdBy: string, createdByName: string) => Promise<void>;
  deleteDoodle: (id: string) => Promise<void>;
}

let activeCanvasChannel: ReturnType<typeof supabase.channel> | null = null;
let activeCanvasCoupleId: string | null = null;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  strokes: getLocalStrokes(),
  savedDoodles: [],
  activeColor: "#f43f5e",
  brushWidth: 4,
  canvasTitle: "Our Shared Sketch",
  isSynced: false,

  fetchDoodles: async (coupleId: string) => {
    const { data, error } = await supabase
      .from("saved_doodles")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      set({
        savedDoodles: data.map((d) => ({
          id: d.id,
          coupleId: d.couple_id,
          createdBy: d.created_by,
          createdByName: d.created_by_name || "Partner",
          storagePath: d.storage_path,
          title: d.title || "Untitled Doodle",
          createdAt: d.created_at,
        })),
      });
    }
  },

  subscribeToCanvas: (coupleId: string) => {
    if (!coupleId || coupleId.startsWith("couple-local-") || coupleId === "UNPAIRED") return;

    if (activeCanvasCoupleId === coupleId && activeCanvasChannel) {
      return;
    }

    if (activeCanvasChannel) {
      try {
        supabase.removeChannel(activeCanvasChannel);
      } catch {}
      activeCanvasChannel = null;
      activeCanvasCoupleId = null;
    }

    try {
      const channel = supabase.channel(`canvas_collab:${coupleId}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "stroke" }, ({ payload }) => {
          if (payload && payload.id) {
            set((state) => {
              if (state.strokes.some((s) => s.id === payload.id)) return state;
              const updated = [...state.strokes, payload];
              saveLocalStrokes(updated);
              return { strokes: updated };
            });
          }
        })
        .on("broadcast", { event: "undo" }, () => {
          set((state) => {
            const updated = state.strokes.slice(0, -1);
            saveLocalStrokes(updated);
            return { strokes: updated };
          });
        })
        .on("broadcast", { event: "clear" }, () => {
          saveLocalStrokes([]);
          set({ strokes: [] });
        })
        .on("broadcast", { event: "request_sync" }, () => {
          const currentStrokes = get().strokes;
          if (currentStrokes.length > 0) {
            channel.send({
              type: "broadcast",
              event: "sync_state",
              payload: currentStrokes,
            }).catch(() => {});
          }
        })
        .on("broadcast", { event: "sync_state" }, ({ payload }) => {
          if (Array.isArray(payload) && payload.length > 0) {
            set((state) => {
              if (state.strokes.length === 0) {
                saveLocalStrokes(payload);
                return { strokes: payload };
              }
              const existingIds = new Set(state.strokes.map((s) => s.id));
              const newStrokes = payload.filter((s: CanvasStroke) => !existingIds.has(s.id));
              if (newStrokes.length > 0) {
                const updated = [...state.strokes, ...newStrokes];
                saveLocalStrokes(updated);
                return { strokes: updated };
              }
              return state;
            });
          }
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            set({ isSynced: true });
            channel.send({
              type: "broadcast",
              event: "request_sync",
              payload: {},
            }).catch(() => {});
          }
        });

      activeCanvasChannel = channel;
      activeCanvasCoupleId = coupleId;
    } catch (err) {
      console.warn("Failed to subscribe to real-time canvas:", err);
    }
  },

  cleanupCanvasSubscription: () => {
    if (activeCanvasChannel) {
      try {
        supabase.removeChannel(activeCanvasChannel);
      } catch {}
      activeCanvasChannel = null;
      activeCanvasCoupleId = null;
    }
    set({ isSynced: false });
  },

  addStroke: (stroke, shouldBroadcast = true) => {
    set((state) => {
      const updated = [...state.strokes, stroke];
      saveLocalStrokes(updated);
      return { strokes: updated };
    });

    if (shouldBroadcast && activeCanvasChannel) {
      activeCanvasChannel.send({
        type: "broadcast",
        event: "stroke",
        payload: stroke,
      }).catch((err) => {
        console.warn("Failed to broadcast stroke:", err);
      });
    }
  },

  undoLastStroke: (shouldBroadcast = true) => {
    set((state) => {
      const updated = state.strokes.slice(0, -1);
      saveLocalStrokes(updated);
      return { strokes: updated };
    });

    if (shouldBroadcast && activeCanvasChannel) {
      activeCanvasChannel.send({
        type: "broadcast",
        event: "undo",
        payload: {},
      }).catch(() => {});
    }
  },

  clearCanvas: (shouldBroadcast = true) => {
    saveLocalStrokes([]);
    set({ strokes: [] });

    if (shouldBroadcast && activeCanvasChannel) {
      activeCanvasChannel.send({
        type: "broadcast",
        event: "clear",
        payload: {},
      }).catch(() => {});
    }
  },

  setActiveColor: (activeColor) => set({ activeColor }),
  setBrushWidth: (brushWidth) => set({ brushWidth }),
  setCanvasTitle: (canvasTitle) => set({ canvasTitle }),

  saveDoodle: async (dataUrl, createdBy, createdByName) => {
    const { couple } = useCoupleStore.getState();
    if (!couple || !couple.id) return;
    const title = get().canvasTitle || "Our Collaborative Sketch";

    const { data, error } = await supabase
      .from("saved_doodles")
      .insert({
        couple_id: couple.id,
        created_by: createdBy,
        created_by_name: createdByName,
        storage_path: dataUrl,
        title,
      })
      .select()
      .single();

    if (!error && data) {
      const newDoodle: SavedDoodle = {
        id: data.id,
        coupleId: data.couple_id,
        createdBy: data.created_by,
        createdByName: data.created_by_name || createdByName,
        storagePath: data.storage_path,
        title: data.title || title,
        createdAt: data.created_at,
      };
      set((state) => ({ savedDoodles: [newDoodle, ...state.savedDoodles] }));
    }
  },

  deleteDoodle: async (id) => {
    await supabase.from("saved_doodles").delete().eq("id", id);
    set((state) => ({
      savedDoodles: state.savedDoodles.filter((d) => d.id !== id),
    }));
  },
}));
