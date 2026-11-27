"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toaster";

interface Related {
  kind: "request" | "quote" | "trip";
  ref: string;
  request?: string;
}
interface Thread {
  requestId: string;
  kind?: "request" | "trip";
  curator: string;
  unread: number;
  lastAt: string;
  lastText: string;
  lastFromCurator: boolean;
  related?: Related;
}

const KIND_WORD: Record<Related["kind"], string> = { request: "request", quote: "quote", trip: "trip" };
const ago = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/**
 * Overview notice for new Curator messages: who wrote, and the request, quote or trip it is about.
 * Checks every 30 seconds; a toast also pops when a new one arrives while the Overview is open.
 */
export default function NewMessagesNotice() {
  const [items, setItems] = useState<Thread[]>([]);
  const [dismissedAt, setDismissedAt] = useState<number>(0);
  const seen = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.curatorInbox.list();
      const unread: Thread[] = (res?.data?.threads || [])
        .filter((t: Thread) => t.unread > 0 && t.lastFromCurator)
        .sort((a: Thread, b: Thread) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
      // Toast for messages that arrived since the last check (not on the first load)
      const keys = new Set(unread.map((t) => `${t.requestId}@${t.lastAt}`));
      if (seen.current) {
        unread
          .filter((t) => !seen.current!.has(`${t.requestId}@${t.lastAt}`))
          .slice(0, 2)
          .forEach((t) => {
            const rel = t.related || { kind: t.kind === "trip" ? "trip" : "request", ref: t.requestId };
            toast(`New message from ${t.curator} on ${KIND_WORD[rel.kind as Related["kind"]] || "request"} ${rel.ref}.`);
          });
      }
      seen.current = keys;
      setItems(unread);
    } catch {
      /* the notice is a convenience; the Messages page shows everything */
    }
  }, []);

  useEffect(() => {
    load();
    // Every 60 s while the tab is visible; straight away when the person comes back to it
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 60000);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const visible = items.filter((t) => new Date(t.lastAt).getTime() > dismissedAt);
  if (!visible.length) return null;
  const total = visible.reduce((n, t) => n + t.unread, 0);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="font-bold text-amber-900">
            {total === 1 ? "A new message just came in" : `${total} new messages`}
          </div>
          {visible.slice(0, 3).map((t) => {
            const rel = t.related || { kind: t.kind === "trip" ? "trip" : "request", ref: t.requestId };
            return (
              <div key={t.requestId} className="text-[13px] text-amber-900/90 truncate">
                <span className="font-semibold">{t.curator}</span> on {KIND_WORD[rel.kind as Related["kind"]] || "request"}{" "}
                <span className="font-mono font-semibold">{rel.ref}</span>
                {rel.kind !== "request" && rel.request ? <span className="text-amber-800/70"> (from {rel.request})</span> : null}
                {t.lastText ? <span className="text-amber-800/80"> · “{t.lastText.length > 90 ? `${t.lastText.slice(0, 90)}…` : t.lastText}”</span> : null}
                <span className="text-amber-700/70"> · {ago(t.lastAt)}</span>
              </div>
            );
          })}
          {visible.length > 3 && <div className="text-[12px] text-amber-800/80">and {visible.length - 3} more conversation{visible.length - 3 === 1 ? "" : "s"}</div>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/messages" className="text-[13px] font-semibold text-amber-900 hover:underline whitespace-nowrap">
            Open messages →
          </Link>
          <button
            type="button"
            onClick={() => setDismissedAt(Date.now())}
            className="text-amber-700 hover:text-amber-900 text-lg leading-none"
            aria-label="Hide until a new message comes in"
            title="Hide until a new message comes in"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
