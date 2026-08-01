import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Icon className="w-7 h-7 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-400 mt-1.5 max-w-[220px] mx-auto">
          {subtitle}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
