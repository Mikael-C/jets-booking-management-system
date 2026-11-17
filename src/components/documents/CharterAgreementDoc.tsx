"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { useAviation } from "@/lib/aviationContext";
import { initialSettings } from "@/data/initialSettings";
import DocumentHeader from "./DocumentHeader";
import DocumentFooter from "./DocumentFooter";
import { formatDocCurrency } from "./QuotationDoc";

interface CharterAgreementDocProps {
  booking: Booking;
}

export default function CharterAgreementDoc({ booking }: CharterAgreementDocProps) {
  const { settings } = useAviation();
  const company = settings?.company || initialSettings.company;
  const cancellationPolicy = settings?.cancellationPolicy || initialSettings.cancellationPolicy;
  const activeTerms = settings?.termsVersions?.find((t) => t.isActive) || settings?.termsVersions?.[0] || initialSettings.termsVersions[0];
  const cardFeePercent = settings?.pricing?.cardFeePercent ?? initialSettings.pricing?.cardFeePercent ?? 3.5;

  const {
    client,
    aircraft,
    legs,
    pricing,
    tripNumber,
    quoteReference,
    accountNumber,
    contractDate
  } = booking;

  const agreementId = tripNumber ? `C-${tripNumber}` : "C-MX5521-001";
  const basedOnQuote = quoteReference || (tripNumber ? `Q-${tripNumber}` : "Q-MX5521-001");
  const currency = pricing?.currency || "EUR";
  const totalPrice = pricing?.totalFlightPrice ?? 58844;
  const clientName = client?.companyName || client?.fullName || "Bello Group Ltd";
  const footerRef = `${agreementId} · ${clientName}`;

  return (
    <div className="charter-agreement-document text-slate-900 bg-transparent font-sans max-w-[820px] mx-auto select-none print:max-w-none">
      {/* ================= PAGE 1 ================= */}
      <div className="doc-page min-h-[1123px] bg-white p-10 sm:p-12 rounded-sm shadow-xl border border-slate-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between box-border">
        <div className="space-y-5">
          <DocumentHeader booking={booking} />

          {/* Title & Agreement Meta */}
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Charter agreement
            </h1>
            <div className="text-right text-xs space-y-1">
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">AGREEMENT</span>
                <span className="font-semibold text-slate-900 font-mono w-28 text-right">{agreementId}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">BASED ON QUOTE</span>
                <span className="font-semibold text-slate-900 font-mono w-28 text-right">{basedOnQuote}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">DATE</span>
                <span className="font-medium text-slate-900 w-28 text-right">{contractDate || "15 Nov 2026"}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">STATUS</span>
                <span className="font-medium text-slate-900 w-28 text-right">For signature</span>
              </div>
            </div>
          </div>

          {/* The Client & The Broker */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-1">
            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                THE CLIENT
              </p>
              <p className="font-bold text-slate-900 text-sm">{clientName}</p>
              <p className="text-slate-700">Attn: {client?.fullName || "Ifeoma Bello"}, Managing Director</p>
              <p className="text-slate-600">{client?.streetAddress || "Plot 1120 Maitama District"}</p>
              <p className="text-slate-600">{client?.cityPostalCountry || "Abuja, Nigeria"}</p>
              <p className="text-slate-600 font-mono mt-0.5">Account {accountNumber || "ACC-30877"}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                THE BROKER
              </p>
              <p className="font-bold text-slate-900 text-sm">{company.legalEntity}</p>
              <p className="text-slate-700 leading-relaxed mt-0.5">
                Acting as charter broker and contracting party with the client, arranging the flights with an approved air operator (the operating carrier).
              </p>
              <p className="text-slate-500 mt-1 font-mono text-[11px]">
                {company.address} · Reg. {company.registrationNumber}
              </p>
            </div>
          </div>

          {/* 1 · FLIGHTS */}
          <div className="pt-1">
            <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
              1 · FLIGHTS
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-2 pr-2 font-bold w-12">LEG</th>
                  <th className="py-2 px-2 font-bold w-36">DATE</th>
                  <th className="py-2 px-2 font-bold">ROUTE</th>
                  <th className="py-2 px-2 font-bold text-center whitespace-nowrap">DEPARTS (LT)</th>
                  <th className="py-2 px-2 font-bold">AIRCRAFT</th>
                  <th className="py-2 pl-2 font-bold text-right w-12">PAX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {legs && legs.length > 0 ? (
                  legs.map((leg, index) => {
                    const originCode = leg.origin?.icao || "LFPB";
                    const destCode = leg.destination?.icao || "DNAA";
                    return (
                      <tr key={leg.legNumber || index}>
                        <td className="py-2.5 pr-2 font-medium text-slate-900">{leg.legNumber || index + 1}</td>
                        <td className="py-2.5 px-2 text-slate-800 whitespace-nowrap">{leg.flightDate || "Tue 24 Nov 2026"}</td>
                        <td className="py-2.5 px-2 font-semibold text-slate-900">{originCode} → {destCode}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-800">{leg.departureTimeLocal || "08:30"}</td>
                        <td className="py-2.5 px-2 text-slate-800">{aircraft?.name || "Challenger 350"} or similar</td>
                        <td className="py-2.5 pl-2 text-right font-medium text-slate-900">{leg.paxCount || 5}</td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr>
                      <td className="py-2.5 pr-2 font-medium text-slate-900">1</td>
                      <td className="py-2.5 px-2 text-slate-800 whitespace-nowrap">Tue 24 Nov 2026</td>
                      <td className="py-2.5 px-2 font-semibold text-slate-900">LFPB → DNAA</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-800">08:30</td>
                      <td className="py-2.5 px-2 text-slate-800">Challenger 350 or similar</td>
                      <td className="py-2.5 pl-2 text-right font-medium text-slate-900">5</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-2 font-medium text-slate-900">2</td>
                      <td className="py-2.5 px-2 text-slate-800 whitespace-nowrap">Mon 30 Nov 2026</td>
                      <td className="py-2.5 px-2 font-semibold text-slate-900">DNAA → LFPB</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-800">16:00</td>
                      <td className="py-2.5 px-2 text-slate-800">Challenger 350 or similar</td>
                      <td className="py-2.5 pl-2 text-right font-medium text-slate-900">5</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* 2 · PRICE AND PAYMENT */}
          <div className="pt-2">
            <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
              2 · PRICE AND PAYMENT
            </h3>
            <div className="border-t border-b border-slate-200 divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-700">Total charter price, including services listed in the quotation</span>
                <span className="font-bold text-slate-900 text-sm font-mono">{formatDocCurrency(totalPrice, currency)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-700">Payment due</span>
                <span className="text-slate-900 font-medium font-sans">
                  100% upon signature, and in all cases prior to departure
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-700">Method</span>
                <span className="text-slate-800 font-medium">
                  Bank transfer, or credit card (+{cardFeePercent}% card fee)
                </span>
              </div>
            </div>
          </div>

          {/* 3 · CANCELLATION BY THE CLIENT */}
          <div className="pt-2">
            <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
              3 · CANCELLATION BY THE CLIENT
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-2 font-bold">NOTICE BEFORE FIRST DEPARTURE</th>
                  <th className="py-2 text-right font-bold w-40">CANCELLATION FEE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {cancellationPolicy.map((step, idx) => (
                  <tr key={idx}>
                    <td className="py-2 text-slate-800">{step.description}</td>
                    <td className="py-2 text-right text-slate-900 font-mono font-semibold">{step.feePercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-500 mt-2">
              Cancellation policy governed strictly by standard terms agreed upon execution.
            </p>
          </div>

          {/* 4 · PASSENGERS AND DOCUMENTS */}
          <div className="pt-2">
            <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
              4 · PASSENGERS AND DOCUMENTS
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              The client provides full names and valid travel documents for every passenger, and pet passports where pets travel, no later than 48 hours before departure. Luggage beyond what is stated in the quotation may not fit the aircraft.
            </p>
          </div>
        </div>

        {/* Footer Page 1 */}
        <DocumentFooter leftText={footerRef} currentPage={1} totalPages={2} />
      </div>

      {/* ================= PAGE 2 ================= */}
      <div className="doc-page min-h-[1123px] bg-white p-10 sm:p-12 rounded-sm shadow-xl border border-slate-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between box-border">
        <div className="space-y-6">
          <DocumentHeader booking={booking} />

          {/* 5 · TERMS AND CONDITIONS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase m-0">
                5 · TERMS AND CONDITIONS
              </h3>
              <span className="font-mono text-[10px] text-slate-500 font-semibold">
                Version: {activeTerms.version}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-[#FCFAF7] space-y-3 text-xs leading-relaxed text-slate-700">
              <p className="font-semibold text-slate-900">
                Standard Charter Conditions ({activeTerms.version})
              </p>
              <p>
                1. <strong>Broker Capacity:</strong> The broker acts exclusively as an intermediary between the charterer and the operating carrier. All flights are performed under the air carrier's Air Operator Certificate (AOC).
              </p>
              <p>
                2. <strong>Operational Control & Weather:</strong> Operational decisions, including route alterations, weather diversions, and safety determinations, remain at the sole discretion of the aircraft commander (PIC).
              </p>
              <p>
                3. <strong>Substitutions:</strong> In the event of aircraft unavailability due to technical or operational factors, the broker will use reasonable endeavours to provide a comparable aircraft substitute.
              </p>
              <p>
                4. <strong>Passenger Compliance:</strong> Passengers must adhere to international customs, immigration, and aviation security requirements, and present valid biometric travel documents prior to embarkation.
              </p>
              <p>
                5. <strong>Governing Law & Jurisdiction:</strong> This agreement and any non-contractual obligations arising out of or in connection with it shall be governed by and construed in accordance with the laws of {company.courtOfJurisdiction}. The parties irrevocably agree that the courts of {company.courtOfJurisdiction} shall have exclusive jurisdiction.
              </p>
            </div>
          </div>

          {/* Confirmation Text */}
          <p className="text-xs text-slate-800 leading-relaxed pt-1">
            By signing, the client confirms the flights, the price and the terms above, and that the person signing is authorised to sign for the client.
          </p>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-10 pt-4">
            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-3">
                FOR THE CLIENT
              </p>
              <div className="border-t border-slate-300 pt-3 text-xs space-y-1">
                <p className="font-semibold text-slate-900">{client?.fullName || "Ifeoma Bello"}, Managing Director</p>
                <p className="text-slate-700">{clientName}</p>
                <p className="text-slate-500 pt-2 font-mono">Date ____________ Place ____________</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-3">
                FOR THE BROKER
              </p>
              <div className="border-t border-slate-300 pt-3 text-xs space-y-1">
                <p className="font-semibold text-slate-900">Authorised Signatory</p>
                <p className="text-slate-700">{company.legalEntity}</p>
                <p className="text-slate-500 pt-2 font-mono">Date ____________ Place ____________</p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 pt-2">
            Signed electronically: the e-signature certificate (signer, time, IP) is attached as the last page upon digital execution.
          </p>
        </div>

        {/* Footer Page 2 */}
        <DocumentFooter leftText={footerRef} currentPage={2} totalPages={2} />
      </div>
    </div>
  );
}
