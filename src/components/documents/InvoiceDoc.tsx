"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { useAviation } from "@/lib/aviationContext";
import {
  agreementNo,
  cityOf,
  clientParty,
  docMoney,
  fmtDate,
  legAircraft,
  representative,
  round2,
  tripNo,
  tripToken,
  versionOf
} from "@/lib/documentData";
import { DocPage, Label, Letterhead, PartyBlock, Ph, RepBlock, TitleBlock, mono, thCls, useDocSettings, useLedger } from "./docKit";

interface InvoiceDocProps {
  booking: Booking;
}

const METHOD: Record<string, string> = { bank_transfer: "bank transfer", card: "card payment" };

export default function InvoiceDoc({ booking }: InvoiceDocProps) {
  const settings = useDocSettings();
  const { users } = useAviation() as any;
  const company = settings.company;
  const cardFee = settings.pricing?.cardFeePercent ?? 3.5;
  const { ledger, state } = useLedger(booking.id);
  const party = clientParty(booking);
  const rep = representative(booking, users || [], company);

  // The invoice: the one asked for (or the trip's charter invoice), with its payments
  const invoices: any[] = ledger?.invoices || [];
  const wanted = booking.invoiceNumber && /^INV-/i.test(booking.invoiceNumber) ? booking.invoiceNumber : "";
  const inv =
    invoices.find((i) => i.number === wanted) ||
    (!wanted ? invoices.find((i) => i.kind === "charter" && !["combined", "void"].includes(i.status)) || invoices[0] : undefined);
  const currency = inv?.currency || ledger?.currency || booking.pricing?.currency || "EUR";
  const number = inv?.number || wanted || `INV-${tripToken(booking)}-${versionOf(booking)}-1`;
  const amount = round2(inv ? inv.amount : booking.pricing?.totalFlightPrice);
  const isCharter = inv ? inv.kind === "charter" || /^charter/i.test(inv.line || "") : true;
  const isCombined = Array.isArray(inv?.combinedFrom) && inv.combinedFrom.length > 0;
  const payments: any[] = (ledger?.payments || []).filter((p: any) => p.invoiceNumber === number);
  const received = payments.filter((p) => p.status === "received");
  const lastReceived = received[received.length - 1];
  const credits: any[] = (ledger?.creditNotes || []).filter((n: any) => n.direction === "credit" && n.against === number);

  const bank = (settings.bankAccounts || []).find((b) => b.currency === currency && b.isDefault) || (settings.bankAccounts || []).find((b) => b.currency === currency) || (settings.bankAccounts || [])[0];
  const legs = (booking.legs || []).filter((l) => !l.isCancelled);
  const firstLeg = legs[0];
  const cardAmount = round2(amount * (1 + cardFee / 100));
  const payLink = inv?.paymentLink?.url ? String(inv.paymentLink.url).replace(/^https?:\/\//, "") : "";

  // Payment status line
  let status: { text: string; tone: string; rest: string };
  const st = inv?.status || (booking.paymentStatus === "fully_paid" ? "paid" : "unpaid");
  if (st === "paid") {
    status = {
      text: "Paid in full",
      tone: "text-[#15803D]",
      rest: lastReceived
        ? ` · ${METHOD[lastReceived.method] || "payment"} received ${fmtDate(lastReceived.receivedAt || lastReceived.createdAt)}${lastReceived.reference ? ` · ref ${lastReceived.reference}` : ""}`
        : credits.length
          ? ` · settled by ${credits.map((c) => c.number).join(", ")}`
          : ""
    };
  } else if (st === "credited") status = { text: "Credited", tone: "text-[#4B5563]", rest: credits.length ? ` · ${credits.map((c) => c.number).join(", ")}` : "" };
  else if (st === "combined") status = { text: "Combined", tone: "text-[#4B5563]", rest: " · replaced by a combined invoice" };
  else if (st === "proof_uploaded") status = { text: "Transfer proof received", tone: "text-[#B45309]", rest: " · being confirmed" };
  else if (st === "part_paid")
    status = { text: "Part paid", tone: "text-[#B45309]", rest: ` · ${docMoney(inv?.paid || 0, currency)} received · ${docMoney(inv?.open || 0, currency)} open` };
  else if (st === "overdue") status = { text: "Overdue", tone: "text-[#B91C1C]", rest: inv?.dueDate ? ` · was due ${fmtDate(inv.dueDate)}` : "" };
  else status = { text: "Open", tone: "text-[#B45309]", rest: inv?.dueDate ? ` · due ${fmtDate(inv.dueDate)}` : "" };

  const due = inv?.dueDate ? `${isCharter ? "Before departure, " : ""}${fmtDate(inv.dueDate)}` : booking.paymentDueDate || "";
  const lineParts = String(inv?.line || "").split(" · ");

  return (
    <div className="invoice-document bg-transparent select-none print:max-w-none">
      <DocPage footerLeft={`${number} · ${party.name}`} page={1} pages={1}>
        <Letterhead />
        <TitleBlock
          title="Invoice"
          meta={[
            { label: "Invoice", value: number, mono: true },
            { label: "Trip", value: tripNo(booking), mono: true },
            { label: "Issue date", value: fmtDate(inv?.issuedAt || booking.contractDate || booking.createdAt) || <Ph label="date" /> },
            { label: "Due", value: due || <Ph label="due date" /> }
          ]}
        />

        <div className="grid grid-cols-2 gap-10 mb-6">
          <PartyBlock label="Bill to" party={party} />
          <RepBlock label="Representative" rep={rep} />
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-[#111827]">
              <th className={thCls}>Description</th>
              <th className={`${thCls} w-[150px]`}>Date</th>
              <th className={`${thCls} text-right w-[140px]`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#E5E7EB] align-top">
              <td className="py-[8px] px-[6px]">
                {isCombined ? (
                  <>
                    <div className="font-bold">Combined invoice</div>
                    <div>Replaces {inv.combinedFrom.join(", ")}</div>
                  </>
                ) : isCharter ? (
                  <>
                    <div className="font-bold">Private charter flight</div>
                    {legs.map((l, i) => {
                      const ac = legAircraft(booking, l, i);
                      const pax = l.paxCount || l.passengers?.length || 0;
                      return (
                        <div key={i}>
                          Leg {l.legNumber || i + 1} · {l.origin?.icao} → {l.destination?.icao} {cityOf(l.origin)} – {cityOf(l.destination)}
                          {ac.category ? ` · ${ac.category}` : ""}
                          {pax ? ` · ${pax} passenger${pax === 1 ? "" : "s"}` : ""}
                        </div>
                      );
                    })}
                    <div className="text-[#4B5563]">Per charter agreement {agreementNo(booking)}</div>
                  </>
                ) : (
                  <>
                    <div className="font-bold">{lineParts[0] || inv?.purpose || "Additional service"}</div>
                    {lineParts.length > 1 && <div>{lineParts.slice(1).join(" · ")}</div>}
                    <div className="text-[#4B5563]">Trip {tripNo(booking)}</div>
                  </>
                )}
              </td>
              <td className="py-[8px] px-[6px] whitespace-nowrap">{fmtDate(isCharter ? firstLeg?.flightDate : inv?.issuedAt)}</td>
              <td className="py-[8px] px-[6px] text-right whitespace-nowrap">{docMoney(amount, currency)}</td>
            </tr>
            <tr className="border-b-2 border-[#111827]">
              <td className="py-[8px] px-[6px]" colSpan={2}>
                VAT <Ph value={company.vatExemptionClause} label="rate and exemption text per tax advice" className="text-[12px]" />
              </td>
              <td className="py-[8px] px-[6px] text-right">{docMoney(0, currency)}</td>
            </tr>
            <tr className="border-b-2 border-[#111827]">
              <td className="py-[9px] px-[6px] font-bold" colSpan={2}>
                Total due
              </td>
              <td className="py-[9px] px-[6px] text-right font-bold text-[16px] whitespace-nowrap">{docMoney(amount, currency)}</td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-[1fr_0.77fr] gap-5 mt-5">
          <div className="border border-[#D1D5DB] rounded-[10px] p-4">
            <div className="text-[13px] font-bold tracking-[0.08em] uppercase mb-3">Bank transfer</div>
            <div className="grid grid-cols-[110px_1fr] gap-y-[6px] items-center">
              <Label>Beneficiary</Label>
              <span>
                <Ph value={bank?.accountHolder || company.legalEntity} label="Company legal name" />
              </span>
              <Label>Bank</Label>
              <span>
                <Ph value={bank?.bankName} label="Bank name" />
              </span>
              <Label>IBAN</Label>
              <span className={mono}>
                <Ph value={bank?.iban} label="IBAN" />
              </span>
              <Label>BIC</Label>
              <span className={mono}>
                <Ph value={bank?.bic} label="BIC" />
              </span>
              <Label>Reference</Label>
              <span className={`${mono} font-bold`}>{number}</span>
            </div>
          </div>
          <div className="border border-[#D1D5DB] rounded-[10px] p-4">
            <div className="text-[13px] font-bold tracking-[0.08em] uppercase mb-3">Pay by card</div>
            <div>
              {docMoney(cardAmount, currency)} including {cardFee} % card fee.
            </div>
            {payLink ? (
              <>
                <div className="mt-1">Secure payment link:</div>
                <div className={`${mono} text-[12px] break-all`}>{payLink}</div>
              </>
            ) : (
              <div className="mt-1 text-[#4B5563]">Ask your representative for a secure payment link.</div>
            )}
          </div>
        </div>

        <div className="border-t border-[#D1D5DB] mt-5 pt-3 flex gap-6 items-baseline">
          <Label>Payment status</Label>
          <div>
            {state === "loading" && !ledger ? (
              <span className="text-[#6B7280]">Checking…</span>
            ) : (
              <>
                <span className={`font-bold ${status.tone}`}>{status.text}</span>
                {status.rest}
              </>
            )}
          </div>
        </div>

        <p className="text-[12px] text-[#4B5563] mt-5">
          Additional services ordered after booking are invoiced separately with the same trip reference. On request, all invoices for a trip can be
          combined into one.
        </p>
      </DocPage>
    </div>
  );
}
