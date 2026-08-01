import React from "react";

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-slate-200 dark:bg-slate-800 h-28 rounded-2xl" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-200 dark:bg-slate-800 h-36 rounded-2xl" />
        <div className="bg-slate-200 dark:bg-slate-800 h-36 rounded-2xl" />
      </div>

      {/* Card skeletons */}
      <div className="bg-slate-200 dark:bg-slate-800 h-24 rounded-2xl" />
      <div className="bg-slate-200 dark:bg-slate-800 h-16 rounded-2xl" />
      <div className="bg-slate-200 dark:bg-slate-800 h-20 rounded-2xl" />
    </div>
  );
}
