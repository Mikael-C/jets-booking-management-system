"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Card,
  GhostButton,
  GoldButton,
  HeadingRef,
  LoadState,
  Modal,
  Ref,
  fieldCls,
  goldLinkCls,
  money,
  refText,
  useLoad,
  useOpenTripDocument
} from "./curatorUi";

interface QuoteData {
  id: string;
  mongoId: string;
  ref: Ref;
  title: string;
  client: string;
  owner: string;
  departure: string;
  pax: number;
  expires: string;
  isExpired: boolean;
  flight: { route: string; aircraft: string; luggage: string; departs: string; arrives: string; services: string };
  price: { net: number; marginPct: number; margin: number; client: number; currency: string };
  versions: { label: string; text: string; when: string; id: string }[];
  state: {
    confirmedAt: string | null;
    booked: boolean;
    tripHref: string | null;
    isLatest: boolean;
    latestHref: string;
    changesUsed: number;
    freeChangesLeft: number;
  };
}

const Field = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <div className="text-[12px] font-bold tracking-[0.08em] text-[#93A1B5] uppercase mb-1.5">{label}</div>
    <div className={`text-[17px] text-white ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
  </div>
);

export default function AgentQuoteDetailView({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const id = decodeURIComponent(quoteId);
  const { data: q, error, loading, reload } = useLoad<QuoteData>(() => api.curator.quote(id), [id]);
  const { open, busy } = useOpenTripDocument();
  const [asking, setAsking] = useState(false);
  const [changeText, setChangeText] = useState("");
  const [working, setWorking] = useState<"change" | "confirm" | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string; newRequest?: boolean } | null>(null);

  if (!q) {
    return (
      <div className="space-y-4">
        <Link href="/agent/requests" className={goldLinkCls}>
          ← My requests
        </Link>
        <LoadState loading={loading} error={error} onRetry={reload} />
      </div>
    );
  }

  const cur = q.price.currency;
  const sub = [q.client, q.owner, q.departure, q.pax ? `${q.pax} pax` : "", q.expires].filter(Boolean).join(" · ");

  const askChange = async () => {
    if (!changeText.trim()) return;
    setWorking("change");
    try {
      const res = await api.curator.askChange(q.id, changeText.trim());
      setAsking(false);
      setChangeText("");
      const left = res?.data?.freeChangesLeft ?? 0;
      setMessage({
        tone: "ok",
        text: `Sent to the desk. The revised quote shows here when it is ready. ${left} free change${left === 1 ? "" : "s"} left on this request.`
      });
      reload();
    } catch (err: any) {
      if (err?.code === "NEW_REQUEST_NEEDED") {
        setAsking(false);
        setMessage({ tone: "err", text: err.message, newRequest: true });
      } else setMessage({ tone: "err", text: err?.message || "The change could not be sent." });
    } finally {
      setWorking(null);
    }
  };

  const confirm = async () => {
    if (!window.confirm("Confirm that the client agrees to this quote? The desk rechecks the aircraft before the contract goes out.")) return;
    setWorking("confirm");
    try {
      await api.curator.confirmQuote(q.id);
      setMessage({ tone: "ok", text: "Confirmed. The desk is rechecking the aircraft; the contract follows." });
      reload();
    } catch (err: any) {
      setMessage({ tone: "err", text: err?.message || "The confirmation could not be sent." });
    } finally {
      setWorking(null);
    }
  };

  const locked = q.state.booked || Boolean(q.state.confirmedAt) || q.isExpired || !q.state.isLatest;

  return (
    <div>
      <h1 className="text-[40px] leading-tight font-bold text-white tracking-tight m-0 flex flex-wrap items-baseline gap-x-3">
        <HeadingRef value={q.ref} />
        <span>·</span>
        <span>{q.title}</span>
      </h1>
      <p className="text-[15px] text-[#93A1B5] mt-1.5 mb-6">{sub}</p>

      {!q.state.isLatest && (
        <div className="mb-5 text-[15px] text-[#F0B54C]">
          A newer version of this quote exists.{" "}
          <Link href={q.state.latestHref} className={goldLinkCls}>
            Open the latest
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-6">
          <Card title="Flight">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
              <Field label="Route" value={q.flight.route} mono />
              <Field label="Aircraft" value={q.flight.aircraft} />
              <Field label="Luggage" value={q.flight.luggage} />
              <Field label="Departs" value={q.flight.departs} />
              <Field label="Arrives" value={q.flight.arrives} />
              <Field label="Services" value={q.flight.services} />
            </div>
          </Card>

          <Card title="Price">
            <div className="space-y-2.5 text-[17px]">
              <div className="flex justify-between">
                <span className="text-white">Net price to you</span>
                <span className="text-white">{money(q.price.net, cur, 2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Your margin {q.price.marginPct} %</span>
                <span className="text-white">{money(q.price.margin, cur, 2)}</span>
              </div>
              <div className="border-t border-white/[0.08] pt-3 flex justify-between">
                <span className="font-bold text-white">Client price</span>
                <span className="font-bold text-[#C9A24A]">{money(q.price.client, cur, 2)}</span>
              </div>
            </div>
            <p className="text-[15px] text-[#93A1B5] mt-4 mb-0">
              Operator name and company margin are never shown. The client PDF shows only the client price.
            </p>
          </Card>

          <Card title="Versions">
            <div className="space-y-2.5">
              {q.versions.map((v) => (
                <div key={v.id} className="flex items-baseline justify-between gap-4 text-[17px]">
                  <span className="text-white">
                    <span className="font-mono">{v.label}</span> {v.text}
                  </span>
                  <span className="text-[15px] text-[#93A1B5] whitespace-nowrap">{v.when}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <GhostButton className="w-full" disabled={busy !== null} onClick={() => open("pdf", q.id, "quotation")}>
            {busy ? "Opening…" : "Download client PDF"}
          </GhostButton>
          <GhostButton className="w-full" disabled={locked} onClick={() => setAsking(true)}>
            Ask for a change
          </GhostButton>
          {q.state.booked ? (
            <GoldButton className="w-full" onClick={() => q.state.tripHref && router.push(q.state.tripHref)}>
              Booked · open trip
            </GoldButton>
          ) : (
            <GoldButton className="w-full" disabled={locked || working !== null} onClick={confirm}>
              {q.state.confirmedAt ? "Client confirmed ✓" : working === "confirm" ? "Sending…" : "Client agrees · confirm"}
            </GoldButton>
          )}
          <p className="text-[15px] text-[#93A1B5] leading-relaxed m-0">
            Confirming sends it to the desk, who recheck the aircraft is still available before the contract goes out. Nothing is final until the
            client signs the contract.
          </p>
          {message && (
            <div className={`text-[14px] ${message.tone === "ok" ? "text-[#6BD49E]" : "text-[#F08C8C]"}`}>
              {message.text}{" "}
              {message.newRequest && (
                <Link href="/agent/requests/new" className={goldLinkCls}>
                  New request
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {asking && (
        <Modal title={`Ask for a change · ${refText(q.ref)}`} onClose={() => setAsking(false)}>
          <p className="text-[14px] text-[#93A1B5] mt-0 mb-3">
            {q.state.freeChangesLeft > 0
              ? `${q.state.freeChangesLeft} of 2 free changes left before signing. A third change is a new request.`
              : "Both free changes are used. A further change is a new request."}
          </p>
          <textarea
            value={changeText}
            onChange={(e) => setChangeText(e.target.value)}
            rows={5}
            autoFocus
            placeholder="e.g. Depart at 14:15 instead of 12:00"
            className={`${fieldCls} resize-none`}
          />
          <div className="flex justify-end mt-4">
            <GoldButton onClick={askChange} disabled={working !== null || !changeText.trim()}>
              {working === "change" ? "Sending…" : "Send to the desk"}
            </GoldButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
