"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { useAviation } from "@/lib/aviationContext";
import { initialSettings } from "@/data/initialSettings";
import DocumentHeader from "./DocumentHeader";
import DocumentFooter from "./DocumentFooter";
import { formatDocCurrency } from "./QuotationDoc";

interface InvoiceDocProps {
  booking: Booking;
}

export default function InvoiceDoc({ booking }: InvoiceDocProps) {
  const { settings } = useAviation();
  const company = settings?.company || initialSettings.company;
  const cardFeePercent = settings?.pricing?.cardFeePercent ?? initialSettings.pricing?.cardFeePercent ?? 3.5;

  const {
    client,
    aircraft,
    legs,
    pricing,
    tripNumber,
    invoiceNumber,
    accountNumber,
    contractDate,
    paymentDueDate,
    paymentStatus
  } = booking;

  const invNumber = invoiceNumber || (tripNumber ? `INV-${tripNumber}-01` : "INV-FE4578-01");
  const tripRef = tripNumber || "FE4578";
  const currency = pricing?.currency || "EUR";
  const totalAmount = pricing?.totalFlightPrice ?? 8000;
  const cardAmount = booking.totalWithCardFee ?? (totalAmount * (1 + cardFeePercent / 100));
  const clientName = client?.companyName || client?.fullName || "Adeyemi Holdings Ltd";
  const agreementRef = `C-${tripNumber || "FE4578-002"}`;

  const isPaid = paymentStatus === "fully_paid";
  const repName = booking.agentName || "Marcus Vance";
  const repEmail = booking.agentEmail || "marcus@vanceaviation.co.uk";
  const repPhone = "+44 20 7946 0912";

  // Select bank account from Settings based on currency
  const bankAccounts = settings?.bankAccounts || initialSettings.bankAccounts;
  const bank = bankAccounts.find((b) => b.currency === currency) || bankAccounts[0];

  const firstLeg = legs && legs.length > 0 ? legs[0] : null;
  const legOriginIcao = firstLeg?.origin?.icao || "LEIB";
  const legDestIcao = firstLeg?.destination?.icao || "LSGG";
  const legOriginCity = firstLeg?.origin?.city || "Ibiza";
  const legDestCity = firstLeg?.destination?.city || "Geneva";
  const legFlightDate = firstLeg?.flightDate || contractDate || "20 Nov 2026";
  const paxCount = firstLeg?.paxCount || 4;
  const categoryLabel = aircraft?.categoryLabel || "Light jet";

  return (
    <div className="invoice-document text-slate-900 bg-transparent font-sans max-w-[820px] mx-auto select-none print:max-w-none">
      {/* ================= PAGE 1: INVOICE ================= */}
      <div className="doc-page min-h-[1123px] bg-white p-10 sm:p-12 rounded-sm shadow-xl border border-slate-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between box-border">
        <div className="space-y-6">
          <DocumentHeader booking={booking} />

          {/* Title & Invoice Meta */}
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Invoice
            </h1>
            <div className="text-right text-xs space-y-1">
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">INVOICE</span>
                <span className="font-semibold text-slate-900 font-mono w-44 text-right">{invNumber}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">TRIP</span>
                <span className="font-semibold text-slate-900 font-mono w-44 text-right">{tripRef}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">ISSUE DATE</span>
                <span className="font-medium text-slate-900 w-44 text-right">{contractDate || "12 Nov 2026"}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">DUE</span>
                <span className="font-medium text-slate-900 w-44 text-right">
                  Before departure, {paymentDueDate || "18 Nov 2026"}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To & Representative */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-1">
            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                BILL TO
              </p>
              <p className="font-bold text-slate-900 text-sm">{clientName}</p>
              <p className="text-slate-700">Attn: {client?.fullName || "Tunde Adeyemi"}</p>
              <p className="text-slate-600">{client?.streetAddress || "14 Bourdillon Road, Ikoyi"}</p>
              <p className="text-slate-600">{client?.cityPostalCountry || "Lagos, Nigeria"}</p>
              <p className="text-slate-600 font-mono mt-0.5">Account {accountNumber || "ACC-30412"}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                REPRESENTATIVE
              </p>
              <p className="font-semibold text-slate-900 text-sm">{repName}</p>
              <p className="text-slate-700">{repEmail}</p>
              <p className="text-slate-600">{repPhone}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-2 pr-4 font-bold">DESCRIPTION</th>
                  <th className="py-2 px-4 font-bold w-32 whitespace-nowrap">DATE</th>
                  <th className="py-2 pl-4 text-right font-bold w-32 whitespace-nowrap">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                <tr className="align-top">
                  <td className="py-3 pr-4">
                    <p className="font-bold text-slate-900">
                      {booking.invoiceNumber?.includes("CONSOLIDATED")
                        ? "Consolidated Private Charter Flight & Revision Additions"
                        : "Private charter flight"}
                    </p>
                    <p className="text-slate-700 mt-0.5">
                      Leg 1 · {legOriginIcao} → {legDestIcao} ({legOriginCity} – {legDestCity}) · {categoryLabel} · {paxCount} passengers
                    </p>
                    <p className="text-slate-500 mt-0.5 font-mono text-[11px]">
                      {(booking as any).internalNotes || (booking as any).notes || `Per charter agreement ${agreementRef}`}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-slate-800 whitespace-nowrap font-mono">
                    {legFlightDate}
                  </td>
                  <td className="py-3 pl-4 text-right font-medium text-slate-900 font-mono whitespace-nowrap">
                    {formatDocCurrency(totalAmount, currency)}
                  </td>
                </tr>

                <tr className="align-top">
                  <td className="py-2.5 pr-4 text-slate-700">
                    <span className="font-semibold text-slate-900">VAT: </span>
                    <span className="text-[11px] text-slate-600">{company.vatWording || company.vatExemptionClause}</span>
                  </td>
                  <td className="py-2.5 px-4"></td>
                  <td className="py-2.5 pl-4 text-right font-medium text-slate-900 font-mono whitespace-nowrap">
                    {formatDocCurrency(0, currency)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total Due Row */}
            <div className="border-t border-slate-900 pt-3 mt-1 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-900">Total due</span>
              <span className="font-bold text-slate-900 text-base font-mono">
                {formatDocCurrency(totalAmount, currency)}
              </span>
            </div>
          </div>

          {/* Two Boxes: BANK TRANSFER & PAY BY CARD */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            {/* Left Box: Bank Transfer */}
            <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-2">
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1">
                BANK TRANSFER INSTRUCTIONS
              </p>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-24">BENEFICIARY</span>
                  <span className="font-bold text-slate-900 font-sans text-xs">
                    {bank.accountHolder || company.legalEntity}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-24">BANK</span>
                  <span className="text-slate-800 font-sans text-xs">
                    {bank.bankName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-24">IBAN</span>
                  <span className="text-slate-900 font-bold">
                    {bank.iban}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-24">BIC / SWIFT</span>
                  <span className="text-slate-900 font-bold">
                    {bank.bic}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-24">REFERENCE</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-1 py-0.5 rounded text-xs">
                    {invNumber}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 pt-1 font-sans">
                Please quote reference <span className="font-mono font-bold text-slate-700">{invNumber}</span> on your wire transfer for immediate reconciliation.
              </p>
            </div>

            {/* Right Box: Pay by Card */}
            <div className="border border-slate-200 rounded-lg p-4 bg-white flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
                  PAY BY CARD
                </p>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {formatDocCurrency(cardAmount, currency)} including {cardFeePercent}% card processing fee.
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  Instant settlement link:
                </p>
                <p className="text-xs text-blue-600 underline font-mono mt-0.5 break-all">
                  https://pay.orbelo.com/{invNumber}
                </p>
              </div>
              <p className="text-[10px] text-slate-500 mt-3 font-sans">
                Visa, MasterCard, and American Express accepted.
              </p>
            </div>
          </div>

          {/* Payment Status Bar */}
          <div className="pt-2 text-xs text-slate-800">
            <span className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mr-2">PAYMENT STATUS</span>
            {isPaid ? (
              <span className="text-slate-800">
                <strong className="text-emerald-700 font-bold">Paid in full</strong> · wire transfer received {contractDate || "12 Nov 2026"}
              </span>
            ) : (
              <span className="text-slate-800">
                <strong className="text-amber-700 font-bold">Pending payment</strong> · balance due prior to departure
              </span>
            )}
          </div>

          {/* Subtext Note */}
          <p className="text-[10.5px] text-slate-500 leading-relaxed pt-1">
            Additional services ordered after booking are invoiced separately under the same trip root reference. On request, all invoices for a trip can be combined into a consolidated statement.
          </p>
        </div>

        {/* Footer */}
        <DocumentFooter
          leftText={`${invNumber} · ${clientName}`}
          currentPage={1}
          totalPages={1}
        />
      </div>
    </div>
  );
}
