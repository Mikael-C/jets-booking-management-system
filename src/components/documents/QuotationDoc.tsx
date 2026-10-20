"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import FlightLegMap from "@/components/maps/FlightLegMap";

interface QuotationDocProps {
  booking: Booking;
}

export default function QuotationDoc({ booking }: QuotationDocProps) {
  const { client, operator, aircraft, legs, pricing, services, tripNumber, accountNumber, contractDate, quoteExpirationDate } = booking;

  return (
    <div className="quotation-document text-gray-900 bg-white font-sans max-w-[850px] mx-auto p-8 sm:p-12 shadow-2xl rounded-sm">
      {/* ================= PAGE 1 ================= */}
      <div className="doc-page min-h-[1050px] flex flex-col justify-between border-b border-gray-200 pb-12 mb-12">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 uppercase">Quotation</h1>
              <span className="text-xs font-semibold text-gold tracking-widest uppercase">Executive Private Charter Proposal</span>
            </div>
            <div className="text-right">
              <span className="font-display text-3xl font-black tracking-tight" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Private Jet Aviation</p>
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
              {client.vatNumber && <p className="text-gray-500 mt-1">Tax ID: {client.vatNumber}</p>}
            </div>

            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 text-[11px] border-b border-gray-300 pb-0.5">From</p>
              <p className="font-semibold text-gray-900">{operator.companyName}</p>
              <p className="text-gray-700">{operator.representativeName}</p>
              <p className="text-blue-700 font-medium">{operator.supportEmail}</p>
              <p className="text-gray-600">{operator.supportPhone}</p>
              <p className="text-gray-500 mt-1">VAT No. {operator.vatNumber}</p>
            </div>

            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 text-[11px] border-b border-gray-300 pb-0.5">Details</p>
              <div className="grid grid-cols-2 gap-y-1">
                <span className="text-gray-500">Contract Date:</span>
                <span className="font-medium text-gray-900">{contractDate}</span>
                <span className="text-gray-500">Trip No.:</span>
                <span className="font-bold text-gray-900 font-mono">{tripNumber}</span>
                <span className="text-gray-500">Account No.:</span>
                <span className="font-mono text-gray-900">{accountNumber}</span>
                <span className="text-gray-500">Expiration:</span>
                <span className="font-semibold text-red-600 font-mono text-[11px]">{quoteExpirationDate}</span>
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
                  <span>Passenger Seats:</span>
                  <span className="font-semibold text-gray-900">{aircraft.passengers}</span>
                  <span>Non-Smoking Cabin:</span>
                  <span className="font-semibold text-gray-900">Yes</span>
                  <span>Enclosed Lavatory:</span>
                  <span className="font-semibold text-gray-900">{aircraft.toilette ? "Yes" : "No"}</span>
                  <span>Cruise Speed:</span>
                  <span className="font-semibold text-gray-900">{aircraft.cruiseSpeed || "410 ktas"}</span>
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

          {/* Routing Table & Map Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between border-b border-gray-300 pb-1 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Routing <span className="text-[10px] text-gray-500 font-normal lowercase">(Please note that all times are local times)</span>
              </h3>
            </div>

            {/* Itinerary Leg Items */}
            <div className="space-y-4">
              {legs.map((leg) => (
                <div key={leg.legNumber} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Routing Details */}
                    <div className="lg:col-span-7">
                      <div className="grid grid-cols-7 text-xs font-semibold text-gray-500 border-b border-gray-200 pb-1 mb-2">
                        <span>Leg #</span>
                        <span className="col-span-2">Date</span>
                        <span className="col-span-2">From → To</span>
                        <span>Times</span>
                        <span className="text-right">Pax</span>
                      </div>
                      <div className="grid grid-cols-7 text-xs items-center text-gray-900">
                        <span className="font-bold text-gold font-mono">{leg.legNumber}</span>
                        <span className="col-span-2 text-gray-600 font-medium">{leg.flightDate}</span>
                        <div className="col-span-2">
                          <p className="font-bold">{leg.origin.city} ({leg.origin.icao})</p>
                          <p className="text-[11px] text-gray-500">to {leg.destination.city} ({leg.destination.icao})</p>
                        </div>
                        <div className="text-[11px] font-mono">
                          <p className="font-semibold">{leg.departureTimeLocal}</p>
                          <p className="text-gray-500">{leg.arrivalTimeLocal}</p>
                        </div>
                        <span className="text-right font-bold text-gray-800">{leg.paxCount}</span>
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                        <span>Tail: <strong className="text-gray-800 font-mono">{leg.aircraftRegistration}</strong></span>
                        <span>Callsign: <strong className="text-gray-800 font-mono">{leg.flightNumber}</strong></span>
                        <span>Duration: <strong className="text-gray-800">{leg.flightTimeFormatted}</strong></span>
                      </div>
                    </div>

                    {/* Flight Leg Route Map */}
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
                </div>
              ))}
            </div>
          </div>

          {/* Handling Agents */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              FBO Ground Handling Agents
            </h3>
            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-gray-100 text-gray-700 font-semibold">
                <tr>
                  <th className="p-2 border-b">Leg#</th>
                  <th className="p-2 border-b">Station</th>
                  <th className="p-2 border-b">Handling Agent</th>
                  <th className="p-2 border-b">Phone</th>
                  <th className="p-2 border-b">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {legs.map((leg) => (
                  <React.Fragment key={leg.legNumber}>
                    <tr>
                      <td className="p-2 font-mono font-bold text-gray-700">{leg.legNumber} (Dep)</td>
                      <td className="p-2 font-semibold">{leg.origin.city} ({leg.origin.icao})</td>
                      <td className="p-2">{leg.departureHandling.name}</td>
                      <td className="p-2 font-mono text-gray-600">{leg.departureHandling.phone}</td>
                      <td className="p-2 text-blue-600 truncate max-w-[140px]">{leg.departureHandling.email}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-gray-700">{leg.legNumber} (Arr)</td>
                      <td className="p-2 font-semibold">{leg.destination.city} ({leg.destination.icao})</td>
                      <td className="p-2">{leg.arrivalHandling.name}</td>
                      <td className="p-2 font-mono text-gray-600">{leg.arrivalHandling.phone}</td>
                      <td className="p-2 text-blue-600 truncate max-w-[140px]">{leg.arrivalHandling.email}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Engine Itemization */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Pricing Breakdown
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200 font-medium">
                <span>Flight Price</span>
                <span className="font-mono">{formatCurrency(pricing.flightPrice, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pl-4">
                <span>- Airport Fees (Landing, Parking, Navigation)</span>
                <span className="font-mono">{formatCurrency(pricing.airportFees, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pl-4">
                <span>- Passenger Terminal Fees</span>
                <span className="font-mono">{formatCurrency(pricing.passengerFees, pricing.currency)}</span>
              </div>
              {pricing.dayOfWeekDiscount !== 0 && (
                <div className="flex justify-between text-emerald-700 font-medium pl-4">
                  <span>- Day of week discount</span>
                  <span className="font-mono">{formatCurrency(pricing.dayOfWeekDiscount, pricing.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 pl-4">
                <span>- Inbound Passenger Tax</span>
                <span className="font-mono">{formatCurrency(pricing.inboundPassengerTax, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pl-4">
                <span>- Outbound Passenger Tax</span>
                <span className="font-mono">{formatCurrency(pricing.outboundPassengerTax, pricing.currency)}</span>
              </div>
              {pricing.additionalServicesTotal > 0 && (
                <div className="flex justify-between text-gray-700 pl-4">
                  <span>Additional Services (Catering, De-icing, Carbon offset)</span>
                  <span className="font-mono">{formatCurrency(pricing.additionalServicesTotal, pricing.currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-gray-300 font-bold text-sm text-gray-900">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(pricing.subtotal, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>VAT (0%, International flights VAT free according §6, Abs. 1, Zif. 3 Austrian act of VAT)</span>
                <span className="font-mono">{formatCurrency(0, pricing.currency)}</span>
              </div>
              <div className="flex justify-between py-2.5 border-t-2 border-gray-900 font-extrabold text-base text-gray-900 bg-gold/10 px-3 rounded">
                <span className="uppercase tracking-wider">TOTAL FLIGHT PRICE</span>
                <span className="font-mono text-gold-dark">{formatCurrency(pricing.totalFlightPrice, pricing.currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment Conditions & Bank Wire */}
          <div className="text-[11px] text-gray-600 space-y-1.5 border-t border-gray-200 pt-3">
            <p className="font-bold text-gray-900 uppercase">Payment Conditions</p>
            <p>Payment terms: Wire transfer / SEPA wiring preferred. Client agrees to pay all bank charges.</p>
            <p className="font-mono bg-gray-100 p-2 rounded border border-gray-200 text-gray-800">
              Bank: <strong>{operator.bankName}</strong> • IBAN: <strong>{operator.iban}</strong> • BIC: <strong>{operator.bic}</strong> • Holder: <strong>{operator.accountHolder}</strong>
            </p>
            <p className="text-[10px] text-gray-500 italic">
              This quotation is based upon the travel details provided. Prices include all flight associated fees and expenses. Flights are subject to overflight, take-off and landing permissions as well as aircraft availability.
            </p>
          </div>
        </div>

        {/* Page Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">{operator.companyName}</p>
            <p>Flughafenstraße 3 / Objekt 10 • 4063 Hörsching • Austria</p>
            <p>VAT no: {operator.vatNumber} • {operator.commercialRegistry}</p>
          </div>
          <div className="text-right">
            <p>Page 1 of 3</p>
            <p className="font-mono font-medium text-gray-700">{tripNumber}</p>
          </div>
        </div>
      </div>

      {/* ================= PAGE 2: CONTRACT & CANCELLATION ================= */}
      <div className="doc-page min-h-[1050px] flex flex-col justify-between border-b border-gray-200 pb-12 mb-12">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">Charter Contract & Terms</h2>
              <span className="text-xs font-semibold text-gold tracking-widest uppercase">Terms of Carriage & Cancellation</span>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl font-black" style={{ color: "#FF6B00" }}>ORBELO</span>
              <p className="text-[10px] text-gray-500">Trip: {tripNumber}</p>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Cancellation Policy Schedule
            </h3>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              In the event of a flight cancellation, Orbelo GmbH shall retain the security deposit in accordance with our standard cancellation policy:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span className="text-gray-800">• More than 168 hours (7 days) prior to departure:</span>
                <span className="font-bold text-gray-900 font-mono">10% of Charter Price (min. € 500,-)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span className="text-gray-800">• Within 168 hours (7 days) but more than 48 hours:</span>
                <span className="font-bold text-gray-900 font-mono">30% of Charter Price</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span className="text-gray-800">• Within 48 hours but more than 24 hours:</span>
                <span className="font-bold text-gray-900 font-mono">50% of Charter Price</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-800">• Within 24 hours of departure or passenger no-show:</span>
                <span className="font-bold text-red-600 font-mono">75% - 100% of Charter Price</span>
              </div>
            </div>
          </div>

          {/* Last-Minute Trip Cancellation Insurance */}
          <div className="mb-6 bg-gold/5 border border-gold/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Last - Minute Trip Cancellation Insurance
              </h4>
              <span className="font-mono font-bold text-gold-dark text-xs">€ 1 000.- / leg</span>
            </div>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              Orbelo is pleased to offer last-minute cancellation insurance for your trips. Cancel free of charge up to 24 hours before your confirmed time of departure.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 bg-white p-2.5 rounded border border-gray-200">
              <input type="checkbox" className="rounded text-gold focus:ring-gold" checked={!!services.cancellationInsurance} readOnly />
              <span>Opt-in: Free of charge trip cancellation up to 24h before departure (€ 1 000.- / leg)</span>
            </div>
          </div>

          {/* Passenger Passports & APIS Regulations */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Passenger Manifest & Border Security
            </h3>
            <div className="text-xs text-gray-600 space-y-2 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p>
                <strong>Passports & ID:</strong> Clients must submit all required passenger details, including high-resolution passport scans or clear photos for all passengers and pets travelling.
              </p>
              <p>
                <strong>UK & International Border Compliance:</strong> For all flights entering or leaving the United Kingdom or Schengen border control zones, complete APIS details must be submitted at least 2 hours prior to scheduled departure. No late changes are permitted once flight plans are filed.
              </p>
            </div>
          </div>
        </div>

        {/* Page Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">{operator.companyName}</p>
            <p>VAT registrations: {operator.additionalVatNumbers.join(" • ")}</p>
          </div>
          <div className="text-right">
            <p>Page 2 of 3</p>
            <p className="font-mono font-medium text-gray-700">{tripNumber}</p>
          </div>
        </div>
      </div>

      {/* ================= PAGE 3: ADDITIONAL SERVICES & SIGNATURE ================= */}
      <div className="doc-page min-h-[1050px] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">Additional Services</h2>
              <span className="text-xs font-semibold text-gold tracking-widest uppercase">VIP Concierge & Environmental Options</span>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl font-black" style={{ color: "#FF6B00" }}>ORBELO</span>
              <p className="text-[10px] text-gray-500">Trip: {tripNumber}</p>
            </div>
          </div>

          {/* Catering & Partner Services */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Catering & Ground Transfers
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              A wide selection of sweet and salty premium labeled snacks and open bar (soft drinks, beer, wine, coffee, tea) is provided complimentary on all flights, including Taittinger Champagne.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
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
              <div className="flex items-center gap-2 p-2 border border-gray-200 rounded bg-gray-50">
                <input type="checkbox" checked={true} readOnly className="rounded text-gold" />
                <span className="font-medium text-gray-800">Bespoke In-Flight VIP Catering</span>
              </div>
            </div>
            {services.vipCateringDetails && (
              <p className="text-[11px] text-gray-600 italic mt-2 bg-yellow-50 p-2 border border-yellow-200 rounded">
                Special Requests: {services.vipCateringDetails}
              </p>
            )}
          </div>

          {/* De-Icing Insurance */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              De-Icing Protection Insurance
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              We offer the option to secure de-icing insurance before departure, providing peace of mind and fixed costs:
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className={`p-3 rounded-lg border ${services.deicingInsurance === "at_reservation" ? "border-gold bg-gold/10" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex justify-between font-bold text-gray-900 mb-1">
                  <span>Option 1: Book at Reservation</span>
                  <span className="font-mono text-gold-dark">€ 400 / leg</span>
                </div>
                <p className="text-[11px] text-gray-500">Secure full de-icing coverage upon signing this agreement.</p>
              </div>
              <div className={`p-3 rounded-lg border ${services.deicingInsurance === "within_48h" ? "border-gold bg-gold/10" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex justify-between font-bold text-gray-900 mb-1">
                  <span>Option 2: Book Later</span>
                  <span className="font-mono text-gray-700">€ 800 / leg</span>
                </div>
                <p className="text-[11px] text-gray-500">Add coverage up to 48 hours prior to scheduled departure.</p>
              </div>
            </div>
          </div>

          {/* Carbon Offset Program */}
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Carbon Offset Program
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <input type="radio" checked={services.carbonOffset === "neutral"} readOnly />
                  <span><strong>Fly Neutral:</strong> Compensate 100% of flight carbon emissions</span>
                </div>
                <span className="font-mono text-gray-700">€ 33 / flight hr</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <input type="radio" checked={services.carbonOffset === "positive"} readOnly />
                  <span><strong>Fly Positive:</strong> Donate 50% more than full carbon compensation</span>
                </div>
                <span className="font-mono text-gray-700">€ 50 / flight hr</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <input type="radio" checked={services.carbonOffset === "double_neutral"} readOnly />
                  <span><strong>Fly Double Neutral:</strong> Double the total carbon compensation</span>
                </div>
                <span className="font-mono text-gray-700">€ 66 / flight hr</span>
              </div>
            </div>
          </div>

          {/* Digital Signature Block */}
          <div className="border border-gray-300 rounded-lg p-5 bg-gray-50">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-4">
              Acceptance of Quotation & Contract Terms
            </p>
            <p className="text-xs text-gray-600 mb-8 leading-relaxed">
              By signing below, the Client confirms acceptance of the flights, routing, pricing, cancellation terms, and general conditions outlined in this Quotation.
            </p>
            <div className="grid grid-cols-2 gap-8 text-xs pt-4 border-t border-gray-300">
              <div>
                <p className="font-semibold text-gray-800 mb-8">Client Signature / Corporate Stamp</p>
                <div className="border-b border-gray-400 pb-1 mb-1 font-sans italic text-base text-gray-800">
                  {client.fullName}
                </div>
                <p className="text-[10px] text-gray-500">Authorized Signatory • {client.companyName || client.fullName}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-8">Date & Place</p>
                <div className="border-b border-gray-400 pb-1 mb-1 font-mono text-sm text-gray-800">
                  {contractDate} • Monaco / Geneva
                </div>
                <p className="text-[10px] text-gray-500">Execution Date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">{operator.companyName}</p>
            <p>Customer Care: {operator.supportPhone} • {operator.supportEmail}</p>
          </div>
          <div className="text-right">
            <p>Page 3 of 3</p>
            <p className="font-mono font-medium text-gray-700">{tripNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
