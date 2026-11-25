"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "@/components/ui/Toaster";
import { api } from "@/lib/api";
import { Badge, Card, DocRef, GoldButton, HeadingRef, LoadState, Ref, fieldCls, goldLinkCls, money, useLoad } from "./curatorUi";

interface RequestDetail {
  id: string;
  ref: Ref;
  status: string;
  statusLabel: string;
  createdAt: string;
  client: string;
  owner: string;
  clientEmail: string;
  tripType: string;
  route: string;
  legs: { n: number; from: string; to: string; date: string; time: string; aircraft: { categoryLabel?: string; category?: string; model?: string; why?: string } | null }[];
  pax: number;
  luggage: string;
  pets: { name?: string; species?: string; breed?: string; weightKg?: number; travels?: string }[];
  services: string[];
  notes: string;
  marginPct?: number;
  tokensUsed: number;
  quotes: { ref: Ref; href: string; price: number; currency: string; at: string; booked: boolean }[];
  messages: { id: string; from: string; fromDesk: boolean; text: string; at: string }[];
}

const day = (v?: string) => {
  if (!v) return "";
  const d = new Date(v.length === 10 ? `${v}T12:00:00` : v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
};
const stamp = (v: string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-[12px] font-bold tracking-[0.08em] text-[#93A1B5] uppercase mb-1">{label}</div>
    <div className="text-[16px] text-white">{children || "—"}</div>
  </div>
);

export default function AgentRequestDetailView({ requestId }: { requestId: string }) {
  const id = decodeURIComponent(requestId);
  const { data: r, error, loading, reload } = useLoad<RequestDetail>(() => api.curator.requestDetail(id), [id]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  // New desk replies show up without reloading the page
  useEffect(() => {
    const t = setInterval(() => reload(), 30000);
    return () => clearInterval(t);
  }, [reload]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [r?.messages.length]);

  if (!r) {
    return (
      <div className="space-y-4">
        <Link href="/agent/requests" className={goldLinkCls}>
          ← My requests
        </Link>
        <LoadState loading={loading} error={error} onRetry={reload} />
      </div>
    );
  }

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.curator.messageDesk(r.id, text.trim());
      setText("");
      toast(`Message sent to the desk on ${r.id}.`);
      reload();
    } catch (err: any) {
      toast(err?.message || "The message could not be sent.", "error");
    } finally {
      setSending(false);
    }
  };

  const tone = r.status === "declined" ? "grey" : r.status === "completed" ? "amber" : "slate";

  return (
    <div>
      <Link href="/agent/requests" className={`${goldLinkCls} text-[14px]`}>
        ← My requests
      </Link>
      <h1 className="text-[40px] leading-tight font-bold text-white tracking-tight mt-3 mb-0 flex flex-wrap items-baseline gap-x-3">
        <HeadingRef value={r.ref} />
        <span>·</span>
        <span className="font-mono text-[32px]">{r.route}</span>
      </h1>
      <p className="text-[15px] text-[#93A1B5] mt-1.5 mb-4">
        {[r.client, r.owner && r.owner !== r.client ? r.owner : "", `${r.pax} pax`, `sent ${stamp(r.createdAt)}`, `${r.tokensUsed} token${r.tokensUsed === 1 ? "" : "s"}`]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <div className="mb-6">
        <Badge tone={tone as any}>{r.statusLabel}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        <div className="space-y-6">
          <Card title="Route and aircraft">
            <div className="space-y-4">
              {r.legs.map((l) => (
                <div key={l.n} className="border border-[#263345] rounded-xl p-4">
                  <div className="font-mono font-bold text-white">
                    Leg {l.n} · {l.from} → {l.to} · {day(l.date)}
                    {l.time ? ` ${l.time} LT` : ""}
                  </div>
                  {l.aircraft && (
                    <div className="text-[15px] text-[#C7D0DC] mt-1.5">
                      {[l.aircraft.categoryLabel || l.aircraft.category, l.aircraft.model].filter(Boolean).join(" · ") || "Any aircraft"}
                      {l.aircraft.why ? <span className="text-[#93A1B5]"> — {l.aircraft.why}</span> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Passengers, luggage, pets and services">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Row label="Passengers">{r.pax}</Row>
              <Row label="Luggage">{r.luggage}</Row>
              <Row label="Pets">
                {r.pets.length
                  ? r.pets
                      .map((p) => [p.name, p.species, p.breed, p.weightKg ? `${p.weightKg} kg` : "", p.travels].filter(Boolean).join(" · "))
                      .join("; ")
                  : "None"}
              </Row>
              <Row label="Services">{r.services.length ? r.services.join(", ") : "None"}</Row>
              <Row label="Your margin">{r.marginPct != null ? `${r.marginPct} %` : "—"}</Row>
              <Row label="Note to the desk">{r.notes}</Row>
            </div>
          </Card>

          <Card title="Quotes from this request">
            {r.quotes.length === 0 ? (
              <p className="text-[15px] text-[#93A1B5] m-0">No quote yet. It shows here as soon as the desk completes it.</p>
            ) : (
              <div className="space-y-2.5">
                {r.quotes.map((q) => (
                  <Link key={q.href + refKey(q.ref)} href={q.href} className="flex items-center justify-between gap-4 text-[16px] text-white hover:text-[#E0C17C]">
                    <span>
                      <DocRef value={q.ref} /> {q.booked ? <Badge tone="green" className="ml-2">Booked</Badge> : null}
                    </span>
                    <span>{money(q.price, q.currency)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card title="Messages with the desk" className="lg:sticky lg:top-24">
          <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
            {r.messages.length === 0 && <p className="text-[15px] text-[#93A1B5] m-0">No messages yet.</p>}
            {r.messages.map((m) => (
              <div key={m.id} className={`flex ${m.fromDesk ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${m.fromDesk ? "bg-[#16233A] text-white" : "bg-[#C9A24A] text-[#0B121C]"}`}>
                  <div className={`text-[12px] mb-0.5 ${m.fromDesk ? "text-[#93A1B5]" : "text-[#3A2E10]"}`}>
                    {m.fromDesk ? `${m.from} · desk` : "You"} · {stamp(m.at)}
                  </div>
                  <div className="text-[15px] whitespace-pre-wrap">{m.text}</div>
                </div>
              </div>
            ))}
            <div ref={bottom} />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Ask about this request…"
            className={`${fieldCls} resize-none mt-4`}
          />
          <div className="flex justify-end mt-3">
            <GoldButton onClick={send} disabled={sending || !text.trim()}>
              {sending ? "Sending…" : "Send"}
            </GoldButton>
          </div>
        </Card>
      </div>
    </div>
  );
}

const refKey = (r: Ref) => `${r.prefix}-${r.token}${r.suffix || ""}`;
