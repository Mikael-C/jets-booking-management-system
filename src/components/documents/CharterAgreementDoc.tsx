"use client";

import React from "react";
import { Booking, CancellationFeeStep } from "@/types/aviation";
import {
  agreementLinksFor,
  settingsFor,
  agreementNo,
  bankFor,
  clientParty,
  docMoney,
  docOptions,
  documentPricing,
  fmtDate,
  fmtDay,
  fmtDuration,
  legAircraft,
  legTiming,
  parseDocDate,
  placeOf,
  quoteNo,
  sameAircraftAllLegs,
  serviceRows,
  servicesSummary,
  tripWord
} from "@/lib/documentData";
import { AmountRow, DocPage, Label, Letterhead, Ph, Section, TitleBlock, mono, thCls, useDocSettings } from "./docKit";
import ServiceDetailsPage from "./ServiceDetailsPage";
import TaxRows from "./TaxRows";

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
  const settings = settingsFor(booking, useDocSettings());
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
  const issued = fmtDate((booking as any).quoteSentAt || booking.contractDate || booking.createdAt);
  const opts = docOptions(booking);
  const rows = serviceRows(booking);
  const servicesSum = pricing.services.reduce((s, l) => s + l.amount, 0);
  const servicePage = opts.servicesOneLine && rows.length > 0;
  const pages = servicePage ? 3 : 2;
  const footer = `${number} · ${party.name}`;
  const docsHours = (settings as any).documents?.passengerDocsDeadlineHours;
  const paymentTerms = (settings as any).documents?.paymentTerms || booking.paymentDueDate || "";
  const same = sameAircraftAllLegs(booking);
  const bank = bankFor(settings, cur);
  const vatText = company.vatWording || company.vatExemptionClause;
  const deposit = Math.max(0, Number((booking as any).depositPaid || (booking as any).bookingDepositPaid || 0));

  // Legal documents the agreement incorporates, and the online signing link (R-093). Every link is clickable in the PDF.
  const links = agreementLinksFor(booking, settings);
  const checkInMinutes = (settings as any).documents?.checkInMinutes ?? 30;
  const eff = parseDocDate(terms?.effectiveDate);
  const formVersion = (booking as any).documentSnapshot?.legalVersions?.C2 || terms?.version || "1.1";
  const formLine = `C2 · version ${String(formVersion).replace(/^v/i, "")}${eff ? ` · ${eff.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}` : ""}`;
  const versionOf = (code: string) => String((booking as any).documentSnapshot?.legalVersions?.[code] || "").replace(/^v/i, "");
  const A = ({ href, children }: { href: string; children: React.ReactNode }) =>
    href ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#1D4ED8] underline decoration-[#93C5FD]">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    );
  const docs = [
    { code: "C1", name: "Brokerage Terms", link: links.terms },
    { code: "C3", name: "Cancellation Policy", link: links.cancellation },
    { code: "C5", name: "Privacy Notice", link: links.privacy }
  ];
  const DocLink = ({ code }: { code: string }) => {
    const d = docs.find((x) => x.code === code)!;
    const v = versionOf(code);
    return (
      <span>
        {code} {d.name}
        {v ? ` (version ${v})` : ""}: <A href={d.link.href}>{d.link.label}</A>
      </span>
    );
  };
  const clientSig: any = (booking as any).contractSignature || null;
  const counterSig: any = (booking as any).countersignature || null;

  // Who signs: the Authorised Owner, or the assistant when the assistant signs with authority
  const clientSigner =
    booking.signsAgreement === "assistant" && (booking.paName || booking.client?.paName)
      ? booking.paName || booking.client?.paName || ""
      : party.attn;
  const brokerName = company.representativeName || "";
  const brokerTitle = company.signatoryTitle || "";

  return (
    <div className="charter-agreement-document bg-transparent select-none print:max-w-none">
      {/* ───────── Page 1 ───────── */}
      <DocPage footerLeft={footer} page={1} pages={pages}>
        <Letterhead />
        <TitleBlock
          title="Charter agreement"
          meta={[
            { label: "Agreement", value: number, mono: true },
            { label: "Based on quote", value: quoteNo(booking), mono: true },
            { label: "Issued", value: issued || <Ph label="date" /> },
            { label: "Form", value: formLine }
          ]}
        />

        <div className="border border-[#D1D5DB] rounded-[8px] px-4 py-3 mb-6 text-[12px] leading-relaxed">
          <Label className="mb-1">Incorporates</Label>
          <div className="space-y-[2px]">
            {docs.map((d) => (
              <div key={d.code}>
                <DocLink code={d.code} />
              </div>
            ))}
          </div>
          <div className="text-[#6B7280] mt-1">
            Current form of this agreement: <A href={links.form.href}>{links.form.label}</A>. Each link opens the version in force on the issue date;
            older versions stay online.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-6">
          <div>
            <Label className="mb-2">The client</Label>
            <div className="font-bold">{party.name || <Ph label="Client name" />}</div>
            {party.lines.map((l) => (
              <div key={l}>{l}</div>
            ))}
            {party.account && (
              <div>
                Account <span className={mono}>{party.account}</span>
              </div>
            )}
            <div className="mt-1">Authorised signatory: {clientSigner || <Ph label="Name, Title" />}</div>
          </div>
          <div>
            <Label className="mb-2">The broker</Label>
            <div className="font-bold">
              <Ph value={company.legalEntity} label="Company legal name" />
            </div>
            <div>
              <Ph value={[company.address, company.registrationNumber].filter(Boolean).join(" · ")} label="Registered address · Company no." />
            </div>
            <div className="text-[12px] text-[#4B5563] mt-1">
              Acting as charter broker and contracting party with the client, arranging the flights with an approved air operator (the operating carrier).
            </div>
          </div>
        </div>

        <Section className="mb-2">1 · Flights and aircraft</Section>
        <table className="w-full border-collapse mb-2">
          <thead>
            <tr className="border-b-2 border-[#111827]">
              <th className={`${thCls} w-[36px]`}>Leg</th>
              <th className={thCls}>Date</th>
              <th className={thCls}>From → To</th>
              <th className={`${thCls} text-right`}>Departs</th>
              <th className={`${thCls} text-right`}>Arrives</th>
              <th className={`${thCls} text-right w-[40px]`}>Pax</th>
              <th className={thCls}>Aircraft</th>
              {opts.showPricePerLeg && <th className={`${thCls} text-right`}>Charter price</th>}
            </tr>
          </thead>
          <tbody>
            {pricing.legs.map(({ leg, index, legNumber, price }, rowIdx) => {
              const ac = legAircraft(booking, leg, index);
              const t = legTiming(leg, ac as any);
              const specs = [ac.category, ac.seats ? `${ac.seats} seats` : "", ac.lavatoryShort].filter(Boolean).join(" · ");
              const showAc = !same || rowIdx === 0;
              return (
                <tr key={`${legNumber}-${index}`} className="border-b border-[#E5E7EB] align-top">
                  <td className="py-[8px] px-[6px]">{legNumber}</td>
                  <td className="py-[8px] px-[6px] whitespace-nowrap">{fmtDay(leg.flightDate, true)}</td>
                  <td className="py-[8px] px-[6px]">
                    <div className="font-bold">
                      {leg.origin?.icao} → {leg.destination?.icao}
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      {placeOf(leg.origin)} → {placeOf(leg.destination)}
                    </div>
                  </td>
                  <td className={`py-[8px] px-[6px] text-right ${mono}`}>{t.dep || "—"}</td>
                  <td className={`py-[8px] px-[6px] text-right ${mono}`}>
                    {t.arr || "—"}
                    {t.dayOffset > 0 ? <sup className="text-[9px] font-bold ml-0.5">+{t.dayOffset}</sup> : null}
                    {t.minutes ? <div className="text-[10.5px] text-[#6B7280]">{fmtDuration(t.minutes)}</div> : null}
                  </td>
                  <td className="py-[8px] px-[6px] text-right">{leg.paxCount || leg.passengers?.length || ""}</td>
                  {showAc && (
                    <td className="py-[8px] px-[6px] border-l border-[#E5E7EB]" rowSpan={same ? pricing.legs.length : 1}>
                      <div className="font-bold">{ac.name || <Ph label="Aircraft" />}</div>
                      <div className="text-[11px] text-[#4B5563]">{specs}</div>
                    </td>
                  )}
                  {opts.showPricePerLeg && <td className="py-[8px] px-[6px] text-right whitespace-nowrap">{docMoney(price, cur)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[11.5px] text-[#4B5563] mt-0 mb-6">
          Times are local. Each leg is operated by an approved AOC holder (the operating carrier). An aircraft of the same category and standard may be
          substituted by the operating carrier; the client is told before departure.
        </p>

        <Section className="mb-2">2 · Price and payment</Section>
        <div className="mb-2">
          {opts.showPricePerLeg ? (
            pricing.legs.map(({ leg, legNumber, price, index }) => (
              <AmountRow
                key={`p-${index}`}
                label={`Charter price · leg ${legNumber} · ${leg.origin?.icao || ""} → ${leg.destination?.icao || ""}`}
                amount={docMoney(price, cur)}
              />
            ))
          ) : (
            <AmountRow label={`Charter price · ${tripWord(booking)}`} amount={docMoney(pricing.charterTotal, cur)} />
          )}
          {pricing.passengerFees.map((f, i) => (
            <AmountRow key={`f-${i}`} label={f.label} amount={docMoney(f.amount, cur)} />
          ))}
          {servicePage ? (
            <AmountRow
              label={`Additional services · ${servicesSummary(rows)} (details on page 3)`}
              amount={servicesSum > 0 ? docMoney(servicesSum, cur) : "Included"}
            />
          ) : (
            pricing.services.map((s, i) => <AmountRow key={`s-${i}`} label={s.label} amount={s.included ? "Included" : docMoney(s.amount, cur)} />)
          )}
          <TaxRows booking={booking} vat={pricing.vat} currency={cur} fallbackWording={vatText} />
          <AmountRow label="Total" amount={<span className="text-[15px]">{docMoney(pricing.total, cur)}</span>} bold border="dark" />
          {deposit > 0 && (
            <>
              <AmountRow label="Less booking deposit already paid (direct requests)" amount={docMoney(-deposit, cur)} />
              <AmountRow label="Balance to pay" amount={docMoney(pricing.total - deposit, cur)} bold />
            </>
          )}
        </div>
        <div className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-1.5 text-[12.5px] mt-3">
          <Label className="pt-[2px]">Payment due</Label>
          <span>
            <Ph value={paymentTerms} label="e.g. 100 % on signature, and in all cases before departure" />
          </span>
          <Label className="pt-[2px]">Method</Label>
          <span>
            Bank transfer
            {bank ? (
              <>
                {" "}
                · {bank.bankName ? `${bank.bankName} · ` : ""}IBAN <span className={mono}>{bank.iban}</span>
                {bank.bic ? (
                  <>
                    {" "}
                    · BIC <span className={mono}>{bank.bic}</span>
                  </>
                ) : null}
              </>
            ) : (
              <>
                {" "}
                · <Ph label="bank account in Settings" />
              </>
            )}{" "}
            · reference <span className={mono}>{number}</span>; or card with {cardFee} % fee ({docMoney(pricing.card, cur)})
          </span>
        </div>
      </DocPage>

      {/* ───────── Page 2 ───────── */}
      <DocPage footerLeft={footer} page={2} pages={pages}>
        <Letterhead />
        <Section className="mb-2">3 · Cancellation by the client</Section>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-[#111827]">
              <th className={thCls}>Notice before first departure</th>
              <th className={`${thCls} text-right`}>Fee (% of total)</th>
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
        <p className="text-[11.5px] text-[#4B5563] mt-1.5 mb-0">
          Cancellation must be in writing. Full rules, including changes and refunds: <DocLink code="C3" />.
        </p>

        <Section className="mt-6 mb-2">4 · Passengers and documents</Section>
        <p className="m-0">
          The client provides full names and valid travel documents for every passenger, and pet passports where pets travel, no later than{" "}
          {docsHours || 48} hours before departure. Passengers are at the terminal or FBO at least {checkInMinutes} minutes before departure. The
          operating carrier may refuse carriage to a passenger without valid documents. Luggage beyond what is stated in the quotation may not fit the
          aircraft.
        </p>

        <Section className="mt-6 mb-2">5 · Terms</Section>
        <p className="m-0">
          This agreement incorporates <DocLink code="C1" />; <DocLink code="C3" />; and <DocLink code="C5" />, in the versions in force on the date
          of issue. The broker contracts with the client as principal and has each flight operated by an approved operating carrier, which is responsible
          for the operation of the flight. If these documents and this agreement differ, this agreement applies.
        </p>

        <div className="border-2 border-[#111827] rounded-[10px] px-5 py-4 mt-6 text-[12.5px]">
          <div className="font-bold mb-2">By signing, the client confirms</div>
          <ul className="m-0 pl-0 list-none space-y-1">
            {[
              `the flights and the price: ${docMoney(pricing.total, cur)}, payable as in section 2;`,
              `having read and accepted C1 Brokerage Terms${versionOf("C1") ? ` ${versionOf("C1")}` : ""}, C3 Cancellation Policy${versionOf("C3") ? ` ${versionOf("C3")}` : ""} and C5 Privacy Notice${versionOf("C5") ? ` ${versionOf("C5")}` : ""};`,
              `that passenger details and travel documents will be sent ${docsHours || 48} hours before departure;`,
              "that the person signing is authorised to sign for the client."
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="inline-block w-[12px] h-[12px] border border-[#111827] rounded-[2px] mt-[3px] shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <Section className="mt-8 mb-2">6 · Signatures</Section>
        <div className="grid grid-cols-2 gap-12 mt-4">
          <div>
            <Label className={clientSig?.signatureImage ? "mb-1" : "mb-10"}>For the client</Label>
            {clientSig?.signatureImage && <img src={clientSig.signatureImage} alt="Client signature" className="h-[48px] object-contain" />}
            <div className="border-t border-[#111827] pt-2">
              <div className="font-bold">
                {clientSig?.name || clientSigner || <Ph label="Authorised person" />}
                {clientSig?.position ? `, ${clientSig.position}` : ""}
              </div>
              <div>{party.name}</div>
              <div>
                {signed && booking.contractSignedBy ? `Signed ${signedDate || ""} by ${booking.contractSignedBy}` : "Date ____________ Place ____________"}
              </div>
            </div>
          </div>
          <div>
            <Label className={counterSig ? "mb-1" : "mb-10"}>For the broker</Label>
            {counterSig && <div className="h-[48px] flex items-end font-[cursive] text-[22px] text-[#1F2937]">{counterSig.name}</div>}
            <div className="border-t border-[#111827] pt-2">
              <div className="font-bold">
                <Ph value={[counterSig?.name || brokerName, counterSig?.title || brokerTitle].filter(Boolean).join(", ")} label="Authorised signatory" />
              </div>
              <div>
                <Ph value={company.legalEntity} label="Company legal name" />
              </div>
              <div>{counterSig ? `Countersigned ${fmtDate(counterSig.at)}` : "Date ____________ Place ____________"}</div>
            </div>
          </div>
        </div>

        {!signed && (
          <div className="border border-[#C9A24A] bg-[#FBF6EA] rounded-[8px] px-4 py-3 mt-8 text-[12.5px]">
            <strong>Sign online:</strong>{" "}
            <span className={mono}>
              <A href={links.signHref}>{links.signLabel}</A>
            </span>
            <div className="text-[11.5px] text-[#4B5563]">
              Tick the four confirmations, enter your name and position, sign, and enter the one-time code sent by email. Signing confirms the booking;
              the countersigned agreement and a signature certificate (name, email, time, IP, code, versions accepted) are emailed to you.
            </div>
          </div>
        )}
        {signed && clientSig && (
          <div className="border border-[#D1D5DB] rounded-[8px] px-4 py-3 mt-8 text-[11.5px] text-[#4B5563]">
            Signed {clientSig.method === "wet" ? "by hand (copy confirmed by the MD)" : "online with a one-time code"} by {clientSig.name}
            {clientSig.email ? ` (${clientSig.email})` : ""} on {fmtDate(clientSig.signedAt)}
            {clientSig.ip ? ` · IP ${clientSig.ip}` : ""}. The signature certificate is kept with the trip.
          </div>
        )}
      </DocPage>

      {servicePage && (
        <ServiceDetailsPage booking={booking} footerLeft={footer} page={3} pages={pages} showPrices={opts.showServicePrices} currency={cur} />
      )}
    </div>
  );
}
