"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import FlightLegMap from "@/components/maps/FlightLegMap";

interface QuotationDocProps {
  booking: Booking;
}

export default function QuotationDoc({ booking }: QuotationDocProps) {
  const {
    client,
    operator,
    aircraft,
    legs,
    pricing,
    services,
    tripNumber,
    accountNumber,
    contractDate,
    quoteExpirationDate
  } = booking;

  return (
    <div className="quotation-document text-gray-900 bg-transparent font-sans max-w-[850px] mx-auto">
      {/* ================= PAGE 1: COMMERCIAL QUOTATION & ITINERARY ================= */}
      <div className="doc-page min-h-[1050px] bg-white p-8 sm:p-10 rounded-sm shadow-xl border border-gray-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 uppercase">
                Quotation
              </h1>
              <span className="text-[11px] font-semibold text-gold tracking-widest uppercase">
                Executive Private Charter Proposal
              </span>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                Private Jet Aviation
              </p>
            </div>
          </div>

          {/* Party Details: TO | FROM | DETAILS */}
          <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200 text-xs leading-relaxed mb-4">
            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1 text-[10px] border-b border-gray-300 pb-0.5">
                To
              </p>
              <p className="font-semibold text-gray-900">{client.fullName}</p>
              {client.companyName && <p className="text-gray-700">{client.companyName}</p>}
              <p className="text-gray-600">{client.streetAddress}</p>
              <p className="text-gray-600">{client.cityPostalCountry}</p>
              {client.vatNumber && <p className="text-gray-500 mt-0.5">Tax ID: {client.vatNumber}</p>}
            </div>

            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1 text-[10px] border-b border-gray-300 pb-0.5">
                From (Brokerage Carrier)
              </p>
              <p className="font-semibold text-gray-900">Orbelo GmbH</p>
              <p className="text-gray-700">Flight Operations Command</p>
              <p className="text-blue-700 font-medium">charter@orbelo.com</p>
              <p className="text-gray-600">+43 732 7720 0</p>
              <p className="text-[10px] text-gray-500 mt-0.5 italic">
                Operating Carrier: Disclosed in confirmed Flight Brief (EC 2111/2005)
              </p>
            </div>

            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1 text-[10px] border-b border-gray-300 pb-0.5">
                Details
              </p>
              <div className="grid grid-cols-2 gap-y-0.5 text-[11px]">
                <span className="text-gray-500">Contract Date:</span>
                <span className="font-medium text-gray-900">{contractDate}</span>
                <span className="text-gray-500">Trip No.:</span>
                <span className="font-bold text-gray-900 font-mono">{tripNumber}</span>
                <span className="text-gray-500">Account No.:</span>
                <span className="font-mono text-gray-900">{accountNumber}</span>
                <span className="text-gray-500">Expiration:</span>
                <span className="font-semibold text-red-600 font-mono">{quoteExpirationDate}</span>
              </div>
            </div>
          </div>

          {/* Jet Details */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 border-b border-gray-300 pb-0.5">
              Jet Details
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex-1 space-y-1 text-xs">
                <p className="text-sm font-bold text-gray-900">{aircraft.name}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-0.5 text-gray-600 text-[11px]">
                  <span>Year of manufacture:</span>
                  <span className="font-semibold text-gray-900">{aircraft.yearOfManufacture}</span>
                  <span>Passenger Seats:</span>
                  <span className="font-semibold text-gray-900">{aircraft.passengers} VIP seats</span>
                  <span>Non-Smoking Cabin:</span>
                  <span className="font-semibold text-gray-900">Yes</span>
                  <span>Enclosed Lavatory:</span>
                  <span className="font-semibold text-gray-900">{aircraft.toilette ? "Yes" : "No"}</span>
                  <span>Cruise Speed:</span>
                  <span className="font-semibold text-gray-900">{aircraft.cruiseSpeed || "410 ktas"}</span>
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

          {/* Routing Table */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 border-b border-gray-300 pb-0.5">
              Routing <span className="text-[10px] text-gray-500 font-normal lowercase">(Local station times)</span>
            </h3>
            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-gray-100 text-gray-700 font-semibold text-[11px]">
                <tr>
                  <th className="p-1.5 border-b">Leg#</th>
                  <th className="p-1.5 border-b">Date</th>
                  <th className="p-1.5 border-b">From → To</th>
                  <th className="p-1.5 border-b">Departure</th>
                  <th className="p-1.5 border-b">Arrival</th>
                  <th className="p-1.5 border-b text-center">Pax</th>
                  <th className="p-1.5 border-b">Callsign</th>
                  <th className="p-1.5 border-b">Aircraft Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {legs.map((leg) => (
                  <tr key={leg.legNumber} className="text-[11px]">
                    <td className="p-1.5 font-mono font-bold text-gold">{leg.legNumber}</td>
                    <td className="p-1.5 font-medium">{leg.flightDate}</td>
                    <td className="p-1.5 font-bold text-gray-900">
                      {leg.origin.city} ({leg.origin.icao}) → {leg.destination.city} ({leg.destination.icao})
                    </td>
                    <td className="p-1.5 font-mono font-semibold">{leg.departureTimeLocal}</td>
                    <td className="p-1.5 font-mono font-semibold">{leg.arrivalTimeLocal}</td>
                    <td className="p-1.5 text-center font-bold">{leg.paxCount}</td>
                    <td className="p-1.5 font-mono font-bold text-gray-700">{leg.flightNumber}</td>
                    <td className="p-1.5 text-gray-700 font-semibold">{aircraft.categoryLabel || "Executive Jet"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Flight Legs Pet & Luggage Summary */}
            {legs.some((l) => l.pets?.hasPets || l.luggage) && (
              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                {legs.map((leg) => (
                  <div key={leg.legNumber} className="space-y-0.5">
                    <span className="font-bold text-gray-800 font-mono">Leg #{leg.legNumber} Cargo & Cabin:</span>
                    {leg.pets?.hasPets && (
                      <p className="text-gray-600">
                        🐾 <strong>Pets:</strong> {leg.pets.petCount} ({leg.pets.petType || "Approved Pet"}, {leg.pets.totalWeightKg} kg)
                      </p>
                    )}
                    {leg.luggage && (
                      <p className="text-gray-600">
                        🧳 <strong>Luggage:</strong> {leg.luggage.standardSuitcases || leg.luggage.pieceCount} pcs ({leg.luggage.totalWeightKg} kg) — {leg.luggage.dimensionsDescription || "Standard Cabin & Hold"}
                        {leg.luggage.specialLuggageDescription && ` · ${leg.luggage.specialLuggageDescription}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Engine Itemization */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 border-b border-gray-300 pb-0.5">
              Pricing Breakdown
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 text-xs">
              <div className="flex justify-between py-0.5 border-b border-gray-200 font-medium">
                <span>Base Flight Price</span>
                <span className="font-mono">{formatCurrency(pricing.flightPrice, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pl-3 text-[11px]">
                <span>- Airport Fees (Landing, Parking, ATC Navigation)</span>
                <span className="font-mono">{formatCurrency(pricing.airportFees, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pl-3 text-[11px]">
                <span>- Passenger Terminal Handling Fees</span>
                <span className="font-mono">{formatCurrency(pricing.passengerFees, pricing.currency)}</span>
              </div>
              {pricing.dayOfWeekDiscount !== 0 && (
                <div className="flex justify-between text-emerald-700 font-medium pl-3 text-[11px]">
                  <span>- Day of week discount</span>
                  <span className="font-mono">{formatCurrency(pricing.dayOfWeekDiscount, pricing.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 pl-3 text-[11px]">
                <span>- Inbound & Outbound Passenger Taxes</span>
                <span className="font-mono">
                  {formatCurrency(pricing.inboundPassengerTax + pricing.outboundPassengerTax, pricing.currency)}
                </span>
              </div>
              {pricing.additionalServicesTotal > 0 && (
                <div className="flex justify-between text-gray-700 pl-3 text-[11px]">
                  <span>- Additional Services & Concierge</span>
                  <span className="font-mono">{formatCurrency(pricing.additionalServicesTotal, pricing.currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-t border-gray-300 font-bold text-xs text-gray-900">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(pricing.subtotal, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[10px]">
                <span>VAT (0%, International commercial aviation VAT exempt under §6, Abs. 1, Zif. 3 Austrian VAT Act)</span>
                <span className="font-mono">{formatCurrency(0, pricing.currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t-2 border-gray-900 font-extrabold text-sm text-gray-900 bg-gold/10 px-2.5 rounded">
                <span className="uppercase tracking-wider">TOTAL CHARTER FLIGHT PRICE</span>
                <span className="font-mono text-gold-dark text-base">
                  {formatCurrency(pricing.totalFlightPrice, pricing.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Conditions & Payment Schedule */}
          <div className="text-[10px] text-gray-600 space-y-1.5 border-t border-gray-200 pt-2.5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-900 uppercase text-[11px]">
                Payment Choices & Remittance Terms [QTE-9]
              </p>
              <span className="font-mono text-[10px] text-gray-500">Ref: #{booking.invoiceNumber}</span>
            </div>

            {/* Payment Choice Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <span className="font-bold text-gray-900 block font-mono">CHOICE 1: BANK WIRE (0% FEE)</span>
                <p>100% Total Due: <strong className="font-mono text-gray-900">{formatCurrency(pricing.totalFlightPrice, pricing.currency)}</strong></p>
                <p className="text-gray-500">SEPA / SWIFT wire transfer with zero processing fee. Due: {booking.paymentDueDate}</p>
              </div>

              <div className="p-2 bg-amber-50/60 rounded border border-amber-300">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-gray-900 font-mono">CHOICE 2: CREDIT / DEBIT CARD</span>
                  <span className="text-[9px] font-mono font-bold bg-amber-200 text-amber-900 px-1 py-0.2 rounded">+3.5% Card Fee</span>
                </div>
                <p className="text-gray-700">Flight: <span className="font-mono">{formatCurrency(pricing.totalFlightPrice, pricing.currency)}</span></p>
                <p className="text-gray-600">Card Fee (3.5%): <span className="font-mono">+{formatCurrency(pricing.totalFlightPrice * 0.035, pricing.currency)}</span></p>
                <p className="font-bold text-[#0F1420] pt-0.5 border-t border-amber-200">Total with Card: <strong className="font-mono text-amber-900">{formatCurrency(pricing.totalFlightPrice * 1.035, pricing.currency)}</strong></p>
              </div>

              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <span className="font-bold text-gray-900 block font-mono">CHOICE 3: DEPOSIT & BALANCE</span>
                <p>Deposit (25%): <strong className="font-mono text-gray-900">{formatCurrency(pricing.totalFlightPrice * 0.25, pricing.currency)}</strong> upon signing</p>
                <p>Balance (75%): <strong className="font-mono text-gray-900">{formatCurrency(pricing.totalFlightPrice * 0.75, pricing.currency)}</strong> due 7 days prior</p>
              </div>
            </div>

            <p className="font-mono bg-gray-100 p-1.5 rounded border border-gray-200 text-gray-800 text-[10px]">
              Wire Remittance: Bank: <strong>{operator.bankName}</strong> • IBAN: <strong>{operator.iban}</strong> • BIC: <strong>{operator.bic}</strong> • Reference: <strong>{booking.invoiceNumber}</strong>
            </p>
          </div>
        </div>

        {/* Page 1 Footer */}
        <div className="mt-4 pt-2.5 border-t border-gray-200 text-[9px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">Orbelo GmbH Aviation Management</p>
            <p>Flughafenstraße 3 / Objekt 10 • 4063 Hörsching • Austria • VAT: ATU 6335 7619</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-700">Page 1 of 3</p>
            <p className="font-mono text-gray-500">{tripNumber}</p>
          </div>
        </div>
      </div>

      {/* ================= PAGE 2: RADAR, FBO HANDLING & TERMS ================= */}
      <div className="doc-page min-h-[1050px] bg-white p-8 sm:p-10 rounded-sm shadow-xl border border-gray-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3 mb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">
                Flight Operations & Carriage Terms
              </h2>
              <span className="text-[11px] font-semibold text-gold tracking-widest uppercase">
                Route Radar, Ground Handling Directory & Policies
              </span>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl font-black" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] text-gray-500 font-mono">Trip: {tripNumber}</p>
            </div>
          </div>

          {/* Visual Flight Radar Map */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-0.5">
              Flight Routing Radar & Navigation Track
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {legs.map((leg) => (
                <div key={leg.legNumber} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-900">
                      Leg {leg.legNumber}: {leg.origin.icao} → {leg.destination.icao}
                    </span>
                    <span className="text-gray-500 font-mono">{leg.flightDate}</span>
                  </div>
                  <FlightLegMap
                    origin={leg.origin}
                    destination={leg.destination}
                    flightTime={leg.flightTimeFormatted}
                    distanceNm={leg.distanceNm || 220}
                    legNumber={leg.legNumber}
                    compact={true}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* FBO Ground Handling Agents Directory */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 border-b border-gray-300 pb-0.5">
              FBO Ground Handling Agents Directory
            </h3>
            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-gray-100 text-gray-700 font-semibold text-[11px]">
                <tr>
                  <th className="p-1.5 border-b">Leg#</th>
                  <th className="p-1.5 border-b">Station</th>
                  <th className="p-1.5 border-b">Handling Agent</th>
                  <th className="p-1.5 border-b">Phone</th>
                  <th className="p-1.5 border-b">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[11px]">
                {legs.map((leg) => (
                  <React.Fragment key={leg.legNumber}>
                    <tr>
                      <td className="p-1.5 font-mono font-bold text-gray-700">{leg.legNumber} (Dep)</td>
                      <td className="p-1.5 font-semibold text-gray-900">{leg.origin.city} ({leg.origin.icao})</td>
                      <td className="p-1.5">{leg.departureHandling.name}</td>
                      <td className="p-1.5 font-mono text-gray-600">{leg.departureHandling.phone}</td>
                      <td className="p-1.5 text-blue-600 truncate max-w-[150px]">{leg.departureHandling.email}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-mono font-bold text-gray-700">{leg.legNumber} (Arr)</td>
                      <td className="p-1.5 font-semibold text-gray-900">{leg.destination.city} ({leg.destination.icao})</td>
                      <td className="p-1.5">{leg.arrivalHandling.name}</td>
                      <td className="p-1.5 font-mono text-gray-600">{leg.arrivalHandling.phone}</td>
                      <td className="p-1.5 text-blue-600 truncate max-w-[150px]">{leg.arrivalHandling.email}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cancellation Policy Schedule */}
          <div className="mb-4">
            <div className="flex items-center justify-between border-b border-gray-300 pb-0.5 mb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Cancellation Policy Schedule
              </h3>
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                Subject to Operator Policy
              </span>
            </div>
            <p className="text-[11px] text-gray-600 mb-2 leading-relaxed">
              In the event of a flight cancellation, fees are assessed in accordance with international charter terms and are subject to operating carrier approval:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs space-y-1.5">
              <div className="flex justify-between items-center py-0.5 border-b border-gray-200 text-[11px]">
                <span className="text-gray-800">• More than 168 hours (7 days) prior to departure:</span>
                <span className="font-bold text-gray-900 font-mono">10% of Charter Price (min. € 500,-)</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-gray-200 text-[11px]">
                <span className="text-gray-800">• Within 168 hours (7 days) but more than 48 hours:</span>
                <span className="font-bold text-gray-900 font-mono">30% of Charter Price</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-gray-200 text-[11px]">
                <span className="text-gray-800">• Within 48 hours but more than 24 hours:</span>
                <span className="font-bold text-gray-900 font-mono">50% of Charter Price</span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-[11px]">
                <span className="text-gray-800">• Within 24 hours of departure or passenger no-show:</span>
                <span className="font-bold text-red-600 font-mono">75% - 100% (Subject to Operator Tariff)</span>
              </div>
            </div>
          </div>

          {/* Last-Minute Trip Cancellation Insurance */}
          <div className="mb-4 bg-gold/5 border border-gold/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Last - Minute Trip Cancellation Insurance (Subject to Operator)
              </h4>
              <span className="font-mono font-bold text-gold-dark text-xs">€ 1 000.- / leg</span>
            </div>
            <p className="text-[11px] text-gray-600 mb-2 leading-relaxed">
              Cancel free of charge up to 24 hours before your confirmed time of departure with zero penalty fees, subject to individual operator terms and acceptance.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-800 bg-white p-2 rounded border border-gray-200">
              <input
                type="checkbox"
                className="rounded text-gold focus:ring-gold"
                checked={!!services.cancellationInsurance}
                readOnly
              />
              <span>Opt-in: Free of charge trip cancellation up to 24h before departure (€ 1 000.- / leg, Subject to Operator)</span>
            </div>
          </div>

          {/* Passenger Passports & APIS Regulations */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 border-b border-gray-300 pb-0.5">
              Passenger Manifest & Border Security
            </h3>
            <div className="text-[11px] text-gray-600 space-y-1 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p>
                <strong>Passports & ID:</strong> Clients must submit all required passenger details, including passport scans for all passengers and pets travelling at least 2 hours prior to departure.
              </p>
              <p>
                <strong>Border Compliance:</strong> For all flights entering or leaving Schengen or UK borders, complete APIS details must be submitted before Eurocontrol flight plan filing.
              </p>
            </div>
          </div>
        </div>

        {/* Page 2 Footer */}
        <div className="mt-4 pt-2.5 border-t border-gray-200 text-[9px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">Orbelo GmbH Aviation Management</p>
            <p>VAT Registrations: {operator.additionalVatNumbers.join(" • ")}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-700">Page 2 of 3</p>
            <p className="font-mono text-gray-500">{tripNumber}</p>
          </div>
        </div>
      </div>

      {/* ================= PAGE 3: ADDITIONAL SERVICES & SIGNATURE ================= */}
      <div className="doc-page min-h-[1050px] bg-white p-8 sm:p-10 rounded-sm shadow-xl border border-gray-200 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3 mb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">
                Additional Services
              </h2>
              <span className="text-[11px] font-semibold text-gold tracking-widest uppercase">
                VIP Concierge & Environmental Options
              </span>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl font-black" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] text-gray-500 font-mono">Trip: {tripNumber}</p>
            </div>
          </div>

          {/* Ground Transfers & Concierge */}
          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 border-b border-gray-300 pb-0.5">
              Ground Transfers & Concierge Services
            </h3>
            <p className="text-xs text-gray-600 mb-2.5">
              A wide selection of sweet and salty premium labeled snacks, fresh fruits, and open executive bar (soft drinks, beer, wine, coffee, tea) is provided complimentary on all flights, including Taittinger Champagne.
            </p>
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="flex items-center gap-2 p-2 border border-gray-200 rounded bg-gray-50">
                <input type="checkbox" checked={services.limousineService} readOnly className="rounded text-gold" />
                <span className="font-medium text-gray-800">VIP Limousine / Chauffeur Service</span>
              </div>
              <div className="flex items-center gap-2 p-2 border border-gray-200 rounded bg-gray-50">
                <input type="checkbox" checked={services.luxuryCarRental} readOnly className="rounded text-gold" />
                <span className="font-medium text-gray-800">Luxury Sports / SUV Rental</span>
              </div>
              <div className="flex items-center gap-2 p-2 border border-gray-200 rounded bg-gray-50">
                <input type="checkbox" checked={services.helicopterService} readOnly className="rounded text-gold" />
                <span className="font-medium text-gray-800">Helicopter Connection Transfer</span>
              </div>
            </div>
            {services.vipCateringDetails && (
              <p className="text-[11px] text-gray-600 italic mt-2 bg-yellow-50 p-2 border border-yellow-200 rounded">
                Concierge Notes: {services.vipCateringDetails}
              </p>
            )}
          </div>

          {/* De-Icing Protection Insurance */}
          <div className="mb-5">
            <div className="flex items-center justify-between border-b border-gray-300 pb-0.5 mb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                De-Icing Protection Figures & Options
              </h3>
              <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-100 border border-sky-300 px-1.5 py-0.2 rounded">
                Figures Subject to Operator
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              De-icing protection figures are subject to operator tariff card, station handling rates, and actual weather conditions at departure station:
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`p-2.5 rounded-lg border ${services.deicingInsurance === "at_reservation" ? "border-gold bg-gold/10" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex justify-between font-bold text-gray-900 mb-0.5">
                  <span>Option 1: Book at Reservation (Subject to Operator)</span>
                  <span className="font-mono text-gold-dark">€ 400 / leg est.</span>
                </div>
                <p className="text-[10px] text-gray-500">De-icing protection rate subject to operator confirmation upon signing this agreement.</p>
              </div>
              <div className={`p-2.5 rounded-lg border ${services.deicingInsurance === "within_48h" ? "border-gold bg-gold/10" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex justify-between font-bold text-gray-900 mb-0.5">
                  <span>Option 2: Book Later (Subject to Operator)</span>
                  <span className="font-mono text-gray-700">€ 800 / leg est.</span>
                </div>
                <p className="text-[10px] text-gray-500">Add coverage up to 48 hours prior to scheduled departure subject to operator terms.</p>
              </div>
            </div>
          </div>

          {/* Carbon Offset Program */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 border-b border-gray-300 pb-0.5">
              Carbon Offset Program
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <input type="radio" checked={services.carbonOffset === "neutral"} readOnly />
                  <span><strong>Fly Neutral:</strong> Compensate 100% of flight carbon emissions</span>
                </div>
                <span className="font-mono text-gray-700">€ 33 / flight hr</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <input type="radio" checked={services.carbonOffset === "positive"} readOnly />
                  <span><strong>Fly Positive:</strong> Donate 50% more than full carbon compensation</span>
                </div>
                <span className="font-mono text-gray-700">€ 50 / flight hr</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <input type="radio" checked={services.carbonOffset === "double_neutral"} readOnly />
                  <span><strong>Fly Double Neutral:</strong> Double the total carbon compensation</span>
                </div>
                <span className="font-mono text-gray-700">€ 66 / flight hr</span>
              </div>
            </div>
          </div>

          {/* Digital Signature Block */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">
              Acceptance of Quotation & Contract Terms
            </p>
            <p className="text-[11px] text-gray-600 mb-6 leading-relaxed">
              By signing below, the Client confirms acceptance of the flights, routing, pricing, cancellation terms, and general conditions outlined in this Quotation.
            </p>
            <div className="grid grid-cols-2 gap-6 text-xs pt-3 border-t border-gray-300">
              <div>
                <p className="font-semibold text-gray-800 mb-6">Client Signature / Corporate Stamp</p>
                <div className="border-b border-gray-400 pb-1 mb-1 font-serif italic text-base text-gray-800">
                  {client.fullName}
                </div>
                <p className="text-[10px] text-gray-500">Authorized Signatory • {client.companyName || client.fullName}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-6">Date & Place</p>
                <div className="border-b border-gray-400 pb-1 mb-1 font-mono text-xs text-gray-800">
                  {contractDate} • Monaco / Geneva
                </div>
                <p className="text-[10px] text-gray-500">Execution Date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page 3 Footer */}
        <div className="mt-4 pt-2.5 border-t border-gray-200 text-[9px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">Orbelo GmbH Aviation Management</p>
            <p>Customer Care: {operator.supportPhone} • {operator.supportEmail}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-700">Page 3 of 3</p>
            <p className="font-mono text-gray-500">{tripNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
