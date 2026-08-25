import { create } from "zustand";
import { CanvasStroke, SavedDoodle } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { useCoupleStore } from "./useCoupleStore";

interface CanvasState {
  strokes: CanvasStroke[];
  savedDoodles: SavedDoodle[];
  activeColor: string;
  brushWidth: number;
  canvasTitle: string;

  fetchDoodles: (coupleId: string) => Promise<void>;
  addStroke: (stroke: CanvasStroke) => void;
  undoLastStroke: () => void;
  clearCanvas: () => void;
  setActiveColor: (color: string) => void;
  setBrushWidth: (width: number) => void;
  setCanvasTitle: (title: string) => void;
  saveDoodle: (dataUrl: string, createdBy: string, createdByName: string) => Promise<void>;
  deleteDoodle: (id: string) => Promise<void>;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  strokes: [],
  savedDoodles: [],
  activeColor: "#f43f5e",
  brushWidth: 4,
  canvasTitle: "Our Shared Sketch",

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

  addStroke: (stroke) => set((state) => ({ strokes: [...state.strokes, stroke] })),

  undoLastStroke: () =>
    set((state) => ({
      strokes: state.strokes.slice(0, -1),
    })),

  clearCanvas: () => set({ strokes: [] }),

  setActiveColor: (activeColor) => set({ activeColor }),
  setBrushWidth: (brushWidth) => set({ brushWidth }),
  setCanvasTitle: (canvasTitle) => set({ canvasTitle }),

  saveDoodle: async (dataUrl, createdBy, createdByName) => {
    const { couple } = useCoupleStore.getState();
    if (!couple || !couple.id) return;
    const title = get().canvasTitle || "Untitled Doodle";

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
