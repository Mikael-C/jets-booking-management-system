"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { DocRef, FilterPill, LoadState, PageTitle, Ref, cardCls, goldLinkCls, useLoad } from "./curatorUi";
import { DeskThread } from "./DeskThread";

interface ThreadRow {
  key: string;
  kind: "request" | "trip";
  ref: Ref;
  tripRef: Ref | null;
  client: string;
  route: string;
  href: string;
  count: number;
  unread: number;
  lastAt: string | null;
  lastText: string;
  lastFromDesk: boolean;
  createdAt: string;
}

type Filter = "conversations" | "unread" | "all";

const when = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/** Every conversation with the desk, one per request or trip, in one place. */
export default function AgentMessagesView() {
  const { data, error, loading, reload } = useLoad<{ threads: ThreadRow[]; unread: number }>(() => api.curator.messages(), []);
  const [filter, setFilter] = useState<Filter>("conversations");
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onChange = () => reload();
    window.addEventListener("curator-messages-changed", onChange);
    // Desk replies arrive without a page reload
    const t = setInterval(reload, 30000);
    return () => {
      window.removeEventListener("curator-messages-changed", onChange);
      clearInterval(t);
    };
  }, [reload]);

  const threads = useMemo(() => data?.threads || [], [data]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      if (filter === "conversations" && !t.count) return false;
      if (filter === "unread" && !t.unread) return false;
      if (!q) return true;
      const refs = [t.ref, t.tripRef].filter(Boolean).map((r) => `${r!.prefix}-${r!.token}`.toLowerCase());
      return [t.client, t.route, t.key, ...refs].some((x) => String(x || "").toLowerCase().includes(q));
    });
  }, [threads, filter, search]);

  // Open the newest conversation by default
  useEffect(() => {
    if (!selected && shown.length) setSelected(shown[0].key);
  }, [shown, selected]);

  const current = threads.find((t) => t.key === selected) || null;
  const withMessages = threads.filter((t) => t.count).length;
  const unreadThreads = threads.filter((t) => t.unread).length;

  return (
    <div>
      <PageTitle title="Messages" sub="Every conversation with the desk about your requests, quotes and trips." />

      {!data ? (
        <LoadState loading={loading} error={error} onRetry={reload} />
      ) : (
        <div className={`${cardCls} overflow-hidden grid grid-cols-1 md:grid-cols-[360px_1fr] min-h-[560px]`}>
          <div className="border-b md:border-b-0 md:border-r border-white/[0.07] flex flex-col min-w-0">
            <div className="p-4 space-y-3 border-b border-white/[0.07]">
              <div className="flex flex-wrap gap-2">
                <FilterPill active={filter === "conversations"} onClick={() => setFilter("conversations")}>
                  {`Conversations ${withMessages}`}
                </FilterPill>
                <FilterPill active={filter === "unread"} onClick={() => setFilter("unread")}>
                  {`Unread ${unreadThreads}`}
                </FilterPill>
                <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
                  New
                </FilterPill>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search client, route or reference…"
                className="w-full bg-[#0D1520] border border-[#263345] rounded-lg px-3.5 py-2 text-[14px] text-white placeholder:text-[#5F6E82] focus:outline-none focus:border-[#C9A24A]"
              />
              {filter === "all" && <p className="text-[12px] text-[#93A1B5] m-0">Pick any request or trip to start a conversation with the desk.</p>}
            </div>
            <div className="flex-1 overflow-y-auto max-h-[620px]">
              {shown.length === 0 && (
                <div className="p-8 text-center text-[14px] text-[#93A1B5]">
                  {filter === "unread" ? "No unread messages." : filter === "conversations" ? "No conversations yet. Choose “New” to write to the desk." : "Nothing found."}
                </div>
              )}
              {shown.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelected(t.key)}
                  className={`w-full text-left px-4 py-3.5 border-b border-white/[0.05] transition-colors ${
                    selected === t.key ? "bg-white/[0.05]" : "hover:bg-white/[0.025]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[15px] truncate ${t.unread ? "font-bold text-white" : "text-[#E8EDF3]"}`}>{t.client || "—"}</span>
                    <span className="text-[12px] text-[#93A1B5] shrink-0">{when(t.lastAt)}</span>
                  </div>
                  <div className="text-[13px] text-[#93A1B5] mt-0.5 flex items-center gap-1.5 min-w-0">
                    <DocRef value={t.ref} className="text-[13px]" />
                    {t.tripRef && (
                      <>
                        <span>·</span>
                        <DocRef value={t.tripRef} className="text-[13px]" />
                      </>
                    )}
                    {t.route && <span className="truncate font-mono">· {t.route}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[13px] text-[#A8B3C2] truncate">
                      {t.count ? `${t.lastFromDesk ? "Desk: " : "You: "}${t.lastText}` : "No messages yet"}
                    </span>
                    {t.unread > 0 && (
                      <span className="shrink-0 bg-[#C9A24A] text-[#0B121C] text-[11px] font-bold rounded-full px-1.5 py-0.5 leading-none">{t.unread}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 flex flex-col min-w-0">
            {!current ? (
              <div className="flex-1 flex items-center justify-center text-[14px] text-[#93A1B5]">Pick a conversation.</div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-white/[0.07]">
                  <div className="min-w-0">
                    <div className="text-[17px] font-bold text-white flex items-baseline gap-2 flex-wrap">
                      <DocRef value={current.ref} />
                      {current.tripRef && (
                        <>
                          <span className="text-[#5F6E82]">·</span>
                          <DocRef value={current.tripRef} />
                        </>
                      )}
                    </div>
                    <div className="text-[13px] text-[#93A1B5] mt-0.5">{[current.client, current.route].filter(Boolean).join(" · ")}</div>
                  </div>
                  {current.href && (
                    <Link href={current.href} className={`${goldLinkCls} whitespace-nowrap`}>
                      Open {current.tripRef?.prefix === "TRI" || current.ref.prefix === "TRI" ? "trip" : current.kind === "trip" ? "quote" : "request"}
                    </Link>
                  )}
                </div>
                <DeskThread key={current.key} threadKey={current.key} height="max-h-[420px]" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
