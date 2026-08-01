import { create } from "zustand";
import { CanvasStroke, SavedDoodle } from "@/types";
import { MOCK_SAVED_DOODLES } from "@/lib/mock/mockData";

interface CanvasState {
  strokes: CanvasStroke[];
  savedDoodles: SavedDoodle[];
  activeColor: string;
  brushWidth: number;
  canvasTitle: string;

  // Actions
  addStroke: (stroke: CanvasStroke) => void;
  undoLastStroke: () => void;
  clearCanvas: () => void;
  setActiveColor: (color: string) => void;
  setBrushWidth: (width: number) => void;
  setCanvasTitle: (title: string) => void;
  saveDoodle: (dataUrl: string, createdBy: string, createdByName: string) => void;
  deleteDoodle: (id: string) => void;
  downloadDoodle: (dataUrl: string, filename: string) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  strokes: [],
  savedDoodles: MOCK_SAVED_DOODLES,
  activeColor: "#f43f5e", // Rose primary accent
  brushWidth: 4,
  canvasTitle: "Our Shared Sketch",

  addStroke: (stroke) => set((state) => ({ strokes: [...state.strokes, stroke] })),

  undoLastStroke: () =>
    set((state) => ({
      strokes: state.strokes.slice(0, -1),
    })),

  clearCanvas: () => set({ strokes: [] }),

  setActiveColor: (activeColor) => set({ activeColor }),
  setBrushWidth: (brushWidth) => set({ brushWidth }),
  setCanvasTitle: (canvasTitle) => set({ canvasTitle }),

  saveDoodle: (dataUrl, createdBy, createdByName) => {
    const newDoodle: SavedDoodle = {
      id: `doodle-${Date.now()}`,
      coupleId: "couple-888-999-111",
      createdBy,
      createdByName,
      storagePath: dataUrl,
      title: get().canvasTitle || "Untitled Doodle",
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ savedDoodles: [newDoodle, ...state.savedDoodles] }));
  },

  deleteDoodle: (id) =>
    set((state) => ({
      savedDoodles: state.savedDoodles.filter((d) => d.id !== id),
    })),

  downloadDoodle: (dataUrl, filename) => {
    if (typeof window === "undefined") return;
    const link = document.createElement("a");
    link.download = `${filename.replace(/\s+/g, "-")}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
}));
