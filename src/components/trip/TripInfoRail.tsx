"use client";

import React from "react";
import Link from "next/link";
import { AccountRecord, Booking, OperatorRecord, UserRecord } from "@/types/aviation";
import { formatMoney, formatStamp } from "./tripTabUtils";

interface TripInfoRailProps {
  trip: Booking;
  accounts: AccountRecord[];
  operators: OperatorRecord[];
  users: UserRecord[];
  missingPassports: number;
  onFullLog: () => void;
}

const cardCls = "bg-slate-50/80 border border-slate-100 rounded-xl px-4 py-3.5";
const headCls = "text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1";

/** Right-hand column on the trip page (Passengers, Sourcing and the other tabs). */
export default function TripInfoRail({ trip, accounts, operators, users, missingPassports, onFullLog }: TripInfoRailProps) {
  const account =
    accounts.find((a) => a.accountNumber && a.accountNumber === trip.accountNumber) ||
    accounts.find((a) => a.name && a.name === trip.client?.companyName);

  const authorised = trip.authorisedOwnerName || trip.client?.fullName || account?.preferredContactName || "—";

  const sendTo =
    trip.sendDocsTo === "assistant" && trip.paEmail
      ? trip.paEmail
      : account?.sendDocumentsTo?.split(" (")[0] || trip.client?.email || account?.email || "—";
  const sendToNote =
    trip.sendDocsTo === "both"
      ? "Owner and assistant"
      : trip.sendDocsTo === "assistant"
      ? `Assistant${trip.paName ? ` · ${trip.paName}` : ""}`
      : account?.sendDocumentsTo?.match(/\(([^)]+)\)/)?.[1]
      ? `Preferred: ${account.sendDocumentsTo.match(/\(([^)]+)\)/)?.[1]}'s office`
      : "";

  const curatorName = (trip.agentName || account?.agentName || "").replace(/\s*\(.*\)\s*$/, "");
  const curatorUser = users.find(
    (u) => (trip.agentEmail && u.email === trip.agentEmail) || (curatorName && u.name === curatorName)
  );
  const curatorPct = trip.commissionPercentage ? Math.round(trip.commissionPercentage * 10) / 10 : undefined;

  const operatorName = trip.legOperators?.[0]?.operatorName || trip.operator?.companyName || "";
  const operatorRecord =
    operators.find((o) => o.id === trip.legOperators?.[0]?.operatorId) ||
    operators.find((o) => o.tradingName === operatorName || o.legalName === operatorName);
  const aocYear = operatorRecord?.aocExpiry ? new Date(operatorRecord.aocExpiry).getFullYear() : undefined;
  const operatorPending = operatorRecord && operatorRecord.status !== "approved" && operatorRecord.status !== "approved_with_conditions";

  // Deadlines
  const total = trip.pricing?.totalFlightPrice || 0;
  const received = (trip as any).amountReceived ?? (trip.paymentStatus === "fully_paid" ? total : trip.paymentStatus === "deposit_paid" ? total * 0.3 : 0);
  const open = Math.max(0, Math.round((total - received) * 100) / 100);
  const deadlines: { text: string; tone: "amber" | "plain" }[] = [];
  if (open > 0 && trip.paymentStatus !== "fully_paid") {
    deadlines.push({
      text: `${formatMoney(open, trip.pricing?.currency)} due${trip.paymentDueDate ? ` before ${trip.paymentDueDate}` : ""}`,
      tone: "amber"
    });
  }
  if (missingPassports > 0) {
    deadlines.push({ text: `▲ ${missingPassports} passport${missingPassports === 1 ? "" : "s"} before brief`, tone: "amber" });
  }
  const pendingWeapons = (trip.legs || []).some((l) => l.weapons?.onBoard && l.weapons.clearances.some((c) => c.status !== "cleared"));
  if (pendingWeapons) deadlines.push({ text: "▲ Weapon clearance pending", tone: "amber" });
  const missingFlightNo = (trip.legs || []).findIndex((l) => !l.flightNumber || !l.aircraftRegistration);
  if (missingFlightNo >= 0) deadlines.push({ text: `Leg ${missingFlightNo + 1}: registration or flight no. missing`, tone: "plain" });

  const activity = (trip.itineraryActivity || []).slice(0, 3);

  return (
    <div className="space-y-3 text-[14px] self-start">
      <div className={cardCls}>
        <div className={headCls}>Account</div>
        <div className="text-slate-900">{account?.name || trip.client?.companyName || "—"}</div>
        {(account?.accountNumber || trip.accountNumber) && (
          <Link
            href={account ? `/accounts/${account.id}` : "/accounts"}
            className="font-mono text-[13px] text-[#1F5FAE] underline underline-offset-2 hover:text-[#174A88]"
          >
            {account?.accountNumber || trip.accountNumber}
          </Link>
        )}
      </div>

      <div className={cardCls}>
        <div className={headCls}>Authorised person</div>
        <div className="text-slate-900">{authorised}</div>
      </div>

      <div className={cardCls}>
        <div className={headCls}>Send documents to</div>
        <div className="text-slate-900 break-all">{sendTo}</div>
        {sendToNote && <div className="text-[13px] text-slate-500">{sendToNote}</div>}
      </div>

      <div className={cardCls}>
        <div className={headCls}>Curator</div>
        <div className="text-slate-900">
          {curatorName || "No Curator · direct client"}
          {curatorName && curatorPct ? ` · ${curatorPct} %` : ""}
        </div>
        {curatorName && (
          <div className="text-[13px] text-slate-500">
            {typeof curatorUser?.tokens === "number" ? `${curatorUser.tokens} tokens left · ` : ""}payout 1 week after flight
          </div>
        )}
      </div>

      <div className={cardCls}>
        <div className={headCls}>Operator · internal</div>
        <div className="text-slate-900">
          {operatorName || "—"}
          {aocYear ? ` (AOC valid ${aocYear})` : ""}
        </div>
        {operatorPending && <div className="text-[13px] text-amber-700">▲ Documents pending · subject to operator approval</div>}
        <div className="text-[13px] text-slate-500">Never shown to Curator or client</div>
      </div>

      <div className={cardCls}>
        <div className={headCls}>Deadlines</div>
        {deadlines.length === 0 && <div className="text-slate-500">Nothing due</div>}
        {deadlines.map((d) => (
          <div key={d.text} className={d.tone === "amber" ? "text-amber-700" : "text-slate-900"}>
            {d.text}
          </div>
        ))}
      </div>

      <div className={cardCls}>
        <div className={headCls}>Activity</div>
        {activity.length === 0 && <div className="text-[13px] text-slate-500">No activity yet</div>}
        {activity.map((a) => (
          <div key={a.id} className="text-[13px] text-slate-500">
            {formatStamp(a.at)} · {a.by} · {a.text}
          </div>
        ))}
        <button type="button" onClick={onFullLog} className="text-[14px] text-[#1F5FAE] underline underline-offset-2 hover:text-[#174A88] mt-1">
          Full log
        </button>
      </div>
    </div>
  );
}

/** Notes column for the Itinerary tab. */
export function ItineraryNotesRail() {
  return (
    <div className="space-y-3 text-[13px] self-start">
      <div className={cardCls}>
        <div className={headCls}>Times</div>
        <div className="text-slate-800 space-y-1 leading-relaxed">
          <p className="m-0">Arrival edited: departure stays, flight time recalculates.</p>
          <p className="m-0">Departure edited: arrival moves with it, flight time kept.</p>
          <p className="m-0">Next leg departing before this arrival: warning.</p>
        </div>
      </div>
      <div className={cardCls}>
        <div className={headCls}>Opening hours check</div>
        <div className="text-slate-800 space-y-1 leading-relaxed">
          <p className="m-0">Departure and arrival vs airport and FBO hours, by season and weekday.</p>
          <p className="m-0">Amber: extension possible (fee shown). Red: closed, curfew or no extension.</p>
          <p className="m-0">Runs on every time change, on quotes, revisions and booked trips.</p>
        </div>
      </div>
      <div className={cardCls}>
        <div className={headCls}>Documents</div>
        <div className="text-slate-800 leading-relaxed">
          <p className="m-0">Print the current time only. Earlier times stay internal (here and in the activity log).</p>
        </div>
      </div>
    </div>
  );
}
