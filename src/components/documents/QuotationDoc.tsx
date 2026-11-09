"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import FlightLegMap from "@/components/maps/FlightLegMap";
import { Plane, Building, Clock, MapPin, ShieldCheck, Sparkles, User, Briefcase, Dog, Calendar } from "lucide-react";

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
    quoteReference,
    accountNumber,
    contractDate,
    quoteExpirationDate
  } = booking;

  const quoteId = quoteReference || tripNumber || `QTE-${booking.id.slice(-6)}`;

  return (
    <div className="quotation-document text-gray-900 bg-transparent font-sans max-w-[850px] mx-auto select-none">
      
      {/* ================= PAGE 1: COMMERCIAL QUOTATION & ITINERARY ================= */}
      <div className="doc-page min-h-[1050px] bg-white p-8 sm:p-10 rounded-sm shadow-xl border border-gray-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between">
        <div>
          {/* Orbelo Luxury Executive Header */}
          <div className="flex items-start justify-between border-b-2 border-[#0B101A] pb-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="h-2 w-2 rounded-full bg-[#C9A052]" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#9A7A35] uppercase">
                  Bespoke Executive Charter Proposal
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B101A] uppercase">
                Charter Quotation
              </h1>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold font-mono">
                Private Jet Aviation
              </p>
            </div>
          </div>

          {/* Party Details: TO | FROM | DETAILS */}
          <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200 text-xs leading-relaxed mb-4">
            <div>
              <p className="font-bold text-[#0B101A] uppercase tracking-wider mb-1 text-[10px] border-b border-gray-300 pb-0.5 flex items-center gap-1">
                <User className="w-3 h-3 text-[#C9A052]" />
                Charterer (Client)
              </p>
              <p className="font-extrabold text-gray-900">{client.fullName}</p>
              {client.companyName && <p className="text-gray-700 font-medium">{client.companyName}</p>}
              <p className="text-gray-600">{client.streetAddress}</p>
              <p className="text-gray-600">{client.cityPostalCountry}</p>
              {client.vatNumber && <p className="text-gray-500 mt-0.5 font-mono text-[10px]">Tax ID: {client.vatNumber}</p>}
            </div>

            <div>
              <p className="font-bold text-[#0B101A] uppercase tracking-wider mb-1 text-[10px] border-b border-gray-300 pb-0.5 flex items-center gap-1">
                <Plane className="w-3 h-3 text-[#C9A052]" />
                Charter Brokerage Carrier
              </p>
              <p className="font-extrabold text-gray-900">Orbelo Aviation Management</p>
              <p className="text-gray-700">Flight Operations Command</p>
              <p className="text-blue-700 font-medium">charter@orbelo.com</p>
              <p className="text-gray-600">+44 20 7946 0880 • +1 800 555 0192</p>
              <p className="text-[10px] text-gray-500 mt-0.5 italic">
                Operating Carrier: Fully certified AOC partner disclosed in flight brief
              </p>
            </div>

            <div>
              <p className="font-bold text-[#0B101A] uppercase tracking-wider mb-1 text-[10px] border-b border-gray-300 pb-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#C9A052]" />
                Proposal Reference
              </p>
              <div className="grid grid-cols-2 gap-y-0.5 text-[11px]">
                <span className="text-gray-500">Proposal Date:</span>
                <span className="font-medium text-gray-900">{contractDate}</span>
                <span className="text-gray-500">Quote Ref:</span>
                <span className="font-bold text-[#9A7A35] font-mono">{quoteId}</span>
                <span className="text-gray-500">Account No.:</span>
                <span className="font-mono text-gray-900">{accountNumber}</span>
                <span className="text-gray-500">Valid Until:</span>
                <span className="font-semibold text-red-600 font-mono">{quoteExpirationDate}</span>
              </div>
            </div>
          </div>

          {/* Jet Details (With Manual Overrides & Aircraft Photos) */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B101A] mb-1.5 border-b border-gray-300 pb-0.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A052]" />
              Dedicated Aircraft Specifications & Cabin Attributes
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex-1 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-[#0B101A]">{aircraft.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
                    {aircraft.categoryLabel || "Executive Jet"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-gray-600 text-[11px]">
                  <span>Year of Make (YOM):</span>
                  <span className="font-semibold text-gray-900">{aircraft.yearOfManufacture || "2020"}</span>
                  <span>Year Refurbished (YOR):</span>
                  <span className="font-semibold text-gray-900">{aircraft.yearOfRefurbishment ? String(aircraft.yearOfRefurbishment) : "Recent Refurbishment"}</span>
                  <span>Passenger Capacity:</span>
                  <span className="font-semibold text-gray-900">{aircraft.passengers} VIP Club Seats</span>
                  <span>Smoking Policy:</span>
                  <span className={`font-semibold ${aircraft.smokingCabin ? "text-amber-800" : "text-gray-900"}`}>
                    {aircraft.smokingCabin ? "Smoking Permitted" : "Strictly Non-Smoking Cabin"}
                  </span>
                  <span>Enclosed Lavatory:</span>
                  <span className="font-semibold text-gray-900">{aircraft.toilette ? "Yes (Full Vanity)" : "No"}</span>
                  <span>Cruise Speed / Range:</span>
                  <span className="font-semibold text-gray-900">{aircraft.cruiseSpeed || "420 ktas"} • {aircraft.rangeLabel || `${aircraft.range || 2100} nm`}</span>
                </div>
              </div>

              {/* Jet Imagery */}
              <div className="flex items-center gap-2">
                <div className="w-32 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm relative bg-gray-100 flex-shrink-0">
                  <img
                    src={aircraft.imageExterior || "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80"}
                    alt="Aircraft Exterior"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-[8px] font-mono text-white rounded">
                    Exterior
                  </span>
                </div>
                <div className="w-32 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm relative bg-gray-100 flex-shrink-0">
                  <img
                    src={aircraft.imageInterior || "https://images.unsplash.com/photo-1519074069444-1ba4eae16410?auto=format&fit=crop&w=600&q=80"}
                    alt="Aircraft Interior"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-[8px] font-mono text-white rounded">
                    Cabin
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Routing Table (No Callsign on Quote - Full Airport Names and Respective FBOs) */}
          <div className="mb-4">
            <div className="flex items-center justify-between border-b border-gray-300 pb-0.5 mb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B101A]">
                Flight Itinerary & Station Handling
              </h3>
              <span className="text-[10px] text-gray-500 font-mono lowercase">
                *local station departure and arrival times
              </span>
            </div>
            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-[#0B101A] text-white font-semibold text-[11px]">
                <tr>
                  <th className="p-2 border-b w-12 text-center text-[#C9A052]">Leg</th>
                  <th className="p-2 border-b">Flight Date</th>
                  <th className="p-2 border-b">Departure Station & FBO</th>
                  <th className="p-2 border-b">Arrival Station & FBO</th>
                  <th className="p-2 border-b text-center">Schedule (LT)</th>
                  <th className="p-2 border-b text-center">Duration</th>
                  <th className="p-2 border-b text-center">Pax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[11px]">
                {legs.map((leg) => (
                  <tr key={leg.legNumber} className="hover:bg-gray-50">
                    <td className="p-2 font-mono font-bold text-[#C9A052] text-center bg-gray-50">
                      #{leg.legNumber}
                    </td>
                    <td className="p-2 font-mono font-medium whitespace-nowrap">
                      {leg.flightDate}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-gray-900">
                          {leg.origin.name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {leg.origin.city} ({leg.origin.icao}{leg.origin.iata ? `/${leg.origin.iata}` : ""})
                        </span>
                        <span className="text-[10px] text-[#9A7A35] font-semibold mt-0.5 flex items-center gap-1">
                          <Building className="w-2.5 h-2.5 text-[#C9A052]" />
                          FBO: {leg.departureHandling?.name || `${leg.origin.city} Executive Handling`}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-gray-900">
                          {leg.destination.name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {leg.destination.city} ({leg.destination.icao}{leg.destination.iata ? `/${leg.destination.iata}` : ""})
                        </span>
                        <span className="text-[10px] text-emerald-800 font-semibold mt-0.5 flex items-center gap-1">
                          <Building className="w-2.5 h-2.5 text-emerald-600" />
                          FBO: {leg.arrivalHandling?.name || `${leg.destination.city} Executive Handling`}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-center font-mono whitespace-nowrap">
                      <span className="font-bold text-gray-900">{leg.departureTimeLocal}</span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span className="font-bold text-gray-900">{leg.arrivalTimeLocal}</span>
                    </td>
                    <td className="p-2 text-center font-mono text-gray-700 whitespace-nowrap">
                      {leg.flightTimeFormatted || "1h 15m"}
                    </td>
                    <td className="p-2 text-center font-bold text-gray-900">
                      {leg.paxCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Flight Legs Pet & Luggage Summary */}
            {legs.some((l) => l.pets?.hasPets || l.luggage) && (
              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                {legs.map((leg) => (
                  <div key={leg.legNumber} className="space-y-0.5">
                    <span className="font-bold text-gray-800 font-mono">Leg #{leg.legNumber} Carriage Profile:</span>
                    {leg.pets?.hasPets && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Dog className="w-3 h-3 text-[#C9A052]" />
                        <strong>Pets In-Cabin:</strong> {leg.pets.petCount} ({leg.pets.petType || "Approved Pet"}, {leg.pets.totalWeightKg} kg)
                      </p>
                    )}
                    {leg.luggage && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-[#C9A052]" />
                        <strong>Baggage:</strong> {leg.luggage.standardSuitcases || leg.luggage.pieceCount} pieces ({leg.luggage.totalWeightKg} kg hold)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Engine Breakdown */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B101A] mb-1.5 border-b border-gray-300 pb-0.5">
              Transparent Commercial Pricing Breakdown
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 text-xs">
              <div className="flex justify-between py-0.5 border-b border-gray-200 font-medium">
                <span>Base Aircraft Charter Rate</span>
                <span className="font-mono font-bold text-gray-900">{formatCurrency(pricing.flightPrice, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pl-3 text-[11px]">
                <span>- Airport Landing, Parking & ATC Navigation Fees</span>
                <span className="font-mono">{formatCurrency(pricing.airportFees, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pl-3 text-[11px]">
                <span>- Passenger Terminal Handling & Security Surcharges</span>
                <span className="font-mono">{formatCurrency(pricing.passengerFees, pricing.currency)}</span>
              </div>
              {pricing.dayOfWeekDiscount !== 0 && (
                <div className="flex justify-between text-emerald-700 font-medium pl-3 text-[11px]">
                  <span>- Special Itinerary Route Allowance</span>
                  <span className="font-mono">{formatCurrency(pricing.dayOfWeekDiscount, pricing.currency)}</span>
                </div>
              )}
              {pricing.additionalServicesTotal > 0 && (
                <div className="flex justify-between text-gray-700 pl-3 text-[11px]">
                  <span>- Tailored Concierge & Ground Transportation</span>
                  <span className="font-mono">{formatCurrency(pricing.additionalServicesTotal, pricing.currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-t border-gray-300 font-bold text-xs text-gray-900">
                <span>Net Charter Subtotal</span>
                <span className="font-mono">{formatCurrency(pricing.subtotal, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[10px]">
                <span>Commercial Aviation VAT (0% International Charter Exemption)</span>
                <span className="font-mono">{formatCurrency(0, pricing.currency)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-[#0B101A] font-black text-sm text-[#0B101A] bg-[#C9A052]/10 px-3 rounded mt-1">
                <span className="uppercase tracking-wider">TOTAL ALL-INCLUSIVE CHARTER PRICE</span>
                <span className="font-mono text-[#9A7A35] text-base">
                  {formatCurrency(pricing.totalFlightPrice, pricing.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Conditions & Remittance Schedule */}
          <div className="text-[10px] text-gray-600 space-y-1.5 border-t border-gray-200 pt-2.5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#0B101A] uppercase text-[11px]">
                Payment Conditions & Bank Remittance Instructions
              </p>
              <span className="font-mono text-[10px] text-gray-500">Invoice Ref: #{booking.invoiceNumber || "INV-00106020"}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <span className="font-bold text-gray-900 block font-mono">OPTION A: SEPA / SWIFT BANK WIRE (0% FEE)</span>
                <p>Total Due: <strong className="font-mono text-gray-900">{formatCurrency(pricing.totalFlightPrice, pricing.currency)}</strong></p>
                <p className="text-gray-500">Bank remittance with zero surcharge. Payment due prior to dispatch.</p>
              </div>

              <div className="p-2 bg-amber-50/60 rounded border border-amber-300">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-gray-900 font-mono">OPTION B: CREDIT / CORPORATE CARD</span>
                  <span className="text-[9px] font-mono font-bold bg-amber-200 text-amber-900 px-1 py-0.2 rounded">+3.5% Card Fee</span>
                </div>
                <p className="font-bold text-[#0B101A]">Total with Processing: <strong className="font-mono text-amber-900">{formatCurrency(pricing.totalFlightPrice * 1.035, pricing.currency)}</strong></p>
                <p className="text-gray-500">Instant credit card guarantee and reservation hold.</p>
              </div>
            </div>

            <p className="font-mono bg-gray-100 p-2 rounded border border-gray-200 text-gray-800 text-[10px]">
              Wire Instructions: Bank: <strong>{operator.bankName}</strong> • IBAN: <strong>{operator.iban}</strong> • BIC/SWIFT: <strong>{operator.bic}</strong> • Beneficiary: <strong>{operator.accountHolder}</strong> • Reference: <strong>{quoteId}</strong>
            </p>
          </div>
        </div>

        {/* Page 1 Footer */}
        <div className="mt-4 pt-2.5 border-t border-gray-200 text-[9px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">Orbelo Aviation Management</p>
            <p>Executive Private Charter Brokerage • Operations Center</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-700">Page 1 of 2</p>
            <p className="font-mono text-gray-500">{quoteId}</p>
          </div>
        </div>
      </div>

      {/* ================= PAGE 2: RADAR TRACK, FBO DIRECTORY, SERVICES & ACCEPTANCE ================= */}
      <div className="doc-page min-h-[1050px] bg-white p-8 sm:p-10 rounded-sm shadow-xl border border-gray-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#0B101A] pb-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="h-2 w-2 rounded-full bg-[#C9A052]" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#9A7A35] uppercase">
                  Flight Operations & Station Handling
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#0B101A] uppercase">
                Route Radar & Ground Handling Directory
              </h2>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl font-black" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] text-gray-500 font-mono">Ref: {quoteId}</p>
            </div>
          </div>

          {/* Visual Flight Radar Map with Authentic Coordinates & Labels */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B101A] mb-2 border-b border-gray-300 pb-0.5">
              Geographic Flight Route Radar & Navigation Track
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {legs.map((leg) => (
                <div key={leg.legNumber} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-[#0B101A]">
                      Leg #{leg.legNumber}: {leg.origin.city} ({leg.origin.icao}) → {leg.destination.city} ({leg.destination.icao})
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B101A] mb-1.5 border-b border-gray-300 pb-0.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#C9A052]" />
              Dedicated Executive FBO Handling Agents Directory
            </h3>
            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-[#0B101A] text-white font-semibold text-[11px]">
                <tr>
                  <th className="p-1.5 border-b w-16 text-center text-[#C9A052]">Station</th>
                  <th className="p-1.5 border-b">Airport Name</th>
                  <th className="p-1.5 border-b">Designated Executive FBO</th>
                  <th className="p-1.5 border-b">Direct Phone</th>
                  <th className="p-1.5 border-b">Operations Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[11px]">
                {legs.map((leg) => (
                  <React.Fragment key={leg.legNumber}>
                    <tr className="hover:bg-gray-50">
                      <td className="p-1.5 font-mono font-bold text-center bg-gray-50 text-gray-800">
                        Leg {leg.legNumber} Dep
                      </td>
                      <td className="p-1.5 font-bold text-gray-900">
                        {leg.origin.name} ({leg.origin.icao})
                      </td>
                      <td className="p-1.5 font-semibold text-[#9A7A35]">
                        {leg.departureHandling?.name || `${leg.origin.city} Executive Handling`}
                      </td>
                      <td className="p-1.5 font-mono text-gray-600">
                        {leg.departureHandling?.phone || "+41 58 158 1811"}
                      </td>
                      <td className="p-1.5 text-blue-700 truncate max-w-[150px] font-mono text-[10px]">
                        {leg.departureHandling?.email || "ops@handling.aero"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-1.5 font-mono font-bold text-center bg-gray-50 text-emerald-800">
                        Leg {leg.legNumber} Arr
                      </td>
                      <td className="p-1.5 font-bold text-gray-900">
                        {leg.destination.name} ({leg.destination.icao})
                      </td>
                      <td className="p-1.5 font-semibold text-emerald-700">
                        {leg.arrivalHandling?.name || `${leg.destination.city} Executive Handling`}
                      </td>
                      <td className="p-1.5 font-mono text-gray-600">
                        {leg.arrivalHandling?.phone || "+39 010 601 5412"}
                      </td>
                      <td className="p-1.5 text-blue-700 truncate max-w-[150px] font-mono text-[10px]">
                        {leg.arrivalHandling?.email || "ops@handling.aero"}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Concierge & Ground Transportation */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B101A] mb-1.5 border-b border-gray-300 pb-0.5">
              VIP In-Flight Catering & Ground Transfers
            </h3>
            <p className="text-xs text-gray-600 mb-2 leading-relaxed">
              Executive in-flight dining, open premium bar, fresh seasonal fruit platters, and fine refreshments are provided complimentary on all flights.
            </p>
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className={`p-2 border rounded ${services.limousineService ? "border-[#C9A052] bg-[#C9A052]/10 font-bold" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                <span>{services.limousineService ? "✓ " : ""}VIP Limousine Chauffeur</span>
              </div>
              <div className={`p-2 border rounded ${services.luxuryCarRental ? "border-[#C9A052] bg-[#C9A052]/10 font-bold" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                <span>{services.luxuryCarRental ? "✓ " : ""}Luxury Sports / SUV Rental</span>
              </div>
              <div className={`p-2 border rounded ${services.helicopterService ? "border-[#C9A052] bg-[#C9A052]/10 font-bold" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                <span>{services.helicopterService ? "✓ " : ""}Helicopter Connection</span>
              </div>
            </div>
            {services.vipCateringDetails && (
              <p className="text-[11px] text-gray-700 italic mt-1.5 bg-[#FAF9F6] p-2 border border-gray-200 rounded">
                <strong>Concierge Request:</strong> {services.vipCateringDetails}
              </p>
            )}
          </div>

          {/* Cancellation Policy Placeholder (User Request: "Cancellation Policy: Will be updated later") */}
          <div className="mb-5 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B101A]">
                Cancellation Policy
              </h4>
              <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                Pending Final Confirmation
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Cancellation Policy: Will be updated later. Standard private aviation charter cancellation terms apply and will be confirmed in the final charter contract agreement.
            </p>
          </div>

          {/* Digital Signature Acceptance Block */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0B101A] mb-1">
              Acceptance of Quotation & Authorisation to Proceed to Contract
            </p>
            <p className="text-[11px] text-gray-600 mb-4 leading-relaxed">
              By confirming this quotation, the Client acknowledges the proposed flight schedule, aircraft specifications, and pricing terms. This document acts as an executive charter proposal.
            </p>
            <div className="grid grid-cols-2 gap-6 text-xs pt-3 border-t border-gray-300">
              <div>
                <p className="font-semibold text-gray-800 mb-4">Charterer Signature / Authorisation</p>
                <div className="border-b border-gray-400 pb-1 mb-1 font-serif italic text-base text-gray-900">
                  {client.fullName}
                </div>
                <p className="text-[10px] text-gray-500">{client.companyName || client.fullName} • Authorised Signatory</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-4">Execution Date & Place</p>
                <div className="border-b border-gray-400 pb-1 mb-1 font-mono text-xs text-gray-900">
                  {contractDate} • Geneva / London / Paris
                </div>
                <p className="text-[10px] text-gray-500">Document Execution Timestamp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 Footer */}
        <div className="mt-4 pt-2.5 border-t border-gray-200 text-[9px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">Orbelo Aviation Management</p>
            <p>Customer Support: charter@orbelo.com • +44 20 7946 0880</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-700">Page 2 of 2</p>
            <p className="font-mono text-gray-500">{quoteId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
