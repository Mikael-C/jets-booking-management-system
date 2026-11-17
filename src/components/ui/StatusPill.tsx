"use client";

import React from "react";

export type PillVariant = "amber" | "green" | "red" | "blue" | "grey";

interface StatusPillProps {
  label: string;
  variant?: PillVariant;
  icon?: React.ReactNode;
  className?: string;
}

export default function StatusPill({
  label,
  variant = "grey",
  icon,
  className = ""
}: StatusPillProps) {
  return (
    <span className={`pill ${variant} ${className}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
}
