"use client";

import React from "react";
import { Booking } from "@/types/aviation";

interface DocumentHeaderProps {
  booking?: Booking;
}

export default function DocumentHeader({ booking }: DocumentHeaderProps) {
  // Use operator info if present, with defaults matching the design specifications
  const legalName = booking?.operator?.legalEntity || booking?.operator?.companyName ? undefined : "[Company legal name]";
  const legalAddress = booking?.operator?.courtOfJurisdiction ? undefined : "[Registered address, Malta]";
  const taxInfo = booking?.operator?.vatNumber ? undefined : "[Company no. · VAT no.]";
  const contact = booking?.operator?.supportEmail ? undefined : "charter@orbelo.com · [+356 phone]";

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
            <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
              ORBELO
            </span>
            <span className="text-[11px] text-slate-500 font-normal block leading-tight">
              Private jet charter
            </span>
          </div>
        </div>

        {/* Company Legal Information */}
        <div className="text-right text-[11px] leading-tight text-[#8D7249] font-normal space-y-0.5">
          <div>{booking?.operator?.legalEntity || booking?.operator?.companyName || legalName}</div>
          <div>{booking?.operator?.courtOfJurisdiction || legalAddress}</div>
          <div>
            {booking?.operator?.vatNumber
              ? `${booking.operator.commercialRegistry || "Reg. Malta"} · VAT ${booking.operator.vatNumber}`
              : taxInfo}
          </div>
          <div>
            {booking?.operator?.supportEmail
              ? `${booking.operator.supportEmail} · ${booking.operator.supportPhone}`
              : contact}
          </div>
        </div>
      </div>

      {/* Gold Divider Line */}
      <div className="w-full border-b border-[#C5A880] mt-3.5 mb-5" />
    </div>
  );
}
