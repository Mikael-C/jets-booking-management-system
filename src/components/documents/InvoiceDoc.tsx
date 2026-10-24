"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import FlightLegMap from "@/components/maps/FlightLegMap";

interface InvoiceDocProps {
  booking: Booking;
}

export default function InvoiceDoc({ booking }: InvoiceDocProps) {
  const {
    client,
    operator,
    aircraft,
    legs,
    pricing,
    tripNumber,
    invoiceNumber,
    accountNumber,
    contractDate,
    paymentDueDate,
    tripType
  } = booking;

  const tripTypeLabel =
    tripType === "round_trip" ? "RoundTripPlus" : tripType === "one_way" ? "One-Way Charter" : "Multi-Leg Itinerary";

  return (
    <div className="invoice-document text-gray-900 bg-transparent font-sans max-w-[850px] mx-auto">
      {/* ================= PAGE 1: OFFICIAL TAX INVOICE ================= */}
      <div className="doc-page min-h-[1050px] bg-white p-8 sm:p-10 rounded-sm shadow-xl border border-gray-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 uppercase">
                Invoice
              </h1>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                Official Tax & Flight Billing Statement
              </p>
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

          {/* Party & Invoice Details */}
          <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200 text-xs leading-relaxed mb-4">
            {/* TO */}
            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1 text-[10px] border-b border-gray-300 pb-0.5">
                To (Bill To)
              </p>
              <p className="font-semibold text-gray-900">{client.fullName}</p>
              {client.companyName && <p className="text-gray-700">{client.companyName}</p>}
              <p className="text-gray-600">{client.streetAddress}</p>
              <p className="text-gray-600">{client.cityPostalCountry}</p>
              {client.vatNumber && <p className="text-gray-500 mt-0.5">Tax ID: {client.vatNumber}</p>}
            </div>

            {/* FROM */}
            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1 text-[10px] border-b border-gray-300 pb-0.5">
                From (Remit To)
              </p>
              <p className="font-semibold text-gray-900">{operator.companyName}</p>
              <p className="text-gray-700">{operator.representativeName}</p>
              <p className="text-blue-700 font-medium">{operator.supportEmail}</p>
              <p className="text-gray-600">{operator.supportPhone}</p>
              <p className="text-gray-500 mt-0.5">VAT # {operator.vatNumber}</p>
            </div>

            {/* DETAILS */}
            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1 text-[10px] border-b border-gray-300 pb-0.5">
                Invoice Details
              </p>
              <div className="grid grid-cols-2 gap-y-0.5 text-[11px]">
                <span className="text-gray-500">Invoice Date:</span>
                <span className="font-medium text-gray-900">{contractDate}</span>
                <span className="text-gray-500">Invoice No.:</span>
                <span className="font-bold text-gray-900 font-mono">{invoiceNumber}</span>
                <span className="text-gray-500">Trip No.:</span>
                <span className="font-bold text-gray-900 font-mono">{tripNumber}</span>
                <span className="text-gray-500">Account No.:</span>
                <span className="font-mono text-gray-900">{accountNumber}</span>
                <span className="text-gray-500">Payment Due:</span>
                <span className="font-semibold text-gray-900 font-mono text-red-600">{paymentDueDate}</span>
              </div>
            </div>
          </div>

          {/* Trip Summary */}
          <div className="mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-500 text-[10px] uppercase font-mono">Aircraft Assigned</span>
                <p className="font-bold text-gray-900">{aircraft.name} ({aircraft.registration || "OE-FFB"})</p>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] uppercase font-mono">Charter Type</span>
                <p className="font-semibold text-gray-900">{tripTypeLabel}</p>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] uppercase font-mono">Routing Legs</span>
                <p className="font-semibold text-gray-900">{legs.length} Flown Leg(s)</p>
              </div>
            </div>
          </div>

          {/* Flown / Booked Legs Table */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 border-b border-gray-300 pb-0.5">
              Flown Legs <span className="text-[10px] text-gray-500 font-normal lowercase">(Local station times)</span>
            </h3>

            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-gray-100 text-gray-700 font-semibold text-[11px]">
                <tr>
                  <th className="p-1.5 border-b">Date</th>
                  <th className="p-1.5 border-b">From</th>
                  <th className="p-1.5 border-b">To</th>
                  <th className="p-1.5 border-b">Departure</th>
                  <th className="p-1.5 border-b">Arrival</th>
                  <th className="p-1.5 border-b text-center"># Pax</th>
                  <th className="p-1.5 border-b">Flight #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[11px]">
                {legs.map((leg) => (
                  <tr key={leg.legNumber}>
                    <td className="p-1.5 font-medium">{leg.flightDate}</td>
                    <td className="p-1.5 font-bold text-gray-900">{leg.origin.city} ({leg.origin.icao})</td>
                    <td className="p-1.5 font-bold text-gray-900">{leg.destination.city} ({leg.destination.icao})</td>
                    <td className="p-1.5 font-mono">{leg.departureTimeLocal}</td>
                    <td className="p-1.5 font-mono">{leg.arrivalTimeLocal}</td>
                    <td className="p-1.5 text-center font-bold">{leg.paxCount}</td>
                    <td className="p-1.5 font-mono font-bold text-gray-700">{leg.flightNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Compact Route Radar Visual Map Strip */}
          <div className="mb-4">
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

          {/* Pricing Calculation Table */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 border-b border-gray-300 pb-0.5">
              Itemized Tax & Pricing Breakdown
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 text-xs">
              <div className="flex justify-between py-0.5 border-b border-gray-200 font-medium">
                <span>Flight Price</span>
                <span className="font-mono">{formatCurrency(pricing.flightPrice, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pl-3 text-[11px]">
                <span>- Airport Landing & Ramp Fees</span>
                <span className="font-mono">{formatCurrency(pricing.airportFees, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pl-3 text-[11px]">
                <span>- Passenger Terminal Security Fees</span>
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
                <span>Subtotal (Net Amount)</span>
                <span className="font-mono">{formatCurrency(pricing.subtotal, pricing.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[10px]">
                <span>VAT (0%, International commercial air transportation VAT exempt per §6, Abs. 1, Zif. 3 Austrian VAT Act)</span>
                <span className="font-mono">{formatCurrency(0, pricing.currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t-2 border-gray-900 font-extrabold text-sm text-gray-900 bg-gold/10 px-2.5 rounded">
                <span className="uppercase tracking-wider">TOTAL INVOICE PAYABLE AMOUNT</span>
                <span className="font-mono text-gold-dark text-base">
                  {formatCurrency(pricing.totalFlightPrice, pricing.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Conditions & Wire Details */}
          <div className="text-[10px] text-gray-600 space-y-1.5 border-t border-gray-200 pt-2.5">
            <p className="font-bold text-gray-900 uppercase text-[11px]">Payment Conditions & Wire Remittance</p>
            <p>Customer agrees to pay all bank wire fees. SEPA wiring or international Fedwire is preferred.</p>
            <p className="font-mono bg-gray-100 p-2 rounded border border-gray-200 text-gray-800 text-[10px]">
              Bank: <strong>{operator.bankName}</strong> • IBAN: <strong>{operator.iban}</strong> • BIC: <strong>{operator.bic}</strong> • Acc. Holder: <strong>{operator.accountHolder}</strong> • Reference: <strong>INV-{invoiceNumber}</strong>
            </p>
            <p className="text-[10px] text-gray-500 italic">
              Payment is due by {paymentDueDate}. International flights are exempt from VAT under European Aviation legislation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-2.5 border-t border-gray-200 text-[9px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">{operator.companyName}</p>
            <p>Flughafenstraße 3 / Objekt 10 • 4063 Hörsching • Austria • VAT: {operator.vatNumber}</p>
            <p>{operator.commercialRegistry} • Court of Jurisdiction: {operator.courtOfJurisdiction}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">Official Invoice {invoiceNumber}</p>
            <p className="font-mono text-gray-600">Trip: {tripNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
