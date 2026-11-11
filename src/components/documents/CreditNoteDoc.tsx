"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import { RotateCcw } from "lucide-react";

interface CreditNoteDocProps {
  booking: Booking;
}

export default function CreditNoteDoc({ booking }: CreditNoteDocProps) {
  const { client, operator, pricing, tripNumber, invoiceNumber } = booking;
  const creditNote = booking.creditNotes?.[0];

  const creditNoteNumber = creditNote?.creditNoteNumber || creditNote?.number || `CR-${invoiceNumber || "00106020"}`;
  const creditDate = creditNote?.issueDate || creditNote?.date || new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const creditAmount = creditNote?.amount || 0;
  const netBalance = creditNote?.netBalance ?? 0;
  const displayedAdjustment = netBalance > 0
    ? (creditNote?.clientOwes ?? creditAmount)
    : -(creditNote?.weOweClient ?? creditAmount);
  const adjustmentColor = displayedAdjustment > 0 ? "text-amber-800" : "text-red-700";

  return (
    <div className="credit-note-document text-gray-900 bg-transparent font-sans max-w-[850px] mx-auto">
      <div className="doc-page min-h-[1050px] bg-white p-8 sm:p-10 rounded-sm shadow-xl border border-gray-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 uppercase">
                Credit Note / Gutschrift
              </h1>
              <p className="text-xs font-semibold text-gold tracking-widest uppercase">
                Official Commercial Credit Adjustment [DOC-1 & DOC-3]
              </p>
            </div>
            <div className="text-right">
              <span className="font-display text-3xl font-black tracking-tight" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Finance & Accounting</p>
            </div>
          </div>

          {/* Party Details: BUYER | SELLER | DETAILS */}
          <div className="grid grid-cols-3 gap-6 py-4 border-b border-gray-200 text-xs mb-6">
            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 text-[11px] border-b border-gray-300 pb-0.5">Buyer / Client</p>
              <p className="font-semibold text-gray-900">{client.fullName}</p>
              {client.companyName && <p className="text-gray-700">{client.companyName}</p>}
              <p className="text-gray-600">{client.streetAddress}</p>
              <p className="text-gray-600">{client.cityPostalCountry}</p>
              {client.vatNumber && <p className="text-gray-500 mt-1">Tax ID: {client.vatNumber}</p>}
            </div>

            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 text-[11px] border-b border-gray-300 pb-0.5">Seller (Contracting Entity)</p>
              <p className="font-semibold text-gray-900">{operator.companyName}</p>
              <p className="text-gray-700">{operator.representativeName}</p>
              <p className="text-blue-700 font-medium">{operator.supportEmail}</p>
              <p className="text-gray-600">{operator.supportPhone}</p>
              <p className="text-gray-500 mt-1">VAT ID: {operator.vatNumber}</p>
            </div>

            <div>
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 text-[11px] border-b border-gray-300 pb-0.5">Credit Details</p>
              <div className="grid grid-cols-2 gap-y-1">
                <span className="text-gray-500">Credit Note No.:</span>
                <span className="font-bold text-red-700 font-mono">{creditNoteNumber}</span>
                <span className="text-gray-500">Date of Credit:</span>
                <span className="font-medium text-gray-900">{creditDate}</span>
                <span className="text-gray-500">Original Invoice:</span>
                <span className="font-mono text-gray-900">{invoiceNumber || "Not issued"}</span>
                <span className="text-gray-500">Trip No.:</span>
                <span className="font-bold text-gray-900 font-mono">{tripNumber}</span>
              </div>
            </div>
          </div>

          {/* Credit Reason & Details */}
          <div className="mb-6 bg-red-50/60 border border-red-200 p-4 rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-900 mb-1 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Reason for Credit Adjustment
            </h3>
            <p className="text-xs text-red-800">
              {creditNote?.reason || "No price adjustment has been recorded for this booking iteration."}
            </p>
          </div>

          {/* Line Item Table */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Credit Adjustment Items
            </h3>
            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-gray-100 text-gray-700 font-semibold text-[11px]">
                <tr>
                  <th className="p-2 border-b">Item</th>
                  <th className="p-2 border-b">Description</th>
                  <th className="p-2 border-b">VAT Rate</th>
                  <th className="p-2 border-b text-right">Adjustment Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-2 font-mono font-bold text-gray-700">1</td>
                  <td className="p-2 font-medium text-gray-900">
                    {creditNote?.reason || "No booking adjustment recorded"}
                  </td>
                  <td className="p-2 font-mono text-gray-500">0% (VAT free §6 Abs. 1 Zif. 3 UStG)</td>
                  <td className={`p-2 text-right font-mono font-bold ${adjustmentColor}`}>
                    {formatCurrency(displayedAdjustment, pricing.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Box */}
          <div className="flex justify-end mb-6">
            <div className="w-80 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-600">Net Adjustment</span>
                <span className={`font-mono font-bold ${adjustmentColor}`}>{formatCurrency(displayedAdjustment, pricing.currency)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 text-gray-500 text-[11px]">
                <span>VAT (0%)</span>
                <span className="font-mono">{formatCurrency(0, pricing.currency)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-900 font-extrabold text-sm text-gray-900 bg-red-100/50 px-2 rounded">
                <span>BOOKING ADJUSTMENT</span>
                <span className={`font-mono ${adjustmentColor}`}>{formatCurrency(displayedAdjustment, pricing.currency)}</span>
              </div>
            </div>
          </div>

          {/* Legal Compliance Text */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-500 space-y-1">
            <p className="font-bold text-gray-700">Aviation Commercial Billing & Credit Adjustment Compliance</p>
            <p>
              This credit note is issued pursuant to standard international air charter commercial accounting regulations and EU Council Directive 2006/112/EC. Invoicing entity is {operator.legalEntity}. All sequential credit references are strictly auditable with verified financial audit trail.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">{operator.companyName} • Executive Finance & Treasury</p>
            <p>London Biggin Hill (EGKB) • Geneva (LSGG) • VAT: {operator.vatNumber}</p>
            <p>{operator.commercialRegistry} • Jurisdiction: {operator.courtOfJurisdiction}</p>
          </div>
          <div className="text-right">
            <p>Document: Credit Note</p>
            <p className="font-mono font-medium text-gray-700">{creditNoteNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
