"use client";

import React from "react";

export interface KpiItem {
  id: string;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "neutral" | "positive" | "warning" | "danger";
  onClick?: () => void;
  isActive?: boolean;
}

interface KpiStripProps {
  items: KpiItem[];
  className?: string;
}

export default function KpiStrip({ items, className = "" }: KpiStripProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-5 ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          onClick={item.onClick}
          className={`bg-[var(--card)] border rounded-xl p-3.5 transition-all select-none ${
            item.onClick ? "cursor-pointer hover:border-[var(--accent)] hover:shadow-sm" : ""
          } ${
            item.isActive
              ? "border-[var(--accent)] ring-1 ring-[var(--accent)] bg-[var(--accent-soft)]"
              : "border-[var(--line)]"
          }`}
        >
          <span className="block font-display text-[11px] uppercase tracking-wider text-[var(--muted)] font-bold">
            {item.label}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-2xl font-black text-[var(--ink)] tabular-nums">
              {item.value}
            </span>
            {item.subtext && (
              <span className="text-[11px] text-[var(--muted)] font-mono truncate">
                {item.subtext}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
