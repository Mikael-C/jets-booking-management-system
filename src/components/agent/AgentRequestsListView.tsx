"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Badge, DocRef, FilterPill, LoadState, PageTitle, Ref, cardCls, goldLinkCls, money, tdCls, thCls, useLoad } from "./curatorUi";
import { DeskThreadModal, MessageDeskButton } from "./DeskThread";

type FilterKey = "all" | "waiting" | "quoted" | "confirmed" | "expired";
type SortKey = "newest" | "oldest" | "flight";

interface Row {
  id: string;
  kind: "request" | "quote" | "trip";
  ref: Ref;
  client: string;
  route: string;
  flight: string;
  flightAt: string | null;
  status: Exclude<FilterKey, "all">;
  statusLabel: string;
  statusRef?: Ref;
  clientPrice: number | null;
  currency: string;
  expires: string | null;
  action: { label: string; href?: string; message?: boolean } | null;
  createdAt: string;
  requestId: string | null;
  /** Conversation with the desk about this row (its request, or its trip) */
  threadKey?: string | null;
  unread?: number;
}

function StatusBadge({ row }: { row: Row }) {
  if (row.statusRef) {
    return (
      <Badge tone="slate">
        {row.statusLabel} → <DocRef value={row.statusRef} mono={false} />
      </Badge>
    );
  }
  if (row.status === "confirmed") return <Badge tone="green">{row.statusLabel}</Badge>;
  if (row.status === "quoted") return <Badge tone="amber">{row.statusLabel}</Badge>;
  if (row.status === "expired") return <Badge tone="grey">{row.statusLabel}</Badge>;
  return <Badge tone="slate">{row.statusLabel}</Badge>;
}

/** Where a row opens: the request page, the quote or the trip. */
const rowHref = (row: Row) =>
  row.kind === "request" && row.requestId ? `/agent/requests/${encodeURIComponent(row.requestId)}` : row.action?.href || (row.requestId ? `/agent/requests/${encodeURIComponent(row.requestId)}` : "");

export default function AgentRequestsListView() {
  const router = useRouter();
  const { data, error, loading, reload } = useLoad<{ rows: Row[]; counts: Record<FilterKey, number> }>(() => api.curator.requests(), []);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [messaging, setMessaging] = useState<Row | null>(null);

  // Unread desk replies change when a conversation is opened or answered
  useEffect(() => {
    const onChange = () => reload();
    window.addEventListener("curator-messages-changed", onChange);
    return () => window.removeEventListener("curator-messages-changed", onChange);
  }, [reload]);

  const rows = useMemo(() => {
    const list = (data?.rows || []).filter((r) => filter === "all" || r.status === filter);
    const t = (v: string | null) => (v ? new Date(v).getTime() || 0 : 0);
    return [...list].sort((a, b) =>
      sort === "oldest" ? t(a.createdAt) - t(b.createdAt) : sort === "flight" ? t(a.flightAt) - t(b.flightAt) : t(b.createdAt) - t(a.createdAt)
    );
  }, [data, filter, sort]);

  const counts = data?.counts;
  const label = (base: string, n?: number) => (n ? `${base} ${n}` : base);

  return (
    <div>
      <PageTitle title="My requests and quotes" sub="Newest first. A quote shows here as soon as the desk completes it." />

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
            {label("All", counts?.all || 0) || "All"}
          </FilterPill>
          <FilterPill active={filter === "waiting"} onClick={() => setFilter("waiting")}>
            {label("Waiting for quote", counts?.waiting)}
          </FilterPill>
          <FilterPill active={filter === "quoted"} onClick={() => setFilter("quoted")}>
            {label("Quoted", counts?.quoted)}
          </FilterPill>
          <FilterPill active={filter === "confirmed"} onClick={() => setFilter("confirmed")}>
            {label("Client confirmed", counts?.confirmed)}
          </FilterPill>
          <FilterPill active={filter === "expired"} onClick={() => setFilter("expired")}>
            {label("Expired", counts?.expired)}
          </FilterPill>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[15px] text-[#93A1B5]">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-[#0D1520] border border-[#263345] rounded-xl px-4 py-2.5 text-[15px] text-white focus:outline-none focus:border-[#C9A24A]"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="flight">Flight date</option>
          </select>
        </div>
      </div>

      {!data ? (
        <LoadState loading={loading} error={error} onRetry={reload} />
      ) : (
        <div className={`${cardCls} overflow-hidden px-3 py-1`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className={thCls}>Reference</th>
                  <th className={thCls}>Client</th>
                  <th className={thCls}>Route</th>
                  <th className={thCls}>Flight</th>
                  <th className={thCls}>Status</th>
                  <th className={`${thCls} text-right`}>Client price</th>
                  <th className={thCls}>Expires</th>
                  <th className={thCls} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[15px] text-[#93A1B5]">
                      {filter === "all" ? (
                        <>
                          No requests yet.{" "}
                          <Link href="/agent/requests/new" className={goldLinkCls}>
                            Start a new request
                          </Link>
                        </>
                      ) : (
                        "Nothing here."
                      )}
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => {
                      const href = rowHref(row);
                      if (href) router.push(href);
                    }}
                    className="border-b border-white/[0.05] last:border-0 cursor-pointer hover:bg-white/[0.025] transition-colors"
                  >
                    <td className={`${tdCls} text-[16px]`}>
                      <DocRef value={row.ref} />
                    </td>
                    <td className={tdCls}>{row.client}</td>
                    <td className={`${tdCls} font-mono whitespace-nowrap`}>{row.route || "—"}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{row.flight || "—"}</td>
                    <td className={tdCls}>
                      <StatusBadge row={row} />
                    </td>
                    <td className={`${tdCls} text-right whitespace-nowrap`}>{row.clientPrice ? money(row.clientPrice, row.currency) : "—"}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{row.expires || "—"}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>
                      <div className="flex items-center justify-end gap-4">
                        {row.action?.href && !row.action.message && (
                          <Link href={row.action.href} onClick={(e) => e.stopPropagation()} className={goldLinkCls}>
                            {row.action.label}
                          </Link>
                        )}
                        {(row.threadKey || row.requestId) && <MessageDeskButton unread={row.unread} onClick={() => setMessaging(row)} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[15px] text-[#93A1B5] mt-5">Curators only ever see their own clients, requests and trips.</p>

      {messaging && (
        <DeskThreadModal threadKey={String(messaging.threadKey || messaging.requestId)} title={messaging.ref} onClose={() => setMessaging(null)} />
      )}
    </div>
  );
}
