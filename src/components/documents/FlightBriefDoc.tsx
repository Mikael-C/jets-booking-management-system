"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { useAviation } from "@/lib/aviationContext";
import { initialSettings } from "@/data/initialSettings";
import DocumentHeader from "./DocumentHeader";
import DocumentFooter from "./DocumentFooter";

interface FlightBriefDocProps {
  booking: Booking;
}

export default function FlightBriefDoc({ booking }: FlightBriefDocProps) {
  const { settings } = useAviation();
  const company = settings?.company || initialSettings.company;

  const {
    client,
    aircraft,
    legs,
    tripNumber,
    contractDate,
    services
  } = booking;

  const tripRef = (tripNumber || "FE4578").split("-")[0];
  const quoteVersion = booking.quoteVersion || 1;
  const versionFormatted = String(quoteVersion).padStart(3, "0");
  const briefId = `FB-${tripRef}-${versionFormatted}`;
  const firstLeg = legs && legs.length > 0 ? legs[0] : null;

  const originIcao = firstLeg?.origin?.icao || "LEIB";
  const destIcao = firstLeg?.destination?.icao || "LSGG";
  const originCity = firstLeg?.origin?.city || "Ibiza";
  const destCity = firstLeg?.destination?.city || "Geneva";
  const originName = firstLeg?.origin?.name || "Ibiza Airport";
  const destName = firstLeg?.destination?.name || "Geneva Airport";

  const departureTime = firstLeg?.departureTimeLocal || "10:00";
  const arrivalTime = firstLeg?.arrivalTimeLocal || "12:05";
  const flightDate = firstLeg?.flightDate || contractDate || "20 Nov 2026";
  const blockTime = firstLeg?.flightTimeFormatted || "2h 05m";

  const aircraftName = aircraft?.name || "Citation XLS+";
  const aircraftReg = firstLeg?.aircraftRegistration || aircraft?.registration || "OE-FFB";

  // Itinerary tab: "Contact on the brief" (crew mobile, 24/7 desk or none)
  const briefContact = firstLeg?.briefContact || "desk_24_7";
  const briefCrew = (firstLeg?.crew || []).filter((c) => c.name && (c.role === "CMDR" || c.role === "F/O"));
  const briefLegLabel: string = (booking as any).briefLegLabel || "";

  const repName = booking.agentName || "Marcus Vance";
  const repPhone = "+44 20 7946 0912";

  // Passenger manifest - Names only per R-031, no passport numbers on client brief
  const manifestItems = firstLeg?.passengers && firstLeg.passengers.length > 0
    ? firstLeg.passengers
    : [
        { fullName: `${client?.fullName || "Lead Passenger"} (Lead)`, nationality: "Confirmed on APIS", isLead: true }
      ];

  const cateringText = services?.vipCateringDetails || "Executive VIP catering: cold platters, fresh fruit, artisan bakery & champagne";
  const luggageText = firstLeg?.luggage
    ? `${firstLeg.luggage.standardSuitcases || 4} suitcases, ${firstLeg.luggage.pieceCount || 2} soft bags`
    : "4 standard hard-shell suitcases, 2 soft cabin bags";

  return (
    <div className="flight-brief-document text-slate-900 bg-transparent font-sans max-w-[820px] mx-auto select-none print:max-w-none">
      {/* ================= PAGE 1: FLIGHT BRIEF ================= */}
      <div className="doc-page min-h-[1123px] bg-white p-10 sm:p-12 rounded-sm shadow-xl border border-slate-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between box-border">
        <div className="space-y-6">
          <DocumentHeader booking={booking} />

          {/* Title & Brief Meta */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Flight brief
              </h1>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Client departure itinerary & handling dispatch overview
              </p>
            </div>
            <div className="text-right text-xs space-y-1">
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">BRIEF REF</span>
                <span className="font-semibold text-slate-900 font-mono w-36 text-right">{briefId}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">TRIP ROOT</span>
                <span className="font-semibold text-slate-900 font-mono w-36 text-right">{tripRef}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">ISSUED</span>
                <span className="font-medium text-slate-900 w-36 text-right">{flightDate}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">STATUS</span>
                <span className="font-bold text-emerald-700 w-36 text-right">Confirmed</span>
              </div>
            </div>
          </div>

          {/* Three Cards: DEPARTURE | ARRIVAL | AIRCRAFT */}
          <div className="grid grid-cols-3 gap-4 pt-1">
            {/* Departure */}
            <div className="border border-slate-200 rounded-lg p-4 bg-white">
              <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mb-1">
                DEPARTURE
              </p>
              <p className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                {originIcao} {departureTime}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {flightDate} · Local time
              </p>
              <p className="text-xs text-slate-800 font-medium mt-0.5">
                {originName}
              </p>
            </div>

            {/* Arrival */}
            <div className="border border-slate-200 rounded-lg p-4 bg-white">
              <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mb-1">
                ARRIVAL
              </p>
              <p className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                {destIcao} {arrivalTime}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {flightDate} · Local time
              </p>
              <p className="text-xs text-slate-800 font-medium mt-0.5">
                {destName}
              </p>
            </div>

            {/* Aircraft */}
            <div className="border border-slate-200 rounded-lg p-4 bg-white">
              <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mb-1">
                AIRCRAFT
              </p>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                {aircraftName}
              </p>
              <p className="text-xs text-slate-600 mt-1 font-mono">
                Registration: <strong className="text-slate-900">{aircraftReg}</strong>
              </p>
              <p className="text-xs text-slate-800 font-mono mt-0.5">
                Flight time ≈ {blockTime}
              </p>
            </div>
          </div>

          {/* Where to Go & On Arrival */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-1">
            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                WHERE TO GO · {originCity.toUpperCase()} ({originIcao})
              </p>
              <p className="font-semibold text-slate-900 text-sm">
                {firstLeg?.departureHandling?.name || "ExecuJet FBO Terminal"}
              </p>
              <p className="text-slate-600 mt-1">
                {firstLeg?.departureHandling?.address || "General Aviation Terminal, Airport Way"}
              </p>
              <p className="text-slate-600 font-mono text-[11px] mt-0.5">
                Tel: {firstLeg?.departureHandling?.phone || "+41 22 939 1234"} · VHF: 131.750 MHz
              </p>
              <p className="text-slate-700 mt-2 font-medium">
                Please arrive at the private terminal <strong>20–30 minutes</strong> before departure with original travel documents.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                ON ARRIVAL · {destCity.toUpperCase()} ({destIcao})
              </p>
              <p className="font-semibold text-slate-900 text-sm">
                {firstLeg?.arrivalHandling?.name || "Jet Aviation Private Terminal"}
              </p>
              <p className="text-slate-600 mt-1">
                {firstLeg?.arrivalHandling?.address || "Executive Apron Gate 4"}
              </p>
              <p className="text-slate-600 font-mono text-[11px] mt-0.5">
                Tel: {firstLeg?.arrivalHandling?.phone || "+41 22 717 8200"} · VHF: 130.400 MHz
              </p>
              <p className="text-slate-700 mt-2">
                VIP luggage handling directly to airside transfer vehicle.
              </p>
            </div>
          </div>

          {/* PASSENGERS (NAMES ONLY PER R-031) */}
          <div className="pt-2">
            <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
              PASSENGER MANIFEST
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-2 pr-4 font-bold">PASSENGER NAME</th>
                  <th className="py-2 px-4 font-bold">NATIONALITY</th>
                  <th className="py-2 pl-4 font-bold w-36">TRAVEL STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {manifestItems.map((pax: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-4 font-semibold text-slate-900">{pax.fullName}</td>
                    <td className="py-2.5 px-4 text-slate-700">{pax.nationality || "British"}</td>
                    <td className="py-2.5 pl-4 text-emerald-700 font-medium">Manifest Cleared</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">
              Note: Passport numbers and dates of birth are omitted from the client brief for privacy, but have been transmitted to Border Control & handling agents.
            </p>
          </div>

          {/* Bottom Section: ON BOARD & 24/7 CONTACT */}
          <div className="grid grid-cols-2 gap-8 items-start pt-2">
            {/* On Board */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
                ON BOARD AMENITIES
              </h3>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p>
                  <strong className="text-slate-900">Catering:</strong> {cateringText}
                </p>
                <p>
                  <strong className="text-slate-900">Luggage Allowance:</strong> {luggageText}
                </p>
                <p>
                  <strong className="text-slate-900">Wi-Fi:</strong> High-speed Ka-band connectivity included
                </p>
              </div>
            </div>

            {/* 24/7 CONTACT Box */}
            <div className="border border-slate-900 rounded-lg p-3.5 bg-white">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                24/7 FLIGHT OPERATIONS DISPATCH
              </p>
              <div className="space-y-1 text-xs text-slate-700">
                {briefContact !== "none" && (
                  <p>
                    Operations Duty Desk: <strong className="font-mono text-slate-900">{company.phone24_7 || company.phone}</strong>
                  </p>
                )}
                {briefContact === "crew_mobile" &&
                  briefCrew.map((c) => (
                    <p key={`${c.role}-${c.name}`}>
                      {c.role === "CMDR" ? "Captain" : c.role === "F/O" ? "First officer" : "Cabin"}: {c.name}
                      {c.phone ? <strong className="font-mono text-slate-900"> · {c.phone}</strong> : null}
                    </p>
                  ))}
                <p>
                  Charter Representative: {repName} ({repPhone})
                </p>
                <p className="text-[11px] text-slate-500 font-mono pt-1">
                  Email: {company.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DocumentFooter
          leftText={`${briefId} · ${client?.fullName || "Private Charter"}${briefLegLabel ? ` · ${briefLegLabel}` : ""}`}
          currentPage={1}
          totalPages={1}
        />
      </div>
    </div>
  );
}
