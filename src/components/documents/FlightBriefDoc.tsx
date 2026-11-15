"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import DocumentHeader from "./DocumentHeader";
import DocumentFooter from "./DocumentFooter";

interface FlightBriefDocProps {
  booking: Booking;
}

export default function FlightBriefDoc({ booking }: FlightBriefDocProps) {
  const {
    client,
    aircraft,
    legs,
    tripNumber,
    contractDate,
    services
  } = booking;

  const tripRef = tripNumber || "FE4578";
  const briefId = `FB-${tripRef}-005`;
  const firstLeg = legs && legs.length > 0 ? legs[0] : null;

  const originIcao = firstLeg?.origin?.icao || "LEIB";
  const destIcao = firstLeg?.destination?.icao || "LSGG";
  const originCity = firstLeg?.origin?.city || "Ibiza";
  const destCity = firstLeg?.destination?.city || "Geneva";
  const originName = firstLeg?.origin?.name || "Ibiza Airport";
  const destName = firstLeg?.destination?.name || "Geneva Airport";

  const departureTime = firstLeg?.departureTimeLocal || "10:00";
  const arrivalTime = firstLeg?.arrivalTimeLocal || "12:05";
  const flightDate = firstLeg?.flightDate || "Fri 20 Nov 2026";
  const blockTime = firstLeg?.flightTimeFormatted || "2 h 05";

  const aircraftName = aircraft?.name || "CJ3+";
  const aircraftReg = aircraft?.registration || "[XX-XXX]";

  const repName = booking.agentName || "Marcus Vance";
  const repPhone = "+44 20 7946 0912";

  // Manifest items or defaults
  const manifestItems = firstLeg?.passengers && firstLeg.passengers.length > 0
    ? firstLeg.passengers
    : [
        { fullName: `${client?.fullName || "Mr Tunde Adeyemi"} (lead)`, travelDoc: "Passport · Nigeria", note: "" },
        { fullName: "Mrs Ada Adeyemi", travelDoc: "Passport · Nigeria", note: "" },
        { fullName: "Miss Kemi Adeyemi", travelDoc: "Passport · Nigeria", note: "" },
        { fullName: "Mr Bayo Adeyemi", travelDoc: "Passport · Nigeria", note: "" },
        { fullName: "Toby (dog, 3 kg)", travelDoc: "Pet passport", note: "In cabin" },
      ];

  const cateringText = services?.vipCateringDetails || "VIP menu 2, light lunch, 1 vegetarian";
  const luggageText = firstLeg?.luggage
    ? `${firstLeg.luggage.standardSuitcases || 4} suitcases, ${firstLeg.luggage.pieceCount || 2} soft bags`
    : "4 suitcases, 2 soft bags";

  return (
    <div className="flight-brief-document text-slate-900 bg-transparent font-sans max-w-[820px] mx-auto select-none print:max-w-none">
      {/* ================= PAGE 1: FLIGHT BRIEF ================= */}
      <div className="doc-page min-h-[1123px] bg-white p-10 sm:p-12 rounded-sm shadow-xl border border-slate-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between box-border">
        <div className="space-y-6">
          <DocumentHeader booking={booking} />

          {/* Title & Brief Meta */}
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Flight brief
            </h1>
            <div className="text-right text-xs space-y-1">
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">BRIEF</span>
                <span className="font-semibold text-slate-900 font-mono w-36 text-right">{briefId}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">TRIP</span>
                <span className="font-semibold text-slate-900 font-mono w-36 text-right">{tripRef}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">ISSUED</span>
                <span className="font-medium text-slate-900 w-36 text-right">{contractDate || "18 Nov 2026"}, 10:00</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">STATUS</span>
                <span className="font-medium text-slate-900 w-36 text-right">Confirmed</span>
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
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                {originIcao} {departureTime}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {flightDate} · local time
              </p>
              <p className="text-xs text-slate-800 font-medium">
                {originName}
              </p>
            </div>

            {/* Arrival */}
            <div className="border border-slate-200 rounded-lg p-4 bg-white">
              <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mb-1">
                ARRIVAL
              </p>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                {destIcao} {arrivalTime}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {flightDate} · local time
              </p>
              <p className="text-xs text-slate-800 font-medium">
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
              <p className="text-xs text-slate-600 mt-1">
                Registration <span className="bg-[#FEF3C7] text-[#92400E] px-1 py-0.5 rounded text-[11px] font-normal">{aircraftReg.startsWith("[") ? aircraftReg : `[${aircraftReg}]`}</span>
              </p>
              <p className="text-xs text-slate-800">
                Flight time ≈ {blockTime}
              </p>
            </div>
          </div>

          {/* Where to Go & On Arrival */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-1">
            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                WHERE TO GO · {originCity.toUpperCase()}
              </p>
              <p className="font-semibold text-slate-900 text-sm">
                {firstLeg?.departureHandling?.name || "Ibiza Executive Terminal (FBO)"}
              </p>
              <div className="mt-1">
                <span className="bg-[#FEF3C7] text-[#92400E] px-1 py-0.5 rounded text-[11px] font-normal">
                  {firstLeg?.departureHandling?.address || "[FBO address]"}
                </span>
              </div>
              <div className="mt-1">
                <span className="bg-[#FEF3C7] text-[#92400E] px-1 py-0.5 rounded text-[11px] font-normal">
                  {firstLeg?.departureHandling?.phone || "[FBO phone]"}
                </span>
              </div>
              <p className="text-slate-700 mt-2">
                Please arrive <strong>30 minutes</strong> before departure with passports.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                ON ARRIVAL · {destCity.toUpperCase()}
              </p>
              <p className="font-semibold text-slate-900 text-sm">
                {firstLeg?.arrivalHandling?.name || "Jet Aviation Geneva (FBO)"}
              </p>
              <div className="mt-1">
                <span className="bg-[#FEF3C7] text-[#92400E] px-1 py-0.5 rounded text-[11px] font-normal">
                  {firstLeg?.arrivalHandling?.address || "[FBO address]"}
                </span>
              </div>
              <div className="mt-1">
                <span className="bg-[#FEF3C7] text-[#92400E] px-1 py-0.5 rounded text-[11px] font-normal">
                  {firstLeg?.arrivalHandling?.phone || "[FBO phone]"}
                </span>
              </div>
              <p className="text-slate-700 mt-2">
                Chauffeur meets you at the aircraft: Mercedes S-Class, driver with name board, to Hotel des Bergues.
              </p>
            </div>
          </div>

          {/* PASSENGERS */}
          <div className="pt-2">
            <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
              PASSENGERS
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-2 pr-4 font-bold">NAME</th>
                  <th className="py-2 px-4 font-bold">TRAVEL DOCUMENT</th>
                  <th className="py-2 pl-4 font-bold w-28">NOTE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {manifestItems.map((pax: any, i) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{pax.fullName}</td>
                    <td className="py-2.5 px-4 text-slate-700">{pax.travelDoc || `Passport · ${pax.nationality || "Nigeria"}`}</td>
                    <td className="py-2.5 pl-4 text-slate-800">{pax.note || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-500 mt-2">
              Document numbers are not printed on the client's brief. The operator receives the full manifest separately.
            </p>
          </div>

          {/* Bottom Section: ON BOARD & 24/7 CONTACT */}
          <div className="grid grid-cols-2 gap-8 items-start pt-2">
            {/* On Board */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
                ON BOARD
              </h3>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p>
                  <strong className="text-slate-900">Catering:</strong> {cateringText}
                </p>
                <p>
                  <strong className="text-slate-900">Luggage:</strong> {luggageText}
                </p>
                <p>
                  <strong className="text-slate-900">Crew:</strong>{" "}
                  <span className="bg-[#FEF3C7] text-[#92400E] px-1 py-0.5 rounded text-[11px] font-normal">
                    [captain, first officer — from operator]
                  </span>
                </p>
              </div>
            </div>

            {/* 24/7 CONTACT Box */}
            <div className="border border-slate-900 rounded-lg p-3.5 bg-white">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                24/7 CONTACT
              </p>
              <div className="space-y-1 text-xs text-slate-700">
                <p>
                  Orbelo operations:{" "}
                  <span className="bg-[#FEF3C7] text-[#92400E] px-1 py-0.5 rounded text-[11px] font-normal">
                    [+356 24/7 number]
                  </span>
                </p>
                <p>
                  Your representative: {repName}, {repPhone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DocumentFooter
          leftText={`${briefId} · from version -005`}
          currentPage={1}
          totalPages={1}
        />
      </div>
    </div>
  );
}
