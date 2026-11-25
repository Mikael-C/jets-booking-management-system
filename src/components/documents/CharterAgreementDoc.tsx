"use client";

import React from "react";
import { Booking, CancellationFeeStep } from "@/types/aviation";
import { agreementNo, clientParty, docMoney, documentPricing, fmtDate, fmtDay, legAircraft, legTiming, legsWord, quoteNo } from "@/lib/documentData";
import { AmountRow, DocPage, Label, Letterhead, PartyBlock, Ph, Section, TitleBlock, thCls, useDocSettings } from "./docKit";

interface CharterAgreementDocProps {
  booking: Booking;
}

/** "More than 14 days", "7 to 14 days", "48 hours to 7 days", "Less than 48 hours, or no-show" */
function noticeText(s: CancellationFeeStep): string {
  const unit = (d: number) => (d > 0 && d <= 3 ? `${d * 24} hours` : `${d} days`);
  const min = Number(s.daysPriorMin) || 0;
  const max = s.daysPriorMax === null || s.daysPriorMax === undefined ? null : Number(s.daysPriorMax);
  if (max === null) return `More than ${unit(min)}`;
  if (min <= 0) return `Less than ${unit(max)}, or no-show`;
  return `${unit(min)} to ${unit(max)}`;
}

export default function CharterAgreementDoc({ booking }: CharterAgreementDocProps) {
  const settings = useDocSettings();
  const company = settings.company;
  const cardFee = settings.pricing?.cardFeePercent ?? 3.5;
  const policy = (settings.cancellationPolicy || []).slice().sort((a, b) => (b.daysPriorMin || 0) - (a.daysPriorMin || 0));
  const terms = (settings.termsVersions || []).find((t) => t.isActive) || (settings.termsVersions || [])[0];
  const pricing = documentPricing(booking, cardFee);
  const cur = pricing.currency;
  const party = clientParty(booking);
  const number = agreementNo(booking);
  const signed = Boolean(booking.isContractSigned || booking.isBooked);
  const signedDate = fmtDate(booking.contractSignedDate || (signed ? booking.contractDate : ""));
  const date = fmtDate(booking.contractDate || (booking as any).quoteSentAt || booking.createdAt);
  const footer = `${number} · ${party.name}`;
  const docsHours = (settings as any).documents?.passengerDocsDeadlineHours;
  const paymentTerms = (settings as any).documents?.paymentTerms || booking.paymentDueDate || "";
  const legNums = pricing.legs.map((l) => l.legNumber);
  const signer =
    booking.signsAgreement === "assistant" && (booking.paName || booking.client?.paName)
      ? booking.paName || booking.client?.paName || ""
      : party.attn;
  const brokerSignatory = [company.representativeName, company.signatoryTitle].filter(Boolean).join(", ");

  return (
    <div className="charter-agreement-document bg-transparent select-none print:max-w-none">
      {/* ───────── Page 1 ───────── */}
      <DocPage footerLeft={footer} page={1} pages={2}>
        <Letterhead />
        <TitleBlock
          title="Charter agreement"
          meta={[
            { label: "Agreement", value: number, mono: true },
            { label: "Based on quote", value: quoteNo(booking), mono: true },
            { label: "Date", value: date || <Ph label="date" /> },
            { label: "Status", value: signed ? `Signed${signedDate ? ` ${signedDate}` : ""}` : booking.isCancelled ? "Cancelled" : "For signature" }
          ]}
        />

        <div className="grid grid-cols-2 gap-10 mb-6">
          <PartyBlock label="The client" party={party} />
          <div>
            <Label className="mb-2">The broker</Label>
            <div>
              <Ph value={company.legalEntity} label="Company legal name" />, acting as charter broker and contracting party with the client, arranging the
              flights with an approved air operator (the operating carrier).
            </div>
            <div>
              <Ph value={[company.address, company.registrationNumber].filter(Boolean).join(" · ")} label="Registered address · Company no." />
            </div>
          </div>
        </div>

        <Section className="mb-2">1 · Flights and aircraft</Section>
        <table className="w-full border-collapse mb-2">
          <thead>
            <tr className="border-b-2 border-[#111827]">
              <th className={`${thCls} w-[40px]`}>Leg</th>
              <th className={thCls}>Date · route · departs</th>
              <th className={thCls}>Aircraft</th>
              <th className={`${thCls} text-right w-[50px]`}>Pax</th>
              <th className={`${thCls} text-right`}>Charter price</th>
            </tr>
          </thead>
          <tbody>
            {pricing.legs.map(({ leg, index, legNumber, price }) => {
              const ac = legAircraft(booking, leg, index);
              const t = legTiming(leg, booking.aircraft);
              const specs = [ac.built || "—", ac.refurbished || "—", ac.seats ? `${ac.seats} seats` : "", ac.lavatoryShort, ac.smoking.toLowerCase()].filter(Boolean).join(" · ");
              return (
                <tr key={`${legNumber}-${index}`} className="border-b border-[#E5E7EB] align-top">
                  <td className="py-[8px] px-[6px]">{legNumber}</td>
                  <td className="py-[8px] px-[6px] whitespace-nowrap">
                    <div>{fmtDay(leg.flightDate, true)}</div>
                    <div>
                      {leg.origin?.icao} → {leg.destination?.icao}
                      {t.dep ? ` · ${t.dep} LT` : ""}
                    </div>
                  </td>
                  <td className="py-[8px] px-[6px]">
                    <div className="font-bold">{ac.name || <Ph label="Aircraft" />}</div>
                    <div className="text-[11.5px] text-[#4B5563]">{specs}</div>
                  </td>
                  <td className="py-[8px] px-[6px] text-right">{leg.paxCount || leg.passengers?.length || ""}</td>
                  <td className="py-[8px] px-[6px] text-right whitespace-nowrap">{docMoney(price, cur)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[11.5px] text-[#4B5563] mt-0 mb-6">
          Each leg is operated by an approved AOC holder (the operating carrier). An aircraft of the same category and standard may be substituted by the
          operating carrier; the client is told before departure.
        </p>

        <Section className="mb-2">2 · Price and payment</Section>
        <div className="mb-6">
          <AmountRow label={`Charter price · ${legsWord(legNums)} (as above)`} amount={docMoney(pricing.charterTotal, cur)} />
          {pricing.passengerFees.map((f, i) => (
            <AmountRow key={`f-${i}`} label={f.label} amount={docMoney(f.amount, cur)} />
          ))}
          {pricing.services.map((s, i) => (
            <AmountRow key={`s-${i}`} label={s.label} amount={s.included ? "Included" : docMoney(s.amount, cur)} />
          ))}
          {pricing.vat > 0 && <AmountRow label="VAT" amount={docMoney(pricing.vat, cur)} />}
          <AmountRow label="Total" amount={docMoney(pricing.total, cur)} bold />
          <AmountRow
            label="Payment due"
            amount={<Ph value={paymentTerms} label="e.g. 100 % on signature, and in all cases before departure" />}
          />
          <AmountRow label="Method" amount={`Bank transfer, or card with ${cardFee} % fee`} />
        </div>

        <Section className="mb-2">3 · Cancellation by the client</Section>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-[#111827]">
              <th className={thCls}>Notice before first departure</th>
              <th className={`${thCls} text-right`}>Cancellation fee</th>
            </tr>
          </thead>
          <tbody>
            {policy.length > 0
              ? policy.map((s) => (
                  <tr key={s.id} className="border-b border-[#E5E7EB]">
                    <td className="py-[7px] px-[6px]">{noticeText(s)}</td>
                    <td className="py-[7px] px-[6px] text-right">{s.feePercentage} %</td>
                  </tr>
                ))
              : ["More than ... days", "... to ... days", "Less than ... hours, or no-show"].map((t, i) => (
                  <tr key={t} className="border-b border-[#E5E7EB]">
                    <td className="py-[7px] px-[6px]">
                      <Ph label={t} />
                    </td>
                    <td className="py-[7px] px-[6px] text-right">
                      <Ph label={i === 2 ? "100 %" : "... %"} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {policy.length === 0 && <p className="text-[11.5px] text-[#4B5563] mt-1.5 mb-0">Placeholder until the cancellation policy is set in Settings.</p>}

        <Section className="mt-6 mb-2">4 · Passengers and documents</Section>
        <p className="m-0">
          The client provides full names and valid travel documents for every passenger, and pet passports where pets travel, no later than{" "}
          <Ph value={docsHours ? `${docsHours} hours` : ""} label="48 hours" /> before departure. Luggage beyond what is stated in the quotation may not fit
          the aircraft.
        </p>
      </DocPage>

      {/* ───────── Page 2 ───────── */}
      <DocPage footerLeft={footer} page={2} pages={2}>
        <Letterhead />
        <Section className="mb-3">5 · Terms and conditions</Section>
        <div className="border-2 border-dashed border-[#C9A24A] rounded-[10px] px-5 py-4 min-h-[420px] text-[12.5px] leading-relaxed">
          {terms && terms.fullText ? (
            <>
              <div className="text-[11px] text-[#4B5563] mb-3">
                {terms.title || "Terms and conditions"} · version {terms.version}
                {terms.effectiveDate ? ` · effective ${fmtDate(terms.effectiveDate)}` : ""}
              </div>
              <div className="whitespace-pre-line">{terms.fullText}</div>
            </>
          ) : (
            <>
              <Ph label="Full terms and conditions, supplied by your lawyer." />
              <p className="mt-4">
                Typically covers: the broker&apos;s role and the operating carrier&apos;s responsibility for the flight · aircraft substitution · delays, weather and
                air-traffic restrictions · the operator&apos;s right to refuse carriage · dangerous goods · passenger conduct · liability limits and insurance ·
                force majeure · data protection (passenger data) · governing law and jurisdiction.
              </p>
              <p>The app inserts the current version of these terms from Settings, so every agreement carries the version that applied on the day it was issued.</p>
            </>
          )}
        </div>

        <p className="mt-6 mb-8">
          By signing, the client confirms the flights, the price and the terms above, and that the person signing is authorised to sign for the client.
        </p>

        <div className="grid grid-cols-2 gap-12">
          <div>
            <Label className="mb-10">For the client</Label>
            <div className="border-t border-[#111827] pt-2">
              <div>{signer || <Ph label="Authorised person" />}</div>
              <div>{party.name}</div>
              <div>
                {signed && booking.contractSignedBy ? `Signed ${signedDate || ""} by ${booking.contractSignedBy}` : "Date ____________ Place ____________"}
              </div>
            </div>
          </div>
          <div>
            <Label className="mb-10">For the broker</Label>
            <div className="border-t border-[#111827] pt-2">
              <div>
                <Ph value={brokerSignatory} label="Authorised signatory" />
              </div>
              <div>
                <Ph value={company.legalEntity} label="Company legal name" />
              </div>
              <div>Date ____________ Place ____________</div>
            </div>
          </div>
        </div>
        <p className="text-[11.5px] text-[#4B5563] mt-6">Signed electronically: the e-signature certificate (signer, time, IP) is attached as the last page.</p>
      </DocPage>
    </div>
  );
}
