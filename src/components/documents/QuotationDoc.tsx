"use client";

import React from "react";
import { Booking, FlightLeg } from "@/types/aviation";
import { useAviation } from "@/lib/aviationContext";
import { fbosFor } from "@/components/trip/tripTabUtils";
import {
  clientParty,
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
import { AmountRow, DocPage, Label, Letterhead, PartyBlock, PhotoBox, Ph, RepBlock, Section, TitleBlock, mono, useDocSettings } from "./docKit";

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
  const settings = useDocSettings();
  const { users } = useAviation() as any;
  const company = settings.company;
  const cardFee = settings.pricing?.cardFeePercent ?? 3.5;
  const pricing = documentPricing(booking, cardFee);
  const cur = pricing.currency;
  const party = clientParty(booking);
  const rep = representative(booking, users || [], company);
  const number = quoteNo(booking);
  const issued = fmtDate((booking as any).quoteSentAt || booking.createdAt || booking.updatedAt);

  return (
    <div className="quotation-document bg-transparent select-none print:max-w-none">
      <DocPage footerLeft={`${number} · ${party.name}`} page={1} pages={1}>
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

        <Section className="mb-3">Itinerary and aircraft</Section>
        <div className="space-y-3">
          {pricing.legs.map(({ leg, index, price, legNumber }) => {
            const ac = legAircraft(booking, leg, index);
            const t = legTiming(leg, booking.aircraft);
            const depFbo = realFbo(leg, "departure");
            const arrFbo = realFbo(leg, "arrival");
            const pax = leg.paxCount || leg.passengers?.length || 0;
            return (
              <div key={`${legNumber}-${index}`} className="border border-[#D1D5DB] rounded-[10px] p-3 pl-3.5 grid grid-cols-[1fr_290px] gap-5">
                <div>
                  <div className="font-bold text-[14px]">
                    Leg {legNumber} · {fmtDay(leg.flightDate)}
                    {pax ? ` · ${pax} pax` : ""}
                  </div>
                  <div className="mt-0.5">
                    <strong>{leg.origin?.icao}</strong> {placeOf(leg.origin)} {t.dep} → <strong>{leg.destination?.icao}</strong> {placeOf(leg.destination)}{" "}
                    {t.arr}
                    {t.dayOffset > 0 ? <sup className="text-[9px] font-bold ml-0.5">+{t.dayOffset}</sup> : null}
                    {t.minutes ? <span className={mono}> · {fmtDuration(t.minutes)}</span> : null}
                  </div>
                  {(depFbo || arrFbo) && (
                    <div className="text-[11.5px] text-[#6B7280]">
                      FBO {depFbo || "to be confirmed"} → {arrFbo || "to be confirmed"}
                    </div>
                  )}
                  <div className="font-bold mt-3 mb-1">
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
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <PhotoBox src={ac.exterior} label="Exterior" />
                    <PhotoBox src={ac.cabin} label="Cabin" />
                  </div>
                  <div className="flex items-baseline justify-between mt-4 font-bold">
                    <span>Charter price</span>
                    <span>{docMoney(price, cur)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11.5px] text-[#6B7280] mt-2 mb-6">
          Times are local at each airport; block times are estimates. Photos are representative until the aircraft is assigned. Each flight is operated
          by an approved AOC holder (the operating carrier); the registration and flight number of each leg are confirmed on the flight brief.
        </p>

        <Section className="mb-2">Price</Section>
        <div className="grid grid-cols-[1fr_230px] gap-6 items-start">
          <div>
            {pricing.legs.map(({ leg, legNumber, price, index }) => (
              <AmountRow
                key={`p-${index}`}
                label={`Charter price · leg ${legNumber} · ${leg.origin?.icao || ""} → ${leg.destination?.icao || ""}`}
                amount={docMoney(price, cur)}
              />
            ))}
            {pricing.passengerFees.map((f, i) => (
              <AmountRow key={`f-${i}`} label={f.label} amount={docMoney(f.amount, cur)} />
            ))}
            {pricing.services.map((s, i) => (
              <AmountRow key={`s-${i}`} label={s.label} amount={s.included ? "Included" : docMoney(s.amount, cur)} />
            ))}
            <AmountRow
              label={
                <>
                  VAT <Ph value={company.vatExemptionClause} label="rate and exemption text per tax advice" className="text-[12px]" />
                </>
              }
              amount={docMoney(pricing.vat, cur)}
              border="dark"
            />
            <div className="flex items-baseline justify-between px-[6px] py-[8px] border-b-2 border-[#111827]">
              <span className="font-bold">Total</span>
              <span className="font-bold text-[16px]">{docMoney(pricing.total, cur)}</span>
            </div>
          </div>
          <div className="space-y-3 pt-1">
            <div className="border border-[#D1D5DB] rounded-[8px] p-3">
              <Label>Bank transfer</Label>
              <div className="mt-1">{docMoney(pricing.total, cur)}</div>
              <div>no surcharge</div>
            </div>
            <div className="border border-[#D1D5DB] rounded-[8px] p-3">
              <Label>Card</Label>
              <div className="mt-1">{docMoney(pricing.card, cur)}</div>
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
    </div>
  );
}
