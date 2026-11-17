"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { useAviation } from "@/lib/aviationContext";
import { initialSettings } from "@/data/initialSettings";

interface DocumentHeaderProps {
  booking?: Booking;
}

export default function DocumentHeader({ booking }: DocumentHeaderProps) {
  const { settings } = useAviation();
  const company = settings?.company || initialSettings.company;

  return (
    <div className="w-full">
      <div className="flex items-start justify-between">
        {/* Brand Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#121620] flex items-center justify-center shadow-sm flex-shrink-0">
            {/* Orbelo Gold Emblem */}
            <div className="w-4 h-4 rounded-[5px] border-[2.5px] border-[#D4A359] flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#D4A359]" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight font-display">
              {company.name.toUpperCase()}
            </span>
            <span className="text-[11px] text-slate-500 font-normal block leading-tight font-sans">
              Private jet charter
            </span>
          </div>
        </div>

        {/* Company Legal Information (strictly from Settings per R-027, never operator name) */}
        <div className="text-right text-[11px] leading-tight text-[#8D7249] font-normal space-y-0.5 font-mono">
          <div>{company.legalEntity}</div>
          <div>{company.address}</div>
          <div>VAT {company.vatNumber} • {company.courtOfJurisdiction}</div>
          <div>{company.email} • {company.phone}</div>
        </div>
      </div>

      {/* Gold Divider Line */}
      <div className="w-full border-b border-[#C5A880] mt-3.5 mb-5" />
    </div>
  );
}
