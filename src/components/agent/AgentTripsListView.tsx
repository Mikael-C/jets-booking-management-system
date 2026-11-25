"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Badge, DocRef, LoadState, PageTitle, Ref, cardCls, goldLinkCls, money, tdCls, thCls, useLoad } from "./curatorUi";

interface TripRow {
  token: string;
  ref: Ref;
  title: string;
  client: string;
  route: string;
  flight: string;
  status: "Booked" | "Paid" | "Flown" | "Cancelled";
  price: number;
  currency: string;
  open: number | null;
  missingPassports: number;
}

const tone = (s: TripRow["status"]) => (s === "Cancelled" ? "red" : s === "Flown" ? "grey" : "green");

export default function AgentTripsListView() {
  const router = useRouter();
  const { data, error, loading, reload } = useLoad<TripRow[]>(() => api.curator.trips(), []);

  return (
    <div>
      <PageTitle title="My trips" sub="Booked trips for your clients. Open a trip for payments, passengers and documents." />
      {!data ? (
        <LoadState loading={loading} error={error} onRetry={reload} />
      ) : (
        <div className={`${cardCls} overflow-hidden px-3 py-1`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className={thCls}>Trip</th>
                  <th className={thCls}>Client</th>
                  <th className={thCls}>Route</th>
                  <th className={thCls}>Flight</th>
                  <th className={thCls}>Status</th>
                  <th className={`${thCls} text-right`}>Client price</th>
                  <th className={thCls}>Open</th>
                  <th className={thCls}>Passports</th>
                  <th className={thCls} />
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-[15px] text-[#93A1B5]">
                      No booked trips yet. Trips show here once the client signs the contract.
                    </td>
                  </tr>
                )}
                {data.map((t) => (
                  <tr
                    key={t.token}
                    onClick={() => router.push(`/agent/trips/${t.token}`)}
                    className="border-b border-white/[0.05] last:border-0 cursor-pointer hover:bg-white/[0.02]"
                  >
                    <td className={`${tdCls} text-[16px]`}>
                      <DocRef value={t.ref} />
                    </td>
                    <td className={tdCls}>{t.client}</td>
                    <td className={`${tdCls} font-mono whitespace-nowrap`}>{t.route}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{t.flight || "—"}</td>
                    <td className={tdCls}>
                      <Badge tone={tone(t.status)}>{t.status}</Badge>
                    </td>
                    <td className={`${tdCls} text-right whitespace-nowrap`}>{money(t.price, t.currency)}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>
                      {t.open ? <Badge tone="amber">{money(t.open, t.currency)} open</Badge> : t.open === 0 ? <Badge tone="green">Paid</Badge> : "—"}
                    </td>
                    <td className={tdCls}>
                      {t.missingPassports ? <Badge tone="amber">▲ {t.missingPassports}</Badge> : <Badge tone="green">Complete</Badge>}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap`}>
                      <Link href={`/agent/trips/${t.token}`} onClick={(e) => e.stopPropagation()} className={goldLinkCls}>
                        Open trip
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
