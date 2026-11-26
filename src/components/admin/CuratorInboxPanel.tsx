"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toaster";
import { HeaderId } from "@/components/ui/DocId";

interface InboxMessage {
  id: string;
  from: string;
  role: string;
  fromCurator: boolean;
  text: string;
  at: string;
  read: boolean;
}
interface Thread {
  requestId: string;
  kind?: "request" | "trip";
  curator: string;
  curatorEmail: string;
  client: string;
  route: string;
  flightDate: string;
  status: string;
  unread: number;
  lastAt: string;
  lastText: string;
  lastFromCurator: boolean;
  messages: InboxMessage[];
}

const when = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/** Messages Curators send from their requests, with the Curator's name and the request ID. */
export default function CuratorInboxPanel({ onUnread }: { onUnread?: (n: number) => void }) {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    try {
      const res = await api.curatorInbox.list();
      const list: Thread[] = res?.data?.threads || [];
      setThreads(list);
      setError(null);
      onUnread?.(Number(res?.data?.unread) || 0);
      setSelected((cur) => cur || list[0]?.requestId || null);
    } catch (err: any) {
      setError(err?.message || "Curator messages could not be loaded.");
    }
  }, [onUnread]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const thread = useMemo(() => (threads || []).find((t) => t.requestId === selected) || null, [threads, selected]);

  // Opening a thread marks it read
  useEffect(() => {
    if (!thread || !thread.unread) return;
    api.curatorInbox
      .read(thread.requestId)
      .then(() => {
        setThreads((prev) => (prev || []).map((t) => (t.requestId === thread.requestId ? { ...t, unread: 0, messages: t.messages.map((m) => ({ ...m, read: true })) } : t)));
      })
      .catch(() => undefined);
  }, [thread]);

  useEffect(() => {
    if (threads) onUnread?.(threads.reduce((n, t) => n + t.unread, 0));
  }, [threads, onUnread]);

  const send = async () => {
    if (!thread || !reply.trim()) return;
    setSending(true);
    try {
      await api.curatorInbox.reply(thread.requestId, reply.trim());
      setReply("");
      toast(`Reply sent to ${thread.curator} on ${thread.requestId}.`);
      await load();
    } catch (err: any) {
      toast(err?.message || "The reply could not be sent.", "error");
    } finally {
      setSending(false);
    }
  };

  const shown = (threads || []).filter((t) => filter === "all" || t.unread > 0);

  if (error && !threads) {
    return (
      <div className="bg-white border border-gray-200/80 rounded-xl p-6 text-xs text-rose-600 flex items-center justify-between">
        <span>{error}</span>
        <button type="button" onClick={load} className="underline">
          Try again
        </button>
      </div>
    );
  }
  if (!threads) return <div className="bg-white border border-gray-200/80 rounded-xl p-6 text-xs text-gray-400">Loading Curator messages…</div>;

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[480px]">
      <div className="border-r border-gray-100 flex flex-col">
        <div className="flex items-center gap-1.5 p-3 border-b border-gray-100">
          {(["all", "unread"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                filter === k ? "bg-[#111827] text-white border-[#111827]" : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              {k === "all" ? `All ${threads.length}` : `Unread ${threads.filter((t) => t.unread).length}`}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {shown.length === 0 && <div className="p-6 text-xs text-gray-400 text-center">No Curator messages{filter === "unread" ? " waiting" : " yet"}.</div>}
          {shown.map((t) => (
            <button
              key={t.requestId}
              type="button"
              onClick={() => setSelected(t.requestId)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${selected === t.requestId ? "bg-gray-50" : "hover:bg-gray-50/60"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs ${t.unread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>{t.curator}</span>
                <span className="text-[11px] text-gray-400">{when(t.lastAt)}</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                <span className="font-mono text-gray-700">{t.requestId}</span>
                {t.client && <span className="truncate">· {t.client}</span>}
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="text-xs text-gray-600 truncate">
                  {t.lastFromCurator ? "" : "You: "}
                  {t.lastText}
                </span>
                {t.unread > 0 && <span className="shrink-0 bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{t.unread}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col min-h-[480px]">
        {!thread ? (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400">Pick a conversation.</div>
        ) : (
          <>
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {thread.curator} · <HeaderId id={thread.requestId} affix={0.72} />
                </div>
                <div className="text-[11px] text-gray-500">
                  {[thread.client, thread.route, thread.flightDate].filter(Boolean).join(" · ")}
                  {thread.curatorEmail ? ` · ${thread.curatorEmail}` : ""}
                </div>
              </div>
              {thread.kind === "trip" ? (
                <Link
                  href={`/trips/${encodeURIComponent(thread.requestId.replace(/^TRI-/i, ""))}`}
                  className="text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap"
                >
                  Open trip
                </Link>
              ) : (
                <Link href={`/requests/${encodeURIComponent(thread.requestId)}`} className="text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap">
                  Open request
                </Link>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/40">
              {thread.messages.map((m) => (
                <div key={m.id} className={`flex ${m.fromCurator ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-xs ${
                      m.fromCurator ? "bg-white border border-gray-200 text-gray-800" : "bg-[#111827] text-white"
                    }`}
                  >
                    <div className={`text-[10px] mb-1 ${m.fromCurator ? "text-gray-400" : "text-gray-300"}`}>
                      {m.from} · {when(m.at)}
                    </div>
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder={`Reply to ${thread.curator}…`}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-gray-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
                }}
              />
              <button
                type="button"
                onClick={send}
                disabled={sending || !reply.trim()}
                className="self-end bg-[#111827] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
