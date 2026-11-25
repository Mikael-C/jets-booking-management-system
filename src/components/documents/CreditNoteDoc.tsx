"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { useAviation } from "@/lib/aviationContext";
import { clientParty, docMoney, fmtDate, representative, round2, tripNo } from "@/lib/documentData";
import { AmountRow, DocPage, Letterhead, PartyBlock, RepBlock, Section, TitleBlock, thCls, useDocSettings, useLedger } from "./docKit";

interface CreditNoteDocProps {
  booking: Booking;
}

export default function CreditNoteDoc({ booking }: CreditNoteDocProps) {
  const settings = useDocSettings();
  const { users } = useAviation() as any;
  const { ledger, state } = useLedger(booking.id);
  const party = clientParty(booking);
  const rep = representative(booking, users || [], settings.company);

  // The credit note asked for (first on the booking passed in), as saved in the trip ledger
  const asked: any = (booking.creditNotes || [])[0] || {};
  const askedNumber = asked.number || asked.creditNoteNumber || "";
  const notes: any[] = ledger?.creditNotes || [];
  const note = notes.find((n) => n.number === askedNumber) || (askedNumber ? null : notes[notes.length - 1]) || null;
  const number = note?.number || askedNumber;
  const amount = round2(note ? note.amount : Math.abs(Number(asked.amount) || 0));
  const isCharge = note ? note.direction === "charge" : false;
  const against = note?.against || asked.appliesTo || asked.against || "";
  const issued = note?.issuedAt || asked.issuedAt || asked.issueDate;
  const currency = ledger?.currency || booking.pricing?.currency || "EUR";

  const invoices: any[] = (ledger?.invoices || []).filter((i: any) => !["combined", "void"].includes(i.status));
  const againstInv = (ledger?.invoices || []).find((i: any) => i.number === against);
  const againstLine = againstInv
    ? againstInv.kind === "charter" || /^charter/i.test(againstInv.line || "")
      ? String(againstInv.line || "Charter").replace(/^Charter · /, "Private charter flight · ")
      : String(againstInv.line || againstInv.purpose || "").replace(/^Additional service · /i, "")
    : "";

  // Trip balance including every credit note up to and including this one
  const issuedTime = issued ? new Date(issued).getTime() || Infinity : Infinity;
  const creditsSoFar = notes.filter((n) => n.direction === "credit" && (n.number === number || (new Date(n.issuedAt || 0).getTime() || 0) <= issuedTime));
  const charges = notes.filter((n) => n.direction === "charge");
  const invoiced = round2(invoices.reduce((s, i) => s + i.amount, 0) + charges.reduce((s, n) => s + n.amount, 0));
  const credited = round2(creditsSoFar.reduce((s, n) => s + n.amount, 0));
  const receivedPayments: any[] = (ledger?.payments || []).filter((p: any) => p.status === "received");
  const received = round2(receivedPayments.reduce((s, p) => s + p.amount, 0));
  const balance = round2(invoiced - credited - received);
  const againstOpen = againstInv ? round2(againstInv.open) : null;
  const lastMethod = receivedPayments.length ? receivedPayments[receivedPayments.length - 1].method : "";

  let closing = "";
  if (ledger) {
    if (balance < -0.005)
      closing = `Refund due to you: ${docMoney(-balance, currency)}, paid back by ${lastMethod === "card" ? "card refund" : "bank transfer to the account you paid from"}.`;
    else if (balance > 0.005) closing = `Balance still to pay on this trip: ${docMoney(balance, currency)}.`;
    else closing = `${against && againstOpen !== null && againstOpen <= 0.005 ? `${against} is now settled. ` : ""}No payment is due and no refund is owed.`;
  }

  return (
    <div className="credit-note-document bg-transparent select-none print:max-w-none">
      <DocPage footerLeft={`${number} · ${party.name}`} page={1} pages={1}>
        <Letterhead />
        <TitleBlock
          title="Credit note"
          meta={[
            { label: "Credit note", value: number, mono: true },
            ...(against ? [{ label: "Against invoice", value: against, mono: true }] : []),
            { label: "Trip", value: tripNo(booking), mono: true },
            { label: "Issue date", value: fmtDate(issued) }
          ]}
        />

        <div className="grid grid-cols-2 gap-10 mb-6">
          <PartyBlock label="Issued to" party={party} />
          <RepBlock label="Representative" rep={rep} />
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-[#111827]">
              <th className={thCls}>Description</th>
              <th className={`${thCls} text-right w-[180px]`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#E5E7EB] align-top">
              <td className="py-[8px] px-[6px]">
                {isCharge ? (
                  <>
                    <strong>Charge</strong> · {note?.internalNote || note?.reasonCategory || "Additional service"}
                  </>
                ) : (
                  <>
                    <strong>Credit</strong> {against ? `against invoice ${against}` : "on this trip"}
                    {againstLine && <div>{againstLine}</div>}
                  </>
                )}
              </td>
              <td className="py-[8px] px-[6px] text-right whitespace-nowrap">{docMoney(isCharge ? amount : -amount, currency)}</td>
            </tr>
            <tr className="border-b border-[#E5E7EB]">
              <td className="py-[8px] px-[6px]">VAT · as on the original invoice</td>
              <td className="py-[8px] px-[6px] text-right">{docMoney(0, currency)}</td>
            </tr>
            <tr className="border-b-2 border-[#111827] border-t-2">
              <td className="py-[9px] px-[6px] font-bold">{isCharge ? "Total charged" : "Total credited"}</td>
              <td className="py-[9px] px-[6px] text-right font-bold text-[16px] whitespace-nowrap">{docMoney(isCharge ? amount : -amount, currency)}</td>
            </tr>
          </tbody>
        </table>

        <Section className="mt-8 mb-2">Trip balance after this credit note</Section>
        {!ledger ? (
          <p className="text-[#6B7280]">{state === "loading" ? "Loading the trip balance…" : "The trip balance could not be loaded."}</p>
        ) : (
          <>
            <AmountRow label={`Invoiced${invoices.length ? ` · ${invoices.map((i) => i.number).join(", ")}` : ""}`} amount={docMoney(invoiced, currency)} />
            <AmountRow label={`Credited${creditsSoFar.length ? ` · ${creditsSoFar.map((n) => n.number).join(", ")}` : ""}`} amount={docMoney(-credited, currency)} />
            <AmountRow label="Received" amount={docMoney(-received, currency)} />
            <AmountRow label="Balance" amount={docMoney(balance, currency)} bold />
            <p className="mt-5">{closing}</p>
          </>
        )}
      </DocPage>
    </div>
  );
}
