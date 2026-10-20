"use client";

import React from "react";
import { useAviation } from "@/lib/aviationContext";
import { CheckSquare, Square, X, AlertTriangle, ShieldCheck, Clock, User, CheckCircle2, PlaneTakeoff } from "lucide-react";

export default function ChecklistDrawer() {
  const { isChecklistDrawerOpen, closeChecklist, activeBooking, toggleChecklistItem, updateBookingStatus } = useAviation();

  if (!isChecklistDrawerOpen || !activeBooking) return null;

  const totalSteps = activeBooking.checklist.length;
  const completedSteps = activeBooking.checklist.filter((s) => s.isCompleted).length;
  const percentComplete = Math.round((completedSteps / totalSteps) * 100);
  const isAllRequiredDone = activeBooking.checklist
    .filter((s) => s.requiredForDispatch)
    .every((s) => s.isCompleted);

  const handleDispatch = () => {
    updateBookingStatus(activeBooking.id, "dispatched");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl h-full bg-[#0F1420] border-l border-gold/30 text-white flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-[#080C14] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10 border border-gold/30 text-gold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-gold font-bold">
                OPERATIONAL DISPATCH CHECKLIST
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Trip {activeBooking.tripNumber}
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-gray-800 text-gray-300">
                  {activeBooking.aircraft.registration || activeBooking.aircraft.name}
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={closeChecklist}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route & Progress Summary */}
        <div className="p-5 bg-[#0B101A] border-b border-gray-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Route: <strong className="text-white">{activeBooking.legs.map((l) => `${l.origin.icao} → ${l.destination.icao}`).join(" | ")}</strong></span>
            <span>Client: <strong className="text-white">{activeBooking.client.fullName}</strong></span>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-gray-400 font-mono text-[11px]">Dispatch Readiness</span>
              <span className={`font-bold font-mono text-xs ${percentComplete === 100 ? "text-emerald-400" : "text-gold"}`}>
                {completedSteps}/{totalSteps} Cleared ({percentComplete}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  percentComplete === 100
                    ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                    : "bg-gold shadow-[0_0_12px_rgba(201,160,82,0.4)]"
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist Steps Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {activeBooking.checklist.map((step) => {
            const isDone = step.isCompleted;
            return (
              <div
                key={step.id}
                onClick={() => toggleChecklistItem(activeBooking.id, step.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                  isDone
                    ? "bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/60"
                    : "bg-gray-900/60 border-gray-800 hover:border-gold/40 hover:bg-gray-900"
                }`}
              >
                <div className="pt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-500 flex-shrink-0 hover:text-gold" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold ${isDone ? "text-emerald-200 line-through opacity-80" : "text-gray-200"}`}>
                      {step.label}
                    </p>
                    {step.requiredForDispatch && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Mandatory
                      </span>
                    )}
                  </div>

                  {step.notes && (
                    <p className="text-[11px] text-gray-400 italic bg-black/30 p-1.5 rounded border border-gray-800">
                      {step.notes}
                    </p>
                  )}

                  {isDone && step.completedAt && (
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono pt-0.5">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>{step.completedAt}</span>
                      {step.completedBy && <span>by {step.completedBy}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#080C14] border-t border-gray-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-gray-400">
            Status: <span className="uppercase font-bold text-white font-mono">{activeBooking.status}</span>
          </div>

          <div className="flex items-center gap-2">
            {activeBooking.status !== "dispatched" && (
              <button
                onClick={handleDispatch}
                disabled={!isAllRequiredDone}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  isAllRequiredDone
                    ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 cursor-pointer"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                <PlaneTakeoff className="w-4 h-4" />
                <span>Clear & Dispatch Flight</span>
              </button>
            )}

            <button
              onClick={closeChecklist}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
