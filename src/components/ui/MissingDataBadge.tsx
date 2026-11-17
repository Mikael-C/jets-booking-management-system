"use client";

import React from "react";

interface MissingDataBadgeProps {
  label?: string;
  tooltip?: string;
  className?: string;
}

export default function MissingDataBadge({
  label = "Missing data",
  tooltip,
  className = ""
}: MissingDataBadgeProps) {
  return (
    <span
      title={tooltip || label}
      className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--amber)] bg-[var(--amber-soft)] px-1.5 py-0.5 rounded border border-[var(--amber)]/30 ${className}`}
    >
      <span>▲</span>
      {label && <span>{label}</span>}
    </span>
  );
}
