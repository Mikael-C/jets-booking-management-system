"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import FlightLegMap from "@/components/maps/FlightLegMap";
import { Phone, Mail, User, ShieldCheck, MapPin } from "lucide-react";

interface FlightBriefDocProps {
  booking: Booking;
}

export default function FlightBriefDoc({ booking }: FlightBriefDocProps) {
  const { client, operator, aircraft, legs, tripNumber, accountNumber, contractDate, quoteExpirationDate } = booking;

  return (
    <div className="flight-brief-document text-gray-900 bg-white font-sans max-w-[850px] mx-auto p-8 sm:p-12 shadow-2xl rounded-sm">
      <div className="min-h-[1050px] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 uppercase">Flight Brief</h1>
              <p className="text-xs font-semibold text-gold tracking-widest uppercase">Flight Operations & Crew Itinerary</p>
            </div>
            <div className="text-right">
              <span className="font-display text-3xl font-black tracking-tight" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Flight Operations Center</p>
            </div>
          </div>

          {/* Party Details: TO | FROM | DETAILS */}
          <div className="grid grid-cols-3 gap-6 py-4 border-b border-gray-200 text-xs leading-relaxed mb-6">
            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 text-[11px] border-b border-gray-300 pb-0.5">To</p>
              <p className="font-semibold text-gray-900">{client.fullName}</p>
              {client.companyName && <p className="text-gray-700">{client.companyName}</p>}
              <p className="text-gray-600">{client.streetAddress}</p>
              <p className="text-gray-600">{client.cityPostalCountry}</p>
            </div>

            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 text-[11px] border-b border-gray-300 pb-0.5">From</p>
              <p className="font-semibold text-gray-900">{operator.companyName}</p>
              <p className="text-gray-700">{operator.representativeName}</p>
              <p className="text-blue-700 font-medium">{operator.supportEmail}</p>
              <p className="text-gray-600">{operator.supportPhone}</p>
              <p className="text-gray-500 mt-1">VAT no. {operator.vatNumber}</p>
            </div>

            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 text-[11px] border-b border-gray-300 pb-0.5">Details</p>
              <div className="grid grid-cols-2 gap-y-1">
                <span className="text-gray-500">Contract Date:</span>
                <span className="font-medium text-gray-900">{contractDate}</span>
                <span className="text-gray-500">Trip no.:</span>
                <span className="font-bold text-gray-900 font-mono">{tripNumber}</span>
                <span className="text-gray-500">Account no.:</span>
                <span className="font-mono text-gray-900">{accountNumber}</span>
                <span className="text-gray-500">Quote Expiration:</span>
                <span className="font-semibold text-gray-900 font-mono text-[11px]">{quoteExpirationDate}</span>
              </div>
            </div>
          </div>

          {/* Jet Details */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Jet Details
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex-1 space-y-1 text-xs">
                <p className="text-base font-bold text-gray-900">{aircraft.name}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-gray-600">
                  <span>Year of manufacture:</span>
                  <span className="font-semibold text-gray-900">{aircraft.yearOfManufacture}</span>
                  <span>Year of refurbishment:</span>
                  <span className="font-semibold text-gray-900">{aircraft.yearOfRefurbishment || "Current"}</span>
                  <span>Passenger Seats:</span>
                  <span className="font-semibold text-gray-900">{aircraft.passengers}</span>
                  <span>Smoking Cabin:</span>
                  <span className="font-semibold text-gray-900">{aircraft.smokingCabin ? "YES" : "NO"}</span>
                  <span>Toilette / Lavatory:</span>
                  <span className="font-semibold text-gray-900">{aircraft.toilette ? "YES" : "NO"}</span>
                  <span>Baggage Volume:</span>
                  <span className="font-semibold text-gray-900">{aircraft.baggageVolume || "59 cu ft"}</span>
                </div>
              </div>

              {/* Jet Imagery */}
              <div className="flex items-center gap-3">
                <div className="w-32 h-20 rounded-md overflow-hidden border border-gray-300 shadow-sm relative bg-gray-200">
                  <img src={aircraft.imageExterior} alt="Jet Exterior" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 text-[9px] text-white rounded">Exterior</span>
                </div>
                <div className="w-32 h-20 rounded-md overflow-hidden border border-gray-300 shadow-sm relative bg-gray-200">
                  <img src={aircraft.imageInterior} alt="Jet Interior" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 text-[9px] text-white rounded">Interior</span>
                </div>
              </div>
            </div>
          </div>

          {/* Routing Legs Table & Full Details */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Routing <span className="text-[10px] text-gray-500 font-normal lowercase">(Please note that all times are local times)</span>
            </h3>

            <div className="space-y-6">
              {legs.map((leg) => {
                const cmdr = leg.crew.find((c) => c.role === "CMDR") || { name: "Capt. Alistair Vance", phone: "+44 7700 900481" };
                const fo = leg.crew.find((c) => c.role === "F/O") || { name: "First Officer Sterling", phone: "+44 7700 900512" };
                const passengerNames = leg.passengers.map((p) => p.fullName).join(", ");

                return (
                  <div key={leg.legNumber} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm space-y-4">
                    {/* Top Itinerary Bar */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center border-b border-gray-200 pb-3">
                      <div className="lg:col-span-7">
                        <table className="w-full text-left text-xs">
                          <thead className="text-gray-500 font-semibold border-b border-gray-100">
                            <tr>
                              <th className="pb-1">Leg #</th>
                              <th className="pb-1">Date</th>
                              <th className="pb-1">From</th>
                              <th className="pb-1">To</th>
                              <th className="pb-1">Departure</th>
                              <th className="pb-1">Arrival</th>
                              <th className="pb-1">Flight time</th>
                              <th className="pb-1 text-center">Pax</th>
                              <th className="pb-1">Flight #</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="font-medium text-gray-900">
                              <td className="pt-2 font-bold text-gold font-mono">{leg.legNumber}</td>
                              <td className="pt-2 text-gray-600">{leg.flightDate}</td>
                              <td className="pt-2 font-bold">{leg.origin.city} ({leg.origin.icao})</td>
                              <td className="pt-2 font-bold">{leg.destination.city} ({leg.destination.icao})</td>
                              <td className="pt-2 font-mono font-semibold">{leg.departureTimeLocal}</td>
                              <td className="pt-2 font-mono font-semibold">{leg.arrivalTimeLocal}</td>
                              <td className="pt-2">{leg.flightTimeFormatted}</td>
                              <td className="pt-2 text-center font-bold">{leg.paxCount}</td>
                              <td className="pt-2 font-mono font-bold text-gray-700">{leg.flightNumber}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="lg:col-span-5">
                        <FlightLegMap
                          origin={leg.origin}
                          destination={leg.destination}
                          flightTime={leg.flightTimeFormatted}
                          distanceNm={leg.distanceNm || 220}
                          legNumber={leg.legNumber}
                          compact={true}
                        />
                      </div>
                    </div>

                    {/* Operational Crew & Manifest Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-gray-50 p-3 rounded-md border border-gray-200">
                      {/* Aircraft Registration & Crew */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900 border-b border-gray-200 pb-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                          <span>Aircraft & Crew</span>
                        </div>
                        <p><span className="text-gray-500">Registration:</span> <strong className="font-mono text-gray-900">{leg.aircraftRegistration}</strong></p>
                        <p><span className="text-gray-500">CMDR:</span> <span className="font-semibold">{cmdr.name}</span></p>
                        <p className="font-mono text-[11px] text-gray-600 pl-4">{cmdr.phone}</p>
                        <p><span className="text-gray-500">F/O:</span> <span className="font-semibold">{fo.name}</span></p>
                        {fo.phone && <p className="font-mono text-[11px] text-gray-600 pl-4">{fo.phone}</p>}
                      </div>

                      {/* Passengers */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900 border-b border-gray-200 pb-1">
                          <User className="w-3.5 h-3.5 text-gold" />
                          <span>Passengers ({leg.paxCount})</span>
                        </div>
                        <p className="text-gray-800 leading-relaxed font-medium">{passengerNames}</p>
                        <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                          <ShieldCheck className="w-3 h-3" /> APIS & Passports Verified
                        </p>
                      </div>

                      {/* Handling Agents */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900 border-b border-gray-200 pb-1">
                          <MapPin className="w-3.5 h-3.5 text-gold" />
                          <span>FBO Handling</span>
                        </div>
                        <div className="text-[11px]">
                          <p className="font-semibold text-gray-900">Departure: {leg.departureHandling.name} ({leg.origin.icao})</p>
                          <p className="font-mono text-gray-600">T {leg.departureHandling.phone}</p>
                          <p className="text-blue-600 truncate">{leg.departureHandling.email}</p>
                        </div>
                        <div className="text-[11px] pt-1">
                          <p className="font-semibold text-gray-900">Arrival: {leg.arrivalHandling.name} ({leg.destination.icao})</p>
                          <p className="font-mono text-gray-600">T {leg.arrivalHandling.phone}</p>
                          <p className="text-blue-600 truncate">{leg.arrivalHandling.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Support Notes */}
          <div className="text-xs text-gray-600 border border-gray-200 p-4 rounded-lg bg-gray-50 space-y-1 mb-6">
            <p className="font-semibold text-gray-900">
              Please do not hesitate to contact the Orbelo Customer Care team 24/7 by phone {operator.supportPhone} or email {operator.supportEmail} at any time should you have further questions.
            </p>
            <p className="text-[11px] text-gray-500">
              Orbelo General Terms & Conditions apply. European Business Aviation Safety Standards compliant.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">{operator.companyName}</p>
            <p>Flughafenstraße 3 / Objekt 10 • 4063 Hörsching • Austria</p>
            <p>Phone: {operator.supportPhone} • {operator.supportEmail}</p>
            <p>Bank details: {operator.bankName} • IBAN: {operator.iban} • BIC: {operator.bic}</p>
            <p>{operator.commercialRegistry} • {operator.courtOfJurisdiction} • VAT no: {operator.vatNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">Flight Brief</p>
            <p className="font-mono text-gray-600">Trip: {tripNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
