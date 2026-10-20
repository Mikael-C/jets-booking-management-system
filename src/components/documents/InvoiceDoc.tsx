"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import FlightLegMap from "@/components/maps/FlightLegMap";

interface InvoiceDocProps {
  booking: Booking;
}

export default function InvoiceDoc({ booking }: InvoiceDocProps) {
  const { client, operator, aircraft, legs, pricing, tripNumber, invoiceNumber, accountNumber, contractDate, paymentDueDate, tripType } = booking;

  const tripTypeLabel =
    tripType === "round_trip" ? "RoundTripPlus" : tripType === "one_way" ? "One-Way Charter" : "Multi-Leg Itinerary";

  return (
    <div className="invoice-document text-gray-900 bg-white font-sans max-w-[850px] mx-auto p-8 sm:p-12 shadow-2xl rounded-sm">
      <div className="min-h-[1050px] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 uppercase">Invoice</h1>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Official Tax & Flight Billing Statement</p>
            </div>
            <div className="text-right">
              <span className="font-display text-3xl font-black tracking-tight" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Private Jet Aviation</p>
            </div>
          </div>

          {/* Party & Invoice Details */}
          <div className="grid grid-cols-3 gap-6 py-4 border-b border-gray-200 text-xs leading-relaxed mb-6">
            {/* TO */}
            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 text-[11px] border-b border-gray-300 pb-0.5">To</p>
              <p className="font-semibold text-gray-900">{client.fullName}</p>
              {client.companyName && <p className="text-gray-700">{client.companyName}</p>}
              <p className="text-gray-600">{client.streetAddress}</p>
              <p className="text-gray-600">{client.cityPostalCountry}</p>
              {client.vatNumber && <p className="text-gray-500 mt-1">Tax ID: {client.vatNumber}</p>}
            </div>

            {/* FROM */}
            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 text-[11px] border-b border-gray-300 pb-0.5">From</p>
              <p className="font-semibold text-gray-900">{operator.companyName}</p>
              <p className="text-gray-700">{operator.representativeName}</p>
              <p className="text-blue-700 font-medium">{operator.supportEmail}</p>
              <p className="text-gray-600">{operator.supportPhone}</p>
              <p className="text-gray-500 mt-1">VAT # {operator.vatNumber}</p>
            </div>

            {/* DETAILS */}
            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 text-[11px] border-b border-gray-300 pb-0.5">Invoice Details</p>
              <div className="grid grid-cols-2 gap-y-1">
                <span className="text-gray-500">Invoice Date:</span>
                <span className="font-medium text-gray-900">{contractDate}</span>
                <span className="text-gray-500">Invoice No.:</span>
                <span className="font-bold text-gray-900 font-mono">{invoiceNumber}</span>
                <span className="text-gray-500">Trip No.:</span>
                <span className="font-bold text-gray-900 font-mono">{tripNumber}</span>
                <span className="text-gray-500">Account No.:</span>
                <span className="font-mono text-gray-900">{accountNumber}</span>
                <span className="text-gray-500">Due Date:</span>
                <span className="font-semibold text-gray-900 font-mono">{paymentDueDate}</span>
              </div>
            </div>
          </div>

          {/* Trip Summary */}
          <div className="mb-6 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Trip Summary
            </h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Aircraft:</span>
                <p className="font-semibold text-gray-900">{aircraft.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Trip Type:</span>
                <p className="font-semibold text-gray-900">{tripTypeLabel}</p>
              </div>
              <div>
                <span className="text-gray-500">Number of legs:</span>
                <p className="font-semibold text-gray-900">{legs.length}</p>
              </div>
            </div>
          </div>

          {/* Flown / Booked Legs */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Flown Legs <span className="text-[10px] text-gray-500 font-normal lowercase">(Please note that all times are local times)</span>
            </h3>

            <div className="space-y-4">
              <table className="w-full text-left text-xs border border-gray-200">
                <thead className="bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="p-2 border-b">Date</th>
                    <th className="p-2 border-b">From</th>
                    <th className="p-2 border-b">To</th>
                    <th className="p-2 border-b">Departure</th>
                    <th className="p-2 border-b">Arrival</th>
                    <th className="p-2 border-b text-center"># Pax</th>
                    <th className="p-2 border-b">Flight #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {legs.map((leg) => (
                    <tr key={leg.legNumber}>
                      <td className="p-2 font-medium">{leg.flightDate}</td>
                      <td className="p-2 font-semibold text-gray-900">{leg.origin.city} ({leg.origin.icao})</td>
                      <td className="p-2 font-semibold text-gray-900">{leg.destination.city} ({leg.destination.icao})</td>
                      <td className="p-2 font-mono">{leg.departureTimeLocal}</td>
                      <td className="p-2 font-mono">{leg.arrivalTimeLocal}</td>
                      <td className="p-2 text-center font-bold">{leg.paxCount}</td>
                      <td className="p-2 font-mono font-bold text-gray-700">{leg.flightNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Legs Route Visual Map */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Pricing Calculation Table */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Pricing
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200 font-medium">
                <span>Flight Price</span>
                <span className="font-mono">{formatCurrency(pricing.flightPrice, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pl-4">
                <span>- Airport Fees</span>
                <span className="font-mono">{formatCurrency(pricing.airportFees, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pl-4">
                <span>- Passenger Fees</span>
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
                  <span>Additional Services</span>
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

          {/* Payment Conditions & Wire Details */}
          <div className="text-[11px] text-gray-600 space-y-1.5 border-t border-gray-200 pt-3">
            <p className="font-bold text-gray-900 uppercase">Payment Conditions</p>
            <p>Customer agrees to pay all bank charges. SEPA wiring or Fedwire is preferred.</p>
            <p className="font-mono bg-gray-100 p-2 rounded border border-gray-200 text-gray-800">
              Bank: <strong>{operator.bankName}</strong> • IBAN: <strong>{operator.iban}</strong> • BIC: <strong>{operator.bic}</strong> • Acc. Holder: <strong>{operator.accountHolder}</strong>
            </p>
            <p className="text-[10px] text-gray-500 italic">
              This invoice is based upon the travel details provided. Prices include all flight associated fees and expenses. The flights are subject to overflight, take-off and landing permissions as well as aircraft availability.
            </p>
            <p className="text-[10px] text-gray-500">
              Our additional VAT numbers: {operator.additionalVatNumbers.join(" • ")}
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
            <p className="font-bold text-gray-900">Invoice {invoiceNumber}</p>
            <p className="font-mono text-gray-600">Trip: {tripNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
