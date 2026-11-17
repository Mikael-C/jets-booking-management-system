"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { useAviation } from "@/lib/aviationContext";
import { initialSettings } from "@/data/initialSettings";
import DocumentHeader from "./DocumentHeader";
import DocumentFooter from "./DocumentFooter";
import { formatDocCurrency } from "./QuotationDoc";

interface CreditNoteDocProps {
  booking: Booking;
}

export default function CreditNoteDoc({ booking }: CreditNoteDocProps) {
  const { settings } = useAviation();
  const company = settings?.company || initialSettings.company;

  const {
    client,
    pricing,
    tripNumber,
    accountNumber,
    contractDate
  } = booking;

  const creditNote = booking.creditNotes?.[0];
  const tripRef = (tripNumber || "FE4578").split("-")[0];
  const creditNoteNumber = creditNote?.creditNoteNumber || `CN-${tripRef}-01`;
  const againstInvoice = `INV-${tripRef}-01`;
  const currency = pricing?.currency || "EUR";
  const creditAmount = creditNote?.amount || 250;
  const clientName = client?.companyName || client?.fullName || "Adeyemi Holdings Ltd";

  const repName = booking.agentName || "Marcus Vance";
  const repEmail = booking.agentEmail || "marcus@vanceaviation.co.uk";
  const repPhone = "+44 20 7946 0912";

  return (
    <div className="credit-note-document text-slate-900 bg-transparent font-sans max-w-[820px] mx-auto select-none print:max-w-none">
      {/* ================= PAGE 1: CREDIT NOTE ================= */}
      <div className="doc-page min-h-[1123px] bg-white p-10 sm:p-12 rounded-sm shadow-xl border border-slate-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between box-border">
        <div className="space-y-6">
          <DocumentHeader booking={booking} />

          {/* Title & Credit Note Meta */}
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Credit note
            </h1>
            <div className="text-right text-xs space-y-1">
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">CREDIT NOTE</span>
                <span className="font-semibold text-slate-900 font-mono w-40 text-right">{creditNoteNumber}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">AGAINST INVOICE</span>
                <span className="font-semibold text-slate-900 font-mono w-40 text-right">{againstInvoice}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">TRIP ROOT</span>
                <span className="font-semibold text-slate-900 font-mono w-40 text-right">{tripRef}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">ISSUE DATE</span>
                <span className="font-medium text-slate-900 w-40 text-right">{contractDate || "15 Nov 2026"}</span>
              </div>
            </div>
          </div>

          {/* Issued To & Representative */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-1">
            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                ISSUED TO
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

          {/* Description & Amount Table */}
          <div className="pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-2 pr-4 font-bold">DESCRIPTION</th>
                  <th className="py-2 pl-4 text-right font-bold w-36 whitespace-nowrap">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                <tr className="align-top">
                  <td className="py-3 pr-4">
                    <p className="font-bold text-slate-900">Commercial credit adjustment</p>
                    <p className="text-slate-700 mt-0.5">
                      Credit applied against Invoice {againstInvoice} (Trip Reference {tripRef})
                    </p>
                  </td>
                  <td className="py-3 pl-4 text-right font-medium text-slate-900 font-mono whitespace-nowrap">
                    {formatDocCurrency(-creditAmount, currency)}
                  </td>
                </tr>

                <tr className="align-top">
                  <td className="py-2.5 pr-4 text-slate-700">
                    <span className="font-semibold text-slate-900">VAT: </span>
                    <span className="text-[11px] text-slate-600">{company.vatWording || company.vatExemptionClause}</span>
                  </td>
                  <td className="py-2.5 pl-4 text-right font-medium text-slate-900 font-mono whitespace-nowrap">
                    {formatDocCurrency(0, currency)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total Credited */}
            <div className="border-t border-slate-900 pt-3 mt-1 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-900">Total credited</span>
              <span className="font-bold text-rose-700 text-base font-mono">
                {formatDocCurrency(-creditAmount, currency)}
              </span>
            </div>
          </div>

          {/* TRIP BALANCE AFTER THIS CREDIT NOTE */}
          <div className="pt-2">
            <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
              TRIP LEDGER SUMMARY AFTER THIS CREDIT NOTE
            </h3>
            <div className="border-t border-b border-slate-200 divide-y divide-slate-100 text-xs font-mono">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-700 font-sans">Original Invoiced Amount ({againstInvoice})</span>
                <span className="text-slate-900">{formatDocCurrency(booking.pricing.totalFlightPrice, currency)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-700 font-sans">Total Credited ({creditNoteNumber})</span>
                <span className="text-rose-700 font-bold">{formatDocCurrency(-creditAmount, currency)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-700 font-sans">Adjusted Net Payable</span>
                <span className="text-slate-900 font-bold">
                  {formatDocCurrency(booking.pricing.totalFlightPrice - creditAmount, currency)}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2.5 font-sans leading-relaxed">
              This credit note has been applied to the client account. If payment was already received in full, the balance may be retained as flight credit or refunded upon written instruction.
            </p>
          </div>
        </div>

        {/* Footer */}
        <DocumentFooter
          leftText={`${creditNoteNumber} · ${clientName}`}
          currentPage={1}
          totalPages={1}
        />
      </div>
    </div>
  );
}
