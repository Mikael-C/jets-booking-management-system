"use client";

import React from "react";

export type TripStage =
  | "request"
  | "sourcing"
  | "quoted"
  | "booked"
  | "paid"
  | "confirmed"
  | "flown"
  | "closed"
  | "cancelled";

const STAGES: { key: TripStage; label: string }[] = [
  { key: "request", label: "Request" },
  { key: "sourcing", label: "Sourcing" },
  { key: "quoted", label: "Quoted" },
  { key: "booked", label: "Booked" },
  { key: "paid", label: "Paid" },
  { key: "confirmed", label: "Confirmed" },
  { key: "flown", label: "Flown" },
  { key: "closed", label: "Closed" }
];

interface StageStepperProps {
  currentStage: TripStage;
  isCancelled?: boolean;
  cancelledReason?: string;
}

export default function StageStepper({
  currentStage,
  isCancelled = false,
  cancelledReason
}: StageStepperProps) {
  if (isCancelled || currentStage === "cancelled") {
    return (
      <div className="flex items-center gap-3 p-3 bg-[var(--red-soft)] border border-[var(--red)]/40 rounded-lg">
        <span className="pill red font-bold">▲ CANCELLED</span>
        <span className="text-xs text-[var(--red)] font-medium">
          {cancelledReason || "This trip has been cancelled. Only historic documents remain accessible."}
        </span>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === currentStage.toLowerCase());
  const activeIdx = currentIndex === -1 ? 2 : currentIndex;

  return (
    <div className="w-full bg-[var(--wf)] border border-[var(--wf2)] rounded-lg p-1.5 overflow-x-auto">
      <div className="flex items-center min-w-[620px]">
        {STAGES.map((stage, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;

          return (
            <div
              key={stage.key}
              className={`flex-1 text-center py-2 px-1 text-xs font-mono transition-all border-r last:border-r-0 border-[var(--card)] ${
                isCurrent
                  ? "bg-[var(--wfink)] text-[var(--card)] font-bold shadow-sm"
                  : isDone
                  ? "bg-[var(--wf2)] text-[var(--ink)] font-medium"
                  : "text-[var(--muted)] opacity-70"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[10px] opacity-60">0{idx + 1}</span>
                <span>{stage.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
