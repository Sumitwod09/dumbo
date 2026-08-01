"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-rose-500" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
        Something went wrong
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[260px]">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="mt-6 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm"
      >
        <RotateCcw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
