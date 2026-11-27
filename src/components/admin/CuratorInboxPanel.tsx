"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toaster";

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
interface CuratorRow {
  key: string;
  name: string;
  email: string;
  threads: Thread[];
  unread: number;
  lastAt: string;
  lastText: string;
  lastFromCurator: boolean;
}
interface ChatMessage extends InboxMessage {
  thread: Thread;
}

const when = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
const stamp = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
};
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" });
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "C";
const threadHref = (t: Thread) =>
  t.kind === "trip" ? `/trips/${encodeURIComponent(t.requestId.replace(/^TRI-/i, ""))}` : `/requests/${encodeURIComponent(t.requestId)}`;
const threadLabel = (t: Thread) => [t.requestId, t.route, t.client].filter(Boolean).join(" · ");

/**
 * Messages with Curators: every Curator on the left; choosing one shows a single chat with everything said
 * between the desk and that Curator, each message tagged with the request or trip it belongs to.
 */
export default function CuratorInboxPanel({ onUnread }: { onUnread?: (n: number) => void }) {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [accounts, setAccounts] = useState<{ name: string; email: string; active: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [about, setAbout] = useState<string>("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.curatorInbox.list();
      const list: Thread[] = res?.data?.threads || [];
      setThreads(list);
      setAccounts(Array.isArray(res?.data?.curators) ? res.data.curators : []);
      setError(null);
      onUnread?.(Number(res?.data?.unread) || 0);
    } catch (err: any) {
      setError(err?.message || "Curator messages could not be loaded.");
    }
  }, [onUnread]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  // One row per Curator: their conversations (requests and trips) and the latest message
  const curators = useMemo<CuratorRow[]>(() => {
    const map = new Map<string, CuratorRow>();
    const keyOf = (email: string, name: string) => (email || name || "curator").toLowerCase();
    accounts.forEach((a) => {
      const k = keyOf(a.email, a.name);
      map.set(k, { key: k, name: a.name, email: a.email, threads: [], unread: 0, lastAt: "", lastText: "", lastFromCurator: false });
    });
    (threads || []).forEach((t) => {
      const k = keyOf(t.curatorEmail, t.curator);
      const row = map.get(k) || { key: k, name: t.curator, email: t.curatorEmail, threads: [], unread: 0, lastAt: "", lastText: "", lastFromCurator: false };
      row.threads.push(t);
      row.unread += t.unread;
      if (!row.lastAt || new Date(t.lastAt).getTime() > new Date(row.lastAt).getTime()) {
        row.lastAt = t.lastAt;
        row.lastText = t.lastText;
        row.lastFromCurator = t.lastFromCurator;
      }
      if (!row.name) row.name = t.curator;
      map.set(k, row);
    });
    return Array.from(map.values()).sort(
      (a, b) => (b.lastAt ? new Date(b.lastAt).getTime() : 0) - (a.lastAt ? new Date(a.lastAt).getTime() : 0) || a.name.localeCompare(b.name)
    );
  }, [threads, accounts]);

  // Start on the Curator with the newest message
  useEffect(() => {
    if (!selected && curators.length) setSelected(curators[0].key);
  }, [curators, selected]);

  const current = useMemo(() => curators.find((c) => c.key === selected) || null, [curators, selected]);

  const chat = useMemo<ChatMessage[]>(
    () =>
      (current?.threads || [])
        .flatMap((t) => t.messages.map((m) => ({ ...m, thread: t })))
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
    [current]
  );

  // The reply goes to the conversation of the latest message, unless the desk picks another one
  useEffect(() => {
    if (!current) return;
    const latest = [...current.threads].sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())[0];
    setAbout((cur) => (cur && current.threads.some((t) => t.requestId === cur) ? cur : latest?.requestId || ""));
  }, [current]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [chat.length, selected]);

  // Opening a Curator reads their messages
  useEffect(() => {
    if (!current || !current.unread) return;
    const unreadThreads = current.threads.filter((t) => t.unread > 0);
    Promise.all(unreadThreads.map((t) => api.curatorInbox.read(t.requestId).catch(() => undefined))).then(() => {
      const ids = new Set(unreadThreads.map((t) => t.requestId));
      setThreads((prev) =>
        (prev || []).map((t) => (ids.has(t.requestId) ? { ...t, unread: 0, messages: t.messages.map((m) => ({ ...m, read: true })) } : t))
      );
    });
  }, [current]);

  useEffect(() => {
    if (threads) onUnread?.(threads.reduce((n, t) => n + t.unread, 0));
  }, [threads, onUnread]);

  const send = async () => {
    if (!current || !about || !reply.trim() || sending) return;
    setSending(true);
    try {
      await api.curatorInbox.reply(about, reply.trim());
      setReply("");
      toast(`Message sent to ${current.name} on ${about}.`);
      await load();
    } catch (err: any) {
      toast(err?.message || "The message could not be sent.", "error");
    } finally {
      setSending(false);
    }
  };

  const q = search.trim().toLowerCase();
  const shown = curators.filter(
    (c) =>
      (filter === "all" || c.unread > 0) &&
      (!q || [c.name, c.email, ...c.threads.map((t) => `${t.requestId} ${t.client} ${t.route}`)].join(" ").toLowerCase().includes(q))
  );
  const totalUnread = curators.reduce((n, c) => n + c.unread, 0);

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

  let lastDay = "";

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] h-[640px]">
      {/* Curators */}
      <div className="border-r border-gray-100 flex flex-col min-h-0">
        <div className="p-3 border-b border-gray-100 space-y-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Curator, request, client…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-gray-400"
          />
          <div className="flex items-center gap-1.5">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  filter === f ? "bg-[#0f172a] text-white border-[#0f172a]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {f === "all" ? `All Curators ${curators.length}` : `Unread ${totalUnread}`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {shown.length === 0 && <div className="p-6 text-xs text-gray-400 text-center">{q ? "No Curator matches your search." : "No Curators yet."}</div>}
          {shown.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSelected(c.key)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 flex gap-3 transition-colors ${selected === c.key ? "bg-slate-50" : "hover:bg-gray-50"}`}
            >
              <span className="w-9 h-9 shrink-0 rounded-full bg-[#0f172a] text-white text-xs font-bold flex items-center justify-center">{initials(c.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`text-[13px] truncate ${c.unread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>{c.name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{c.lastAt ? when(c.lastAt) : ""}</span>
                </span>
                <span className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-[11.5px] text-gray-500 truncate">
                    {c.lastText ? `${c.lastFromCurator ? "" : "You: "}${c.lastText}` : c.email || "No messages yet"}
                  </span>
                  {c.unread > 0 && (
                    <span className="shrink-0 bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{c.unread}</span>
                  )}
                </span>
                {c.threads.length > 0 && (
                  <span className="block text-[10.5px] text-gray-400 mt-0.5">
                    {c.threads.length} conversation{c.threads.length === 1 ? "" : "s"}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat with the chosen Curator */}
      <div className="flex flex-col min-h-0">
        {!current ? (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400">Choose a Curator to see your conversation.</div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 truncate">{current.name}</div>
                <div className="text-[11px] text-gray-500 truncate">
                  {current.email}
                  {current.threads.length ? ` · ${current.threads.length} conversation${current.threads.length === 1 ? "" : "s"}` : ""}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/50">
              {chat.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-10">
                  No messages with {current.name} yet. Conversations start from their requests and trips.
                </div>
              )}
              {chat.map((m) => {
                const d = dayLabel(m.at);
                const showDay = d !== lastDay;
                lastDay = d;
                return (
                  <React.Fragment key={`${m.thread.requestId}-${m.id}`}>
                    {showDay && <div className="text-center text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider py-1">{d}</div>}
                    <div className={`flex ${m.fromCurator ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                          m.fromCurator ? "bg-white border border-gray-200 text-gray-900 rounded-bl-md" : "bg-[#0f172a] text-white rounded-br-md"
                        }`}
                      >
                        <div className={`flex items-center gap-2 text-[10.5px] mb-1 ${m.fromCurator ? "text-gray-500" : "text-slate-300"}`}>
                          <span className="font-semibold">{m.fromCurator ? m.from || current.name : m.from || "Desk"}</span>
                          <span>·</span>
                          <Link
                            href={threadHref(m.thread)}
                            className={`font-mono font-semibold hover:underline ${m.fromCurator ? "text-blue-600" : "text-amber-300"}`}
                            title={threadLabel(m.thread)}
                          >
                            {m.thread.requestId}
                          </Link>
                          <span>·</span>
                          <span>{stamp(m.at)}</span>
                        </div>
                        <div className="text-[13px] whitespace-pre-wrap leading-relaxed">{m.text}</div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={endRef} />
            </div>

            <div className="border-t border-gray-100 p-3 space-y-2">
              {current.threads.length === 0 ? (
                <div className="text-[11.5px] text-gray-400">
                  {current.name} has no request or trip with a conversation yet. Messages are kept on a request or trip, so you can write once they have one.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <span className="text-gray-500 shrink-0">About</span>
                    <select
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      className="flex-1 min-w-0 border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-800"
                    >
                      {[...current.threads]
                        .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
                        .map((t) => (
                          <option key={t.requestId} value={t.requestId}>
                            {threadLabel(t)}
                          </option>
                        ))}
                    </select>
                    {about && (
                      <Link
                        href={threadHref(current.threads.find((t) => t.requestId === about) || current.threads[0])}
                        className="text-blue-600 font-semibold hover:underline whitespace-nowrap"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
                      }}
                      rows={2}
                      placeholder={`Write to ${current.name}… (Ctrl+Enter sends)`}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] resize-none focus:outline-none focus:border-gray-400"
                    />
                    <button
                      type="button"
                      onClick={send}
                      disabled={sending || !reply.trim() || !about}
                      className="bg-[#0f172a] text-white text-xs font-semibold px-4 py-2.5 rounded-lg disabled:opacity-40"
                    >
                      {sending ? "Sending…" : "Send"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
