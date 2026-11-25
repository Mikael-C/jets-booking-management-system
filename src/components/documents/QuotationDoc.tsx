"use client";

import React from "react";
import { Booking, FlightLeg } from "@/types/aviation";
import { useAviation } from "@/lib/aviationContext";
import { fbosFor } from "@/components/trip/tripTabUtils";
import {
  settingsFor,
  clientParty,
  docOptions,
  legRange,
  sameAircraftAllLegs,
  serviceRows,
  servicesSummary,
  tripWord,
  docMoney,
  documentPricing,
  fmtDate,
  fmtDay,
  fmtDuration,
  legAircraft,
  legTiming,
  parseDocDate,
  placeOf,
  quoteNo,
  representative
} from "@/lib/documentData";
import { AmountRow, DocPage, Label, Letterhead, PartyBlock, PhotoBox, Ph, RepBlock, Section, TitleBlock, mono, thCls, useDocSettings } from "./docKit";
import ServiceDetailsPage from "./ServiceDetailsPage";
import TaxRows from "./TaxRows";

interface QuotationDocProps {
  booking: Booking;
}

/** Kept for older imports: "€ 1,234.00", negatives "− € 1,234.00". */
export function formatDocCurrency(amount: number, currency: string = "EUR"): string {
  return docMoney(amount, currency).replace(/^– /, "− ");
}

/** FBO name saved on the leg, when it is a real handler at that airport (not a placeholder). */
export function realFbo(leg: FlightLeg, side: "departure" | "arrival"): string {
  const h = side === "departure" ? leg.departureHandling : leg.arrivalHandling;
  const icao = side === "departure" ? leg.origin?.icao : leg.destination?.icao;
  const name = String(h?.name || "").trim();
  if (!name) return "";
  const changed = side === "departure" ? leg.departureFboChanged : leg.arrivalFboChanged;
  if (changed || fbosFor(icao).some((f) => f.name === name)) return name.replace(/\s+FBO$/i, "");
  return "";
}

/** "16 Nov 2026, 18:00 LT"; free text is printed as saved. */
function validUntil(raw?: string): string {
  if (!raw) return "";
  const d = parseDocDate(raw);
  if (!d) return raw;
  const hasTime = /\d{1,2}:\d{2}/.test(raw);
  return `${fmtDate(d)}${hasTime ? `, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} LT` : ""}`;
}

export default function QuotationDoc({ booking }: QuotationDocProps) {
  const settings = settingsFor(booking, useDocSettings());
  const { users } = useAviation() as any;
  const company = settings.company;
  const cardFee = settings.pricing?.cardFeePercent ?? 3.5;
  const pricing = documentPricing(booking, cardFee);
  const cur = pricing.currency;
  const party = clientParty(booking);
  const rep = representative(booking, users || [], company);
  const number = quoteNo(booking);
  const issued = fmtDate((booking as any).quoteSentAt || booking.createdAt || booking.updatedAt);
  const opts = docOptions(booking);
  const rows = serviceRows(booking);
  const servicesSum = pricing.services.reduce((s, l) => s + l.amount, 0);
  const servicePage = opts.servicesOneLine && rows.length > 0;
  const pages = servicePage ? 2 : 1;
  const footer = `${number} · ${party.name}`;
  const same = sameAircraftAllLegs(booking);
  const vatText = company.vatWording || company.vatExemptionClause;

  // Aircraft cards: one card when every leg flies the same aircraft, else one per leg
  const aircraftGroups = same
    ? [{ nums: pricing.legs.map((l) => l.legNumber), leg: pricing.legs[0]?.leg, index: 0 }]
    : pricing.legs.map((l) => ({ nums: [l.legNumber], leg: l.leg, index: l.index }));

  return (
    <div className="quotation-document bg-transparent select-none print:max-w-none">
      <DocPage footerLeft={footer} page={1} pages={pages}>
        <Letterhead />
        <TitleBlock
          title="Charter quotation"
          meta={[
            { label: "Quote", value: number, mono: true },
            { label: "Date", value: issued || <Ph label="date" /> },
            { label: "Valid until", value: validUntil(booking.quoteExpirationDate) || <Ph label="validity" /> },
            { label: "Currency", value: cur }
          ]}
        />

        <div className="grid grid-cols-2 gap-10 mb-6">
          <PartyBlock label="Prepared for" party={party} />
          <RepBlock label="Your representative" rep={rep} />
        </div>

        <Section className="mb-2">Itinerary</Section>
        <table className="w-full border-collapse mb-1">
          <thead>
            <tr className="border-b-2 border-[#111827]">
              <th className={`${thCls} w-[40px]`}>Leg</th>
              <th className={thCls}>Date</th>
              <th className={thCls}>From</th>
              <th className={thCls}>To</th>
              <th className={`${thCls} text-right`}>Departs (LT)</th>
              <th className={`${thCls} text-right`}>Arrives (LT)</th>
              <th className={`${thCls} text-right`}>Flight time</th>
              <th className={`${thCls} text-right w-[44px]`}>Pax</th>
            </tr>
          </thead>
          <tbody>
            {pricing.legs.map(({ leg, index, legNumber }) => {
              const t = legTiming(leg, legAircraft(booking, leg, index) as any);
              const pax = leg.paxCount || leg.passengers?.length || 0;
              const depFbo = realFbo(leg, "departure");
              const arrFbo = realFbo(leg, "arrival");
              return (
                <tr key={`it-${legNumber}-${index}`} className="border-b border-[#E5E7EB] align-top">
                  <td className="py-[8px] px-[6px]">{legNumber}</td>
                  <td className="py-[8px] px-[6px] whitespace-nowrap">{fmtDay(leg.flightDate)}</td>
                  <td className="py-[8px] px-[6px]">
                    <div className="font-bold">{leg.origin?.icao}</div>
                    <div className="text-[11.5px] text-[#6B7280]">
                      {placeOf(leg.origin)}
                      {depFbo ? ` · ${depFbo}` : ""}
                    </div>
                  </td>
                  <td className="py-[8px] px-[6px]">
                    <div className="font-bold">{leg.destination?.icao}</div>
                    <div className="text-[11.5px] text-[#6B7280]">
                      {placeOf(leg.destination)}
                      {arrFbo ? ` · ${arrFbo}` : ""}
                    </div>
                  </td>
                  <td className={`py-[8px] px-[6px] text-right ${mono}`}>{t.dep || "—"}</td>
                  <td className={`py-[8px] px-[6px] text-right ${mono}`}>
                    {t.arr || "—"}
                    {t.dayOffset > 0 ? <sup className="text-[9px] font-bold ml-0.5">+{t.dayOffset}</sup> : null}
                  </td>
                  <td className={`py-[8px] px-[6px] text-right ${mono}`}>{fmtDuration(t.minutes) || "—"}</td>
                  <td className="py-[8px] px-[6px] text-right">{pax || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[11.5px] text-[#6B7280] mt-1 mb-5">Times are local at each airport; flight times are estimates.</p>

        <div className="space-y-3 mb-2">
          {aircraftGroups.map((g) => {
            if (!g.leg) return null;
            const ac = legAircraft(booking, g.leg, g.index);
            const label = pricing.legs.length > 1 ? `Aircraft · ${legRange(g.nums)}` : "Aircraft";
            return (
              <div key={`ac-${g.nums.join("-")}`} className="border border-[#D1D5DB] rounded-[10px] p-3 pl-3.5 grid grid-cols-[1fr_290px] gap-5">
                <div>
                  <Label className="mb-1.5">{label}</Label>
                  <div className="font-bold text-[14px] mb-1.5">
                    {ac.name || <Ph label="Aircraft" />}
                    {ac.category ? ` · ${ac.category}` : ""}
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-y-[3px]">
                    <Label>Built · refurbished</Label>
                    <span>
                      {ac.built || "—"} · {ac.refurbished || "—"}
                    </span>
                    <Label>Seats</Label>
                    <span>{ac.seats || "—"}</span>
                    <Label>Lavatory</Label>
                    <span>{ac.lavatory || "—"}</span>
                    <Label>Cabin</Label>
                    <span>{ac.smoking || "—"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 content-start">
                  <PhotoBox src={ac.exterior} label="Exterior" />
                  <PhotoBox src={ac.cabin} label="Cabin" />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11.5px] text-[#6B7280] mt-1 mb-6">
          Photos are representative until the aircraft is assigned. Each flight is operated by an approved AOC holder (the operating carrier); the
          registration and flight number of each leg are confirmed on the flight brief.
        </p>

        <Section className="mb-2">Price</Section>
        <div className="grid grid-cols-[1fr_230px] gap-6 items-start">
          <div>
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
                label={`Additional services · ${servicesSummary(rows)} (details on page 2)`}
                amount={servicesSum > 0 ? docMoney(servicesSum, cur) : "Included"}
              />
            ) : (
              pricing.services.map((s, i) => (
                <AmountRow key={`s-${i}`} label={s.label} amount={s.included ? "Included" : docMoney(s.amount, cur)} />
              ))
            )}
            <TaxRows booking={booking} vat={pricing.vat} currency={cur} fallbackWording={vatText} />
            <div className="flex items-baseline justify-between px-[6px] py-[8px] border-b-2 border-[#111827]">
              <span className="font-bold">Total</span>
              <span className="font-bold text-[16px]">{docMoney(pricing.total, cur)}</span>
            </div>
          </div>
          <div className="space-y-3 pt-1">
            <div className="border border-[#D1D5DB] rounded-[8px] p-3">
              <Label>Bank transfer</Label>
              <div className="mt-1 font-bold">{docMoney(pricing.total, cur)}</div>
              <div>no surcharge</div>
            </div>
            <div className="border border-[#D1D5DB] rounded-[8px] p-3">
              <Label>Card</Label>
              <div className="mt-1 font-bold">{docMoney(pricing.card, cur)}</div>
              <div>includes {cardFee} % card fee</div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#D1D5DB] mt-6 pt-3 text-[12px] text-[#374151]">
          <strong className="text-[#111827]">Next step.</strong> To book, confirm with your representative. A charter agreement is issued for signature; the
          booking is final once it is signed. This quotation is subject to aircraft availability at the time of booking, slots, permits and operator
          confirmation. Prices are valid until the date above. Cancellation terms are set out in the charter agreement.
        </div>
      </DocPage>

      {servicePage && (
        <ServiceDetailsPage booking={booking} footerLeft={footer} page={2} pages={pages} showPrices={opts.showServicePrices} currency={cur} />
      )}
    </div>
  );
}
