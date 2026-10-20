"use client";

import React from "react";
import { fleetData } from "@/data/fleet";
import { Plane, ShieldCheck, Users, Gauge, Compass, Fuel, CheckCircle2 } from "lucide-react";

export default function FleetView() {
  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              FLEET & ASSET READINESS
            </span>
            <span className="text-xs text-[#0F1420]/60">Airworthiness Status</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Managed Private Jet Fleet Roster
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Operational status, hourly charter rates, cabin configurations, and tail registrations for Orbelo aviation fleet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            {fleetData.length} Aircraft Fully Available
          </span>
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {fleetData.map((jet) => (
          <div
            key={jet.id}
            className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm transition-all space-y-4 relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#9A7A35] bg-[#C9A052]/15 border border-[#C9A052]/30 px-2 py-0.5 rounded">
                  {jet.categoryLabel}
                </span>
                <h3 className="text-base font-extrabold text-[#0F1420] mt-1.5">{jet.name}</h3>
                <p className="text-xs text-gray-500 font-mono">Tail: <strong className="text-[#0F1420]">{jet.registration || "OE-FFB"}</strong></p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-gray-500 block">Charter Rate</span>
                <span className="text-lg font-black text-[#0F1420] font-mono">
                  €{jet.pricePerHour.toLocaleString()}<span className="text-xs text-gray-400">/hr</span>
                </span>
              </div>
            </div>

            {/* Jet Specifications Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-[#F5F2EC] rounded-xl text-xs font-mono text-[#0F1420]">
              <div className="text-center">
                <span className="text-[10px] text-gray-500 block">SEATS</span>
                <strong className="text-xs">{jet.passengers} Pax</strong>
              </div>
              <div className="text-center border-x border-[#E0DAD0]">
                <span className="text-[10px] text-gray-500 block">RANGE</span>
                <strong className="text-xs">{jet.range} nm</strong>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-gray-500 block">SPEED</span>
                <strong className="text-xs">{jet.cruiseSpeed || "420 kts"}</strong>
              </div>
            </div>

            {/* Cabin Amenities */}
            <div className="text-xs text-[#0F1420]/80 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Lavatory / Toilette:</span>
                <span className="font-bold">{jet.toilette ? "Enclosed Private Lavatory" : "Not fitted"}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Cabin Height & Width:</span>
                <span className="font-mono">{jet.cabinHeight || "1.37 m"} × {jet.cabinWidth || "1.40 m"}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Baggage Capacity:</span>
                <span className="font-mono">{jet.baggageVolume || "1.6 m³"}</span>
              </div>
            </div>

            {/* Status Footer */}
            <div className="pt-3 border-t border-[#E0DAD0] flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Airworthy & Certified
              </span>
              <span className="text-gray-400 font-mono text-[11px]">
                EASA A.O.C. Active
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
