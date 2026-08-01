import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function LoadingSpinner({ size = "md", label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-rose-500 animate-spin`}
        role="status"
        aria-label={label || "Loading"}
      />
      {label && (
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      )}
    </div>
  );
}
