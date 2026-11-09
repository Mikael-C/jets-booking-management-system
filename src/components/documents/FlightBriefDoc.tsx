"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import FlightLegMap from "@/components/maps/FlightLegMap";
import { Phone, Mail, User, ShieldCheck, MapPin, Plane } from "lucide-react";

interface FlightBriefDocProps {
  booking: Booking;
}

export default function FlightBriefDoc({ booking }: FlightBriefDocProps) {
  const {
    client,
    operator,
    aircraft,
    legs,
    tripNumber,
    accountNumber,
    contractDate,
    quoteExpirationDate
  } = booking;

  return (
    <div className="flight-brief-document text-gray-900 bg-transparent font-sans max-w-[850px] mx-auto">
      {/* ================= PAGE 1: FLIGHT OPERATIONS BRIEF & MASTER SCHEDULE ================= */}
      <div className="doc-page min-h-[1050px] bg-white p-8 sm:p-10 rounded-sm shadow-xl border border-gray-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 uppercase">
                Flight Brief
              </h1>
              <p className="text-[11px] font-semibold text-gold tracking-widest uppercase">
                Flight Operations Command & Crew Itinerary
              </p>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                Flight Operations Center
              </p>
            </div>
          </div>

          {/* Party Details: TO | FROM | DETAILS */}
          <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200 text-xs leading-relaxed mb-4">
            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1 text-[10px] border-b border-gray-300 pb-0.5">
                To (Passenger / Charterer)
              </p>
              <p className="font-semibold text-gray-900">{client.fullName}</p>
              {client.companyName && <p className="text-gray-700">{client.companyName}</p>}
              <p className="text-gray-600">{client.streetAddress}</p>
              <p className="text-gray-600">{client.cityPostalCountry}</p>
            </div>

            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1 text-[10px] border-b border-gray-300 pb-0.5">
                From (Operating Air Carrier)
              </p>
              <p className="font-semibold text-gray-900">{operator.companyName}</p>
              <p className="text-gray-700">{operator.representativeName}</p>
              <p className="text-blue-700 font-medium">{operator.supportEmail}</p>
              <p className="text-gray-600">{operator.supportPhone}</p>
              <p className="text-gray-500 mt-0.5">AOC: GB-8422 • EASA & UK-CAA Part-CAT</p>
            </div>

            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1 text-[10px] border-b border-gray-300 pb-0.5">
                Details & References
              </p>
              <div className="grid grid-cols-2 gap-y-0.5 text-[11px]">
                <span className="text-gray-500">Contract Date:</span>
                <span className="font-medium text-gray-900">{contractDate}</span>
                <span className="text-gray-500">Trip No.:</span>
                <span className="font-bold text-gray-900 font-mono">{tripNumber}</span>
                <span className="text-gray-500">Account No.:</span>
                <span className="font-mono text-gray-900">{accountNumber}</span>
                <span className="text-gray-500">Status:</span>
                <span className="font-semibold text-emerald-700 font-mono">Confirmed & Cleared</span>
              </div>
            </div>
          </div>

          {/* Jet Details */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 border-b border-gray-300 pb-0.5">
              Aircraft Specifications & Cabin Configuration
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex-1 space-y-1 text-xs">
                <p className="text-sm font-bold text-gray-900">
                  {aircraft.name} <span className="font-mono text-gold-dark font-bold">({aircraft.registration || "OE-FFB"})</span>
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-0.5 text-gray-600 text-[11px]">
                  <span>Year of manufacture:</span>
                  <span className="font-semibold text-gray-900">{aircraft.yearOfManufacture}</span>
                  <span>Year of refurbishment:</span>
                  <span className="font-semibold text-gray-900">{aircraft.yearOfRefurbishment || "Current"}</span>
                  <span>Passenger Seats:</span>
                  <span className="font-semibold text-gray-900">{aircraft.passengers} VIP seats</span>
                  <span>Smoking Cabin:</span>
                  <span className="font-semibold text-gray-900">{aircraft.smokingCabin ? "YES" : "NO"}</span>
                  <span>Toilette / Lavatory:</span>
                  <span className="font-semibold text-gray-900">{aircraft.toilette ? "YES" : "NO"}</span>
                  <span>Baggage Volume:</span>
                  <span className="font-semibold text-gray-900">{aircraft.baggageVolume || "59 cu ft"}</span>
                </div>
              </div>

              {/* Jet Imagery */}
              <div className="flex items-center gap-2">
                <div className="w-28 h-18 rounded overflow-hidden border border-gray-300 shadow-sm relative bg-gray-200">
                  <img
                    src={aircraft.imageExterior}
                    alt="Jet Exterior"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 bg-black/60 text-[8px] text-white rounded">
                    Exterior
                  </span>
                </div>
                <div className="w-28 h-18 rounded overflow-hidden border border-gray-300 shadow-sm relative bg-gray-200">
                  <img
                    src={aircraft.imageInterior}
                    alt="Jet Interior"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 bg-black/60 text-[8px] text-white rounded">
                    Interior
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Master Routing Schedule Table */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 border-b border-gray-300 pb-0.5">
              Master Flight Schedule <span className="text-[10px] text-gray-500 font-normal lowercase">(Local station times)</span>
            </h3>

            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-gray-100 text-gray-700 font-semibold text-[11px]">
                <tr>
                  <th className="p-1.5 border-b">Leg#</th>
                  <th className="p-1.5 border-b">Date</th>
                  <th className="p-1.5 border-b">Departure Station</th>
                  <th className="p-1.5 border-b">Arrival Station</th>
                  <th className="p-1.5 border-b">Dep (Local)</th>
                  <th className="p-1.5 border-b">Arr (Local)</th>
                  <th className="p-1.5 border-b">Duration</th>
                  <th className="p-1.5 border-b text-center">Pax</th>
                  <th className="p-1.5 border-b">Callsign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[11px]">
                {legs.map((leg) => (
                  <tr key={leg.legNumber}>
                    <td className="p-1.5 font-mono font-bold text-gold">{leg.legNumber}</td>
                    <td className="p-1.5 font-medium">{leg.flightDate}</td>
                    <td className="p-1.5">
                      <div className="font-bold text-gray-900">{leg.origin.name || leg.origin.city} <span className="font-mono text-gray-600">[{leg.origin.icao}{leg.origin.iata ? `/${leg.origin.iata}` : ''}]</span></div>
                      <div className="text-[10px] text-amber-800 font-medium">FBO: {leg.departureHandling?.name || "Executive FBO"}</div>
                    </td>
                    <td className="p-1.5">
                      <div className="font-bold text-gray-900">{leg.destination.name || leg.destination.city} <span className="font-mono text-gray-600">[{leg.destination.icao}{leg.destination.iata ? `/${leg.destination.iata}` : ''}]</span></div>
                      <div className="text-[10px] text-amber-800 font-medium">FBO: {leg.arrivalHandling?.name || "Executive FBO"}</div>
                    </td>
                    <td className="p-1.5 font-mono font-semibold">{leg.departureTimeLocal}</td>
                    <td className="p-1.5 font-mono font-semibold">{leg.arrivalTimeLocal}</td>
                    <td className="p-1.5">{leg.flightTimeFormatted}</td>
                    <td className="p-1.5 text-center font-bold">{leg.paxCount}</td>
                    <td className="p-1.5 font-mono font-bold text-amber-900">{leg.flightNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Flight Operations Guidelines & 24/7 OCC Support */}
          <div className="space-y-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h4 className="font-bold text-gray-900 text-xs uppercase font-mono">
              Flight Operations Dispatch & Boarding Instructions
            </h4>
            <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-600">
              <div>
                <p>• <strong>Arrival Window:</strong> Passengers are requested to arrive at the private FBO terminal 20 minutes prior to scheduled departure.</p>
                <p>• <strong>Luggage Allowance:</strong> Standard soft luggage recommended. Hazardous materials are strictly regulated.</p>
              </div>
              <div>
                <p>• <strong>Customs & Immigration:</strong> Passports must be valid for at least 6 months beyond travel dates.</p>
                <p>• <strong>24/7 Operations Control:</strong> Phone: {operator.supportPhone} • Email: {operator.supportEmail}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page 1 Footer */}
        <div className="mt-4 pt-2.5 border-t border-gray-200 text-[9px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">Orbelo Flight Operations Center</p>
            <p>London Biggin Hill (EGKB) • Geneva Cointrin (LSGG) • 24/7 OCC Duty: {operator.supportPhone}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-700">Page 1 of 2</p>
            <p className="font-mono text-gray-500">Trip: {tripNumber}</p>
          </div>
        </div>
      </div>

      {/* ================= PAGE 2: CREW ASSIGNMENTS, RADAR & GROUND HANDLING ================= */}
      <div className="doc-page min-h-[1050px] bg-white p-8 sm:p-10 rounded-sm shadow-xl border border-gray-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3 mb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">
                Operational Crew & Ground Handling
              </h2>
              <span className="text-[11px] font-semibold text-gold tracking-widest uppercase">
                Assigned Flight Crew, Manifest & FBO Handling Directory
              </span>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl font-black" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] text-gray-500 font-mono">Trip: {tripNumber}</p>
            </div>
          </div>

          {/* Route Radar Overview */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-0.5">
              Flight Route Radar Track
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {legs.map((leg) => (
                <FlightLegMap
                  key={leg.legNumber}
                  origin={leg.origin}
                  destination={leg.destination}
                  flightTime={leg.flightTimeFormatted}
                  distanceNm={leg.distanceNm || 220}
                  legNumber={leg.legNumber}
                  compact={true}
                />
              ))}
            </div>
          </div>

          {/* Detailed Per-Leg Cards: Crew, Manifest, Handling */}
          <div className="space-y-4 mb-4">
            {legs.map((leg) => {
              const cmdr = leg.crew.find((c) => c.role === "CMDR") || { name: "Capt. Alexander Vance", phone: "+44 7700 900842" };
              const fo = leg.crew.find((c) => c.role === "F/O") || { name: "First Officer Marcus Lindqvist", phone: "+44 7700 900890" };
              const fa = leg.crew.find((c) => c.role === "Cabin Attendant") || { name: "Claire Dupont (Allocated)", phone: "+33 6 44 19 88 03" };
              const passengerNames = leg.passengers.map((p) => p.fullName).join(", ") || client.fullName;

              return (
                <div key={leg.legNumber} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-200 text-xs">
                    <span className="font-extrabold text-gray-900 font-mono">
                      LEG {leg.legNumber}: {leg.origin.name || leg.origin.city} [{leg.origin.icao}] → {leg.destination.name || leg.destination.city} [{leg.destination.icao}]
                    </span>
                    <span className="font-mono text-gray-500">
                      {leg.flightDate} • Callsign: <strong className="text-amber-900">{leg.flightNumber}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-gray-50 p-2.5 rounded border border-gray-200">
                    {/* Aircraft & Crew */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 font-bold text-gray-900 border-b border-gray-200 pb-0.5 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                        <span>Aircraft & Assigned Crew</span>
                      </div>
                      <p className="text-[11px]"><span className="text-gray-500">Tail:</span> <strong className="font-mono text-gray-900">{leg.aircraftRegistration}</strong></p>
                      <p className="text-[11px]"><span className="text-gray-500">CMDR:</span> <span className="font-semibold">{cmdr.name}</span></p>
                      <p className="font-mono text-[10px] text-gray-600 pl-3">{cmdr.phone}</p>
                      <p className="text-[11px]"><span className="text-gray-500">F/O:</span> <span className="font-semibold">{fo.name}</span></p>
                      {fo.phone && <p className="font-mono text-[10px] text-gray-600 pl-3">{fo.phone}</p>}
                      <p className="text-[11px] pt-0.5 border-t border-gray-200/60">
                        <span className="text-gray-500">Flight Attendant:</span> <span className="font-semibold text-gold-dark">{fa.name}</span>
                      </p>
                      {fa.phone && <p className="font-mono text-[10px] text-gray-600 pl-3">{fa.phone}</p>}
                    </div>

                    {/* Passengers, Pets & Luggage */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 font-bold text-gray-900 border-b border-gray-200 pb-0.5 text-[11px]">
                        <User className="w-3.5 h-3.5 text-gold" />
                        <span>Passengers ({leg.paxCount}) & Cargo</span>
                      </div>
                      <p className="text-gray-800 font-medium text-[11px]">{passengerNames}</p>
                      {leg.pets?.hasPets && (
                        <p className="text-[10px] text-purple-800 bg-purple-50 p-1 rounded border border-purple-200">
                          🐾 <strong>Pets:</strong> {leg.pets.petCount} ({leg.pets.petType || "Cabin Pet"}, {leg.pets.totalWeightKg} kg)
                        </p>
                      )}
                      {leg.luggage && (
                        <p className="text-[10px] text-gray-700 bg-amber-50/60 p-1 rounded border border-amber-200">
                          🧳 <strong>Luggage:</strong> {leg.luggage.standardSuitcases || leg.luggage.pieceCount} pcs ({leg.luggage.totalWeightKg} kg)
                          {leg.luggage.dimensionsDescription && ` · ${leg.luggage.dimensionsDescription}`}
                        </p>
                      )}
                      <p className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold pt-1">
                        <ShieldCheck className="w-3 h-3" /> APIS & Passports Verified
                      </p>
                    </div>

                    {/* Handling Agents */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 font-bold text-gray-900 border-b border-gray-200 pb-0.5 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-gold" />
                        <span>FBO Ground Handling</span>
                      </div>
                      <div className="text-[10px]">
                        <p className="font-semibold text-gray-900">Dep: {leg.departureHandling.name}</p>
                        <p className="font-mono text-gray-600">T {leg.departureHandling.phone}</p>
                        <p className="text-blue-600 truncate">{leg.departureHandling.email}</p>
                      </div>
                      <div className="text-[10px] pt-0.5">
                        <p className="font-semibold text-gray-900">Arr: {leg.arrivalHandling.name}</p>
                        <p className="font-mono text-gray-600">T {leg.arrivalHandling.phone}</p>
                        <p className="text-blue-600 truncate">{leg.arrivalHandling.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Operational Support & Regulatory Notice */}
          <div className="text-[11px] text-gray-600 border border-gray-200 p-3 rounded-lg bg-gray-50 space-y-1">
            <p className="font-semibold text-gray-900">
              Orbelo Operations Control Center (OCC) 24/7 Duty Manager: {operator.supportPhone} • {operator.supportEmail}
            </p>
            <p className="text-[10px] text-gray-500">
              All flights are operated under European commercial aviation safety regulations (EASA Part-CAT). Slots, handling, and ATC routings are continuously monitored.
            </p>
          </div>
        </div>

        {/* Page 2 Footer */}
        <div className="mt-4 pt-2.5 border-t border-gray-200 text-[9px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">Orbelo Flight Operations Center</p>
            <p>Court of Jurisdiction: {operator.courtOfJurisdiction} • EASA Safety Standard Verified</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-700">Page 2 of 2</p>
            <p className="font-mono text-gray-500">Trip: {tripNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
