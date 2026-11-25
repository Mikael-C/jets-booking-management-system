"use client";

import React from "react";
import type { Booking } from "@/types/aviation";
import { docMoney, docTaxes } from "@/lib/documentData";
import { AmountRow, Ph } from "./docKit";

/**
 * Tax lines on the quote and the agreement (R-091): one line per country and rate, plus the exemption wording.
 * Quotes saved before the tax table print the single VAT line with the wording from Settings.
 */
export default function TaxRows({ booking, vat, currency, fallbackWording }: { booking: Booking; vat: number; currency: string; fallbackWording?: string }) {
  const taxes = docTaxes(booking);
  if (!taxes) {
    return (
      <AmountRow
        label={
          <>
            VAT · <Ph value={fallbackWording} label="rate and exemption text per tax advice" className="text-[12px]" />
          </>
        }
        amount={docMoney(vat, currency)}
        border="dark"
      />
    );
  }
  const wording = taxes.wordings.join(" ");
  if (taxes.lines.length === 0) {
    return <AmountRow label={<>Tax · {wording || "none charged"}</>} amount={docMoney(0, currency)} border="dark" />;
  }
  return (
    <>
      {taxes.lines.map((t, i) => (
        <AmountRow
          key={`${t.label}-${t.rateLabel}`}
          label={`${t.label} · ${t.rateLabel}`}
          amount={docMoney(t.amount, currency)}
          border={i === taxes.lines.length - 1 && !wording ? "dark" : "light"}
        />
      ))}
      {wording && (
        <div className="px-[6px] py-[6px] border-b-2 border-[#111827] text-[11.5px] text-[#4B5563]">{wording}</div>
      )}
    </>
  );
}
