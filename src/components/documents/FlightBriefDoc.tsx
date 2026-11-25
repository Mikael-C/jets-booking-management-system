"use client";

import React from "react";
import { Booking, FlightLeg } from "@/types/aviation";
import { useAviation } from "@/lib/aviationContext";
import { fbosFor } from "@/components/trip/tripTabUtils";
import { briefNo, cityOf, clientParty, fmtDay, fmtDuration, fmtStamp, legAircraft, legTiming, representative } from "@/lib/documentData";
import { realFbo } from "./QuotationDoc";
import { DocPage, Label, Letterhead, PhotoBox, Ph, Section, TitleBlock, mono, useDocSettings } from "./docKit";

interface FlightBriefDocProps {
  booking: Booking;
}

const initialName = (full: string) => {
  const parts = String(full || "").trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(" ")}` : full;
};

function fboDetails(leg: FlightLeg, side: "departure" | "arrival") {
  const name = realFbo(leg, side);
  const h = side === "departure" ? leg.departureHandling : leg.arrivalHandling;
  const icao = side === "departure" ? leg.origin?.icao : leg.destination?.icao;
  const dir = name ? fbosFor(icao).find((f) => f.name.replace(/\s+FBO$/i, "") === name) : undefined;
  const contact = [h?.address || dir?.address, h?.phone || dir?.phone].filter(Boolean).join(", ");
  return { name, contact };
}

export default function FlightBriefDoc({ booking }: FlightBriefDocProps) {
  const settings = useDocSettings();
  const { users } = useAviation() as any;
  const company = settings.company;
  const party = clientParty(booking);
  const rep = representative(booking, users || [], company);
  const anyB: any = booking;

  // Legs on this brief: the ones chosen when it was generated
  const all = (booking.legs || []).filter((l) => !l.isCancelled);
  const chosenNums: number[] | undefined = !anyB.briefLegLabel && Array.isArray(booking.lastBriefLegs) && booking.lastBriefLegs.length ? booking.lastBriefLegs : undefined;
  const legs = chosenNums ? all.filter((l, i) => chosenNums.includes(l.legNumber || i + 1)) : all;
  const totalLegs = Number(anyB.briefTotalLegs) || (chosenNums ? all.length : Math.max(all.length, ...legs.map((l) => l.legNumber || 0)));
  const nums = legs.map((l, i) => l.legNumber || i + 1);
  const legsText =
    nums.length === totalLegs && totalLegs === 1
      ? "1 of 1"
      : `${nums.length === 1 ? nums[0] : `${nums.slice(0, -1).join(", ")} and ${nums[nums.length - 1]}`} of ${totalLegs}`;
  const footerLegs = nums.length === 1 ? `Leg ${nums[0]}` : nums.every((v, i) => i === 0 || v === nums[i - 1] + 1) ? `Legs ${nums[0]}–${nums[nums.length - 1]}` : `Legs ${nums.join(", ")}`;

  // Passengers on the legs of this brief (names only; no document numbers)
  const names: { name: string; lead: boolean }[] = [];
  legs.forEach((l) =>
    (l.passengers || []).forEach((p) => {
      const n = String(p.fullName || "").trim();
      if (n && !names.some((x) => x.name === n)) names.push({ name: n, lead: Boolean(p.isLeadPassenger) });
    })
  );
  const pax = names.length || Math.max(0, ...legs.map((l) => l.paxCount || 0));
  const number = briefNo(booking);

  return (
    <div className="flight-brief-document bg-transparent select-none print:max-w-none">
      <DocPage footerLeft={`${number} · ${footerLegs}`} page={1} pages={1}>
        <Letterhead />
        <TitleBlock
          title="Flight brief"
          meta={[
            { label: "Brief", value: number, mono: true },
            { label: "Legs", value: legsText },
            { label: "Issued", value: fmtStamp(booking.lastBriefIssuedAt || new Date()) },
            { label: "Client", value: `${party.name}${pax ? ` · ${pax} pax` : ""}` }
          ]}
        />

        <div className="space-y-4">
          {legs.map((leg, i) => {
            const idx = all.indexOf(leg);
            const ac = legAircraft(booking, leg, idx >= 0 ? idx : i);
            const prevAc = i > 0 ? legAircraft(booking, legs[i - 1], all.indexOf(legs[i - 1])) : null;
            const t = legTiming(leg, booking.aircraft);
            const dep = fboDetails(leg, "departure");
            const arr = fboDetails(leg, "arrival");
            const crew = leg.crew || [];
            const byRole = (r: string) => crew.find((c) => c.role === r && c.name)?.name || "";
            const captain = crew.find((c) => c.role === "CMDR");
            const contact = leg.briefContact || "desk_24_7";
            const notes: string[] = [];
            if (i === 0) notes.push("Please arrive 30 minutes before departure with passports.");
            if (prevAc && prevAc.name && ac.name && prevAc.name !== ac.name) notes.push(`Different aircraft from leg ${legs[i - 1].legNumber || i}.`);
            if (t.dayOffset > 0 && t.arrivalDate) notes.push(`Arrival ${fmtDay(t.arrivalDate).replace(/(\w+) 0?(\d+)/, "$1 $2")}, local time.`);
            return (
              <div key={`${leg.legNumber}-${i}`} className="border border-[#D1D5DB] rounded-[10px] px-3.5 py-3">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="font-bold text-[15px]">
                    Leg {leg.legNumber || i + 1} · {fmtDay(leg.flightDate)}
                  </div>
                  <div className={`${mono} text-[13px]`}>
                    Reg{" "}
                    <strong>
                      <Ph value={ac.registration} label="registration" />
                    </strong>{" "}
                    · Flight no.{" "}
                    <strong>
                      <Ph value={leg.flightNumber} label="flight no." />
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label>Departure</Label>
                    <div className={`${mono} text-[18px] font-bold`}>
                      {leg.origin?.icao} {t.dep}
                    </div>
                    <div>
                      {cityOf(leg.origin)}
                      {dep.name ? ` · ${dep.name}` : ""}
                    </div>
                    <div className="text-[12px]">
                      <Ph value={dep.contact} label="FBO address, phone" />
                    </div>
                  </div>
                  <div>
                    <Label>Arrival</Label>
                    <div className={`${mono} text-[18px] font-bold`}>
                      {leg.destination?.icao} {t.arr || "—"}
                      {t.dayOffset > 0 && <span className="text-[11px] ml-1 align-middle">+{t.dayOffset}</span>}
                    </div>
                    <div>
                      {cityOf(leg.destination)}
                      {arr.name ? ` · ${arr.name}` : ""}
                    </div>
                    <div className="text-[12px]">
                      <Ph value={arr.contact} label="FBO address, phone" />
                    </div>
                  </div>
                  <div>
                    <Label>Crew</Label>
                    <div>
                      Capt. <Ph value={byRole("CMDR")} label="name" /> · FO <Ph value={byRole("F/O")} label="name" /> · Cabin{" "}
                      <Ph value={byRole("Cabin Attendant")} label="name" />
                    </div>
                    {contact === "crew_mobile" && (
                      <div>
                        Crew mobile <Ph value={captain?.phone} label="number" />
                      </div>
                    )}
                    {contact === "desk_24_7" && (
                      <div>
                        Contact: {(company.name || "Orbelo").split(" ")[0]} 24/7 <Ph value={company.phone24_7} label="24/7 number" />
                      </div>
                    )}
                    {t.minutes ? <div className="text-[#6B7280]">Flight time ≈ {fmtDuration(t.minutes)}</div> : null}
                  </div>
                </div>

                <div className="grid grid-cols-[150px_150px_1fr] gap-3 mt-3 items-start">
                  <PhotoBox src={ac.exterior} label="Exterior" />
                  <PhotoBox src={ac.cabin} label="Cabin" />
                  <div>
                    <div>
                      <strong>{ac.name || <Ph label="Aircraft" />}</strong>
                      {ac.category ? ` · ${ac.category}` : ""}
                    </div>
                    {(ac.built || ac.refurbished) && (
                      <div>
                        Built · refurbished {ac.built || "—"} · {ac.refurbished || "—"}
                      </div>
                    )}
                    {(ac.seats || ac.lavatoryShort) && <div>{[ac.seats ? `${ac.seats} seats` : "", ac.lavatoryShort].filter(Boolean).join(" · ")}</div>}
                    {ac.smoking && <div>{ac.smoking} cabin</div>}
                  </div>
                </div>
                {notes.length > 0 && <div className="text-[12px] text-[#4B5563] mt-2">{notes.join(" ")}</div>}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[1fr_290px] gap-8 mt-6 items-start">
          <div>
            <Section className="mb-2">
              Passengers · {nums.length === 1 ? `leg ${nums[0]}` : `legs ${nums.slice(0, -1).join(", ")} and ${nums[nums.length - 1]}`}
            </Section>
            {names.length ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-[3px] text-[13.5px]">
                {names.map((p) => (
                  <div key={p.name}>
                    {p.name}
                    {p.lead ? " (lead)" : ""}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <Ph label="Passenger names" />
              </div>
            )}
            <p className="text-[12px] text-[#4B5563] mt-2 mb-0">
              Document numbers are not printed on the client&apos;s brief. The operator receives the full manifest separately.
            </p>
          </div>
          <div className="border-2 border-[#111827] rounded-[10px] px-4 py-3">
            <Section className="mb-2">24/7 contact</Section>
            <div>
              {(company.name || "Orbelo").split(" ")[0]} operations: <Ph value={company.phone24_7} label="24/7 number" />
            </div>
            <div>Your representative: {rep.name ? initialName(rep.name) : <Ph label="representative" />}</div>
          </div>
        </div>
      </DocPage>
    </div>
  );
}
