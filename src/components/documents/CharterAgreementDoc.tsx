"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import FlightLegMap from "@/components/maps/FlightLegMap";
import { CheckCircle2, Shield } from "lucide-react";

interface CharterAgreementDocProps {
  booking: Booking;
}

export default function CharterAgreementDoc({ booking }: CharterAgreementDocProps) {
  const { client, operator, aircraft, legs, pricing, tripNumber, accountNumber, contractDate, paymentDueDate } = booking;

  return (
    <div className="charter-agreement-document text-gray-900 bg-white font-sans max-w-[850px] mx-auto p-8 sm:p-12 shadow-2xl rounded-sm">
      <div className="min-h-[1050px] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 uppercase">Aircraft Charter Agreement</h1>
              <p className="text-xs font-semibold text-gold tracking-widest uppercase">Legally Binding Air Carriage Contract</p>
            </div>
            <div className="text-right">
              <span className="font-display text-3xl font-black tracking-tight" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Aviation Operations & Legal</p>
            </div>
          </div>

          {/* Reference Banner */}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs mb-6 font-mono">
            <div>Contract Ref: <strong className="text-gray-900">CA-{tripNumber}</strong></div>
            <div>Account Ref: <strong className="text-gray-900">{accountNumber}</strong></div>
            <div>Date of Execution: <strong className="text-gray-900">{contractDate}</strong></div>
          </div>

          {/* Contracting Parties */}
          <div className="grid grid-cols-2 gap-6 p-4 border border-gray-200 rounded-lg text-xs mb-6 bg-white">
            <div>
              <h4 className="font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
                The Carrier / Operator
              </h4>
              <p className="font-semibold text-gray-900">{operator.legalEntity}</p>
              <p className="text-gray-600">Flughafenstraße 3 / Objekt 10, 4063 Hörsching, Austria</p>
              <p className="text-gray-600">Company Registry: {operator.commercialRegistry}</p>
              <p className="text-gray-600">Tax Registration: {operator.vatNumber}</p>
              <p className="text-gray-600">Contact: {operator.supportEmail} • {operator.supportPhone}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
                The Charterer / Client
              </h4>
              <p className="font-semibold text-gray-900">{client.fullName}</p>
              {client.companyName && <p className="text-gray-700">{client.companyName}</p>}
              <p className="text-gray-600">{client.streetAddress}</p>
              <p className="text-gray-600">{client.cityPostalCountry}</p>
              <p className="text-gray-600">Contact: {client.email} • {client.phone}</p>
            </div>
          </div>

          {/* Aircraft & Route Schedule */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Flight Schedule & Aircraft Assignment
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs flex justify-between items-center">
                <div>
                  <span className="text-gray-500">Designated Aircraft:</span>
                  <p className="font-bold text-gray-900">{aircraft.name} (Tail: {aircraft.registration || "TBD"})</p>
                </div>
                <div>
                  <span className="text-gray-500">Capacity:</span>
                  <p className="font-bold text-gray-900">{aircraft.passengers} Passenger Seats</p>
                </div>
                <div>
                  <span className="text-gray-500">Total Charter Fee:</span>
                  <p className="font-bold text-gold-dark text-sm font-mono">{formatCurrency(pricing.totalFlightPrice, pricing.currency)}</p>
                </div>
              </div>

              {/* Legs Table & Embedded Map */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-7">
                  <table className="w-full text-left text-xs border border-gray-200">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="p-2 border-b">Leg</th>
                        <th className="p-2 border-b">Date</th>
                        <th className="p-2 border-b">Departure</th>
                        <th className="p-2 border-b">Arrival</th>
                        <th className="p-2 border-b">Pax</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {legs.map((leg) => (
                        <tr key={leg.legNumber}>
                          <td className="p-2 font-mono font-bold text-gold">{leg.legNumber}</td>
                          <td className="p-2 text-gray-600">{leg.flightDate}</td>
                          <td className="p-2 font-semibold">{leg.origin.city} ({leg.origin.icao})</td>
                          <td className="p-2 font-semibold">{leg.destination.city} ({leg.destination.icao})</td>
                          <td className="p-2 text-center font-bold">{leg.paxCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="lg:col-span-5">
                  <FlightLegMap
                    origin={legs[0].origin}
                    destination={legs[0].destination}
                    flightTime={legs[0].flightTimeFormatted}
                    distanceNm={legs[0].distanceNm || 220}
                    legNumber={1}
                    compact={true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Key Contractual Articles */}
          <div className="mb-6 space-y-3 text-[11px] text-gray-700 leading-relaxed">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1">
              Terms & Conditions Summary
            </h3>
            
            <div className="space-y-2 border border-gray-200 p-3.5 rounded-lg bg-gray-50">
              <p>
                <strong>1. Operational Control:</strong> The Carrier maintains exclusive operational and technical control over the aircraft at all times. The Commander (Captain) holds absolute authority with respect to safety of passengers, crew, flight route, diversion, and payload.
              </p>
              <p>
                <strong>2. Payment & Settlement:</strong> The total charter fee of {formatCurrency(pricing.totalFlightPrice, pricing.currency)} is due no later than {paymentDueDate}. Flight operations are conditional on full payment clearance in escrow prior to dispatch.
              </p>
              <p>
                <strong>3. Cancellation Charges:</strong> Cancellations made &gt;7 days prior to departure incur a 10% fee (min. €500); between 7 days and 48 hours incur 30%; between 48 hours and 24 hours incur 50%; and under 24 hours incur 75%-100% of the total charter price.
              </p>
              <p>
                <strong>4. Documentation & Border Control:</strong> Charterer is strictly responsible for ensuring all passengers possess valid passports, visas, health declarations, and immigration clearances. APIS data must be finalized 2 hours prior to wheels-up.
              </p>
              <p>
                <strong>5. Governing Law:</strong> This Agreement shall be governed by and construed in accordance with Austrian Law, with the competent court of Linz, Austria exercising exclusive jurisdiction.
              </p>
            </div>
          </div>

          {/* Digital Signature & Acceptance */}
          <div className="border-2 border-gray-900 rounded-lg p-5 bg-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900">Signatures & Legal Acceptance</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Legally Executed via Orbelo Secure Sign
              </span>
            </div>

            <div className="grid grid-cols-2 gap-8 text-xs pt-2">
              {/* Operator Side */}
              <div className="space-y-2">
                <p className="font-bold text-gray-800">For and on behalf of Carrier:</p>
                <div className="h-16 flex flex-col justify-end border-b border-gray-300 pb-1">
                  <span className="font-sans italic text-lg text-gray-900 font-semibold">{operator.representativeName}</span>
                </div>
                <p className="text-[11px] text-gray-500 font-mono">Authorized Officer • {operator.companyName}</p>
                <p className="text-[10px] text-gray-400">Timestamp: {contractDate} 09:14 UTC</p>
              </div>

              {/* Client Side */}
              <div className="space-y-2">
                <p className="font-bold text-gray-800">For and on behalf of Charterer:</p>
                <div className="h-16 flex flex-col justify-end border-b border-gray-300 pb-1">
                  <span className="font-sans italic text-lg text-gray-900 font-semibold">{client.fullName}</span>
                </div>
                <p className="text-[11px] text-gray-500 font-mono">Signatory • {client.companyName || client.fullName}</p>
                <p className="text-[10px] text-gray-400">Timestamp: {contractDate} 10:22 UTC (IP Verified)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">{operator.companyName}</p>
            <p>VAT no: {operator.vatNumber} • {operator.commercialRegistry}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">Charter Agreement</p>
            <p className="font-mono text-gray-600">Ref: CA-{tripNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
