"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useCanvasStore } from "@/stores/useCanvasStore";
import { useCoupleStore } from "@/stores/useCoupleStore";
import {
  Pencil,
  Undo2,
  Eraser,
  Download,
  Image as ImageIcon,
  Trash2,
  X,
  Save,
} from "lucide-react";

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState<"draw" | "gallery">("draw");
  const [selectedDoodle, setSelectedDoodle] = useState<string | null>(null);

  const {
    strokes,
    savedDoodles,
    activeColor,
    brushWidth,
    canvasTitle,
    addStroke,
    undoLastStroke,
    clearCanvas,
    setActiveColor,
    setBrushWidth,
    setCanvasTitle,
    saveDoodle,
    deleteDoodle,
    downloadDoodle,
  } = useCanvasStore();

  const { getActiveUser } = useCoupleStore();
  const activeUser = getActiveUser();

  const colorOptions = [
    "#f43f5e", // Rose
    "#0ea5e9", // Sky
    "#8b5cf6", // Violet
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#000000", // Black
    "#ffffff", // White
  ];

  // Draw strokes on canvas whenever strokes array changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render grid lines for clean paper aesthetic
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Render strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (activeTab !== "draw") return;

      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undoLastStroke();
      }
      // Delete or Backspace for clear
      if (e.key === "Delete" || e.key === "Backspace") {
        // Only clear if not typing in an input
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          clearCanvas();
        }
      }
    },
    [activeTab, undoLastStroke, clearCanvas]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Touch and Mouse Event Handlers for responsive drawing
  const currentPoints = useRef<{ x: number; y: number }[]>([]);

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const point = getCanvasCoordinates(e);
    currentPoints.current = [point];
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const point = getCanvasCoordinates(e);
    currentPoints.current.push(point);

    // Live draw on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points = currentPoints.current;
    if (points.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.current.length > 0) {
      addStroke({
        id: `stroke-${Date.now()}`,
        color: activeColor,
        width: brushWidth,
        points: currentPoints.current,
        createdBy: activeUser.id,
      });
    }
    currentPoints.current = [];
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    saveDoodle(dataUrl, activeUser.id, activeUser.displayName);
    setActiveTab("gallery");
  };

  const handleDownloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    downloadDoodle(dataUrl, canvasTitle || "dumbo-canvas");
  };

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Pencil className="w-5 h-5 text-rose-500" />
            Real-Time Canvas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Draw together in real-time
          </p>
        </div>

        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("draw")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "draw"
                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
            aria-label="Switch to canvas drawing mode"
          >
            Canvas
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "gallery"
                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
            aria-label={`Switch to gallery. ${savedDoodles.length} saved doodles`}
          >
            Gallery ({savedDoodles.length})
          </button>
        </div>
      </div>

      {activeTab === "draw" ? (
        <div className="space-y-3">
          {/* Keyboard shortcut hint */}
          <div className="flex items-center justify-end gap-3 text-[10px] text-slate-400">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[9px]">
                Ctrl+Z
              </kbd>{" "}
              Undo
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[9px]">
                Del
              </kbd>{" "}
              Clear
            </span>
          </div>

          {/* Drawing Canvas Container */}
          <div className="relative bg-white rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden touch-none">
            <canvas
              ref={canvasRef}
              width={600}
              height={500}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[360px] cursor-crosshair block"
              aria-label="Drawing canvas. Use mouse or touch to draw."
            />

            {/* Title Bar Input */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-center pointer-events-none">
              <input
                type="text"
                value={canvasTitle}
                onChange={(e) => setCanvasTitle(e.target.value)}
                className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 text-xs font-bold px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none"
                aria-label="Canvas title"
              />
            </div>
          </div>

          {/* Color Palette & Brush Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              {/* Color Circles */}
              <div className="flex items-center gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      activeColor === c
                        ? "scale-125 border-rose-500 shadow-sm"
                        : "border-slate-300 dark:border-slate-700"
                    }`}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>

              {/* Brush Width Selector */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Size:</span>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={brushWidth}
                  onChange={(e) => setBrushWidth(Number(e.target.value))}
                  className="w-20 accent-rose-500 cursor-pointer"
                  aria-label="Brush size"
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={undoLastStroke}
                className="flex-1 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors"
                aria-label="Undo last stroke"
              >
                <Undo2 className="w-4 h-4" /> Undo
              </button>
              <button
                onClick={clearCanvas}
                className="flex-1 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors"
                aria-label="Clear all strokes"
              >
                <Eraser className="w-4 h-4" /> Clear
              </button>
              <button
                onClick={handleDownloadCanvas}
                className="flex-1 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors"
                aria-label="Download canvas as PNG"
              >
                <Download className="w-4 h-4" /> PNG
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-1.5 rounded-xl bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-rose-600 shadow-sm transition-colors"
                aria-label="Save doodle to gallery"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Saved Doodles Gallery Grid */
        <div className="space-y-3">
          {savedDoodles.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Saved Doodles Yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Export your drawings from the canvas to keep memories!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {savedDoodles.map((doodle) => (
                <div
                  key={doodle.id}
                  onClick={() => setSelectedDoodle(doodle.storagePath)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm group cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`View doodle: ${doodle.title}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setSelectedDoodle(doodle.storagePath);
                  }}
                >
                  <div className="h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                    <img
                      src={doodle.storagePath}
                      alt={doodle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {doodle.title}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        By {doodle.createdByName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadDoodle(doodle.storagePath, doodle.title);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-500"
                        aria-label={`Download ${doodle.title}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDoodle(doodle.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500"
                        aria-label={`Delete ${doodle.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Doodle Lightbox Modal */}
      {selectedDoodle && (
        <div
          onClick={() => setSelectedDoodle(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-label="Doodle preview"
        >
          <div className="relative max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl">
            <button
              onClick={() => setSelectedDoodle(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={selectedDoodle}
              alt="Doodle preview"
              className="w-full rounded-xl object-contain max-h-96"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadDoodle(selectedDoodle, "doodle");
              }}
              className="mt-3 w-full py-2 rounded-xl bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-rose-600 transition-colors"
              aria-label="Download this doodle"
            >
              <Download className="w-4 h-4" /> Download PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
