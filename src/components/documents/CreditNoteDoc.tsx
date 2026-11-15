"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import DocumentHeader from "./DocumentHeader";
import DocumentFooter from "./DocumentFooter";
import { formatDocCurrency } from "./QuotationDoc";

interface CreditNoteDocProps {
  booking: Booking;
}

export default function CreditNoteDoc({ booking }: CreditNoteDocProps) {
  const {
    client,
    pricing,
    tripNumber,
    accountNumber,
    contractDate
  } = booking;

  const creditNote = booking.creditNotes?.[0];
  const tripRef = tripNumber || "FE4578";
  const creditNoteNumber = creditNote?.creditNoteNumber || `CN-${tripRef}-01`;
  const againstInvoice = `INV-${tripRef}-02`;
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
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">TRIP</span>
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
              <p className="text-slate-700">Attn: {client?.fullName || "Tunde Adeyemi"}, Chairman</p>
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
                    <p className="font-bold text-slate-900">Credit against invoice {againstInvoice}</p>
                    <p className="text-slate-700 mt-0.5">
                      {creditNote?.reason || "VIP chauffeur on arrival, Geneva (LSGG), 20 Nov 2026"}
                    </p>
                  </td>
                  <td className="py-3 pl-4 text-right font-medium text-slate-900 font-mono whitespace-nowrap">
                    {formatDocCurrency(-creditAmount, currency)}
                  </td>
                </tr>

                <tr className="align-top">
                  <td className="py-2.5 pr-4 text-slate-700">
                    VAT <span className="bg-[#FEF3C7] text-[#92400E] px-1 py-0.5 rounded text-[10px]">[as on the original invoice]</span>
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
              <span className="font-bold text-slate-900 text-base font-mono">
                {formatDocCurrency(-creditAmount, currency)}
              </span>
            </div>
          </div>

          {/* TRIP BALANCE AFTER THIS CREDIT NOTE */}
          <div className="pt-2">
            <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
              TRIP BALANCE AFTER THIS CREDIT NOTE
            </h3>
            <div className="border-t border-b border-slate-200 divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-700">Invoiced · INV-{tripRef}-01, INV-{tripRef}-02</span>
                <span className="font-mono text-slate-900">{formatDocCurrency(8250, currency)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-700">Credited · {creditNoteNumber}</span>
                <span className="font-mono text-slate-900">{formatDocCurrency(-creditAmount, currency)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-700">Received</span>
                <span className="font-mono text-slate-900">{formatDocCurrency(-8000, currency)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center font-bold">
                <span className="text-slate-900">Balance</span>
                <span className="font-mono text-slate-900 text-sm">{formatDocCurrency(0, currency)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-700 mt-2.5">
              {againstInvoice} is now settled. No payment is due and no refund is owed.
            </p>
          </div>

          {/* Design Notes Callout Box */}
          <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 text-[11px] text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-900 mb-1">
              Design notes for the developer (not printed)
            </p>
            <p>
              The reason chosen in the app (here: Complimentary service) is internal and never printed. When the client has overpaid, the balance block ends with “Refund due to you: € …” and the refund method. Output options: credit note only, invoice for the remainder, or both.
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
