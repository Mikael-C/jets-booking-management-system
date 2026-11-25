"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/Toaster";
import { api } from "@/lib/api";
import { DocRef, GoldButton, LoadState, PageTitle, Ref, announceTokens, cardCls, tdCls, thCls, useLoad } from "./curatorUi";

interface Option {
  tokens: number;
  price: number;
  currency: string;
  symbol: string;
  savePct: number;
}
interface TokenData {
  balance: number;
  buckets: { monthly: number; free: number; paid: number };
  tier: string;
  monthlyAllowance: number;
  monthlyLeft: number;
  monthlyExpires: string;
  earnedThisYear: number;
  returned: number;
  returnedReasons: string[];
  ledger: { id: string; at: string; movement: string; tripRef: string; tokens: number; type: string }[];
  single: Option;
  bundles: Option[];
  rules: { perRequest: string; afterSignature: string; orderOfUse: string; paidExpiry: string; freeRevisions: string };
  cardPayments: boolean;
}

const parseRef = (s: string): Ref | null => {
  const m = String(s || "").match(/^([A-Z]+)-([A-Z]{2}\d{3,6})((?:-\d+)*)$/i);
  return m ? { prefix: m[1].toUpperCase(), token: m[2].toUpperCase(), suffix: m[3] } : null;
};
const day = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

function Kpi({ title, value, sub, gold = false }: { title: string; value: React.ReactNode; sub: string; gold?: boolean }) {
  return (
    <div className={`${cardCls} px-6 py-5`}>
      <div className="text-[16px] text-[#A8B3C2]">{title}</div>
      <div className={`text-[44px] font-bold leading-none mt-4 mb-4 ${gold ? "text-[#E0C17C]" : "text-white"}`}>{value}</div>
      <div className="text-[15px] text-[#A8B3C2]">{sub}</div>
    </div>
  );
}

export default function AgentTokensView() {
  const router = useRouter();
  const params = useSearchParams();
  const { data, error, loading, reload } = useLoad<TokenData>(() => api.curator.tokens(), []);
  const [selected, setSelected] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [buying, setBuying] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  // Back from the card payment page: record the purchase
  const purchaseId = params?.get("purchase");
  useEffect(() => {
    if (!purchaseId) return;
    api.curator
      .checkPurchase(purchaseId)
      .then((res) => {
        if (res?.data?.status === "paid") {
          setNotice({ tone: "ok", text: `${res.data.added || ""} tokens added.`.trim() });
          announceTokens();
          reload();
        } else setNotice({ tone: "err", text: "The payment is not confirmed yet. Refresh in a moment." });
      })
      .catch((err: any) => setNotice({ tone: "err", text: err?.message || "The payment could not be checked." }))
      .finally(() => router.replace("/agent/tokens"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseId]);

  useEffect(() => {
    if (data && selected === null) setSelected(data.bundles[0]?.tokens ?? data.single.tokens);
  }, [data, selected]);

  if (!data) {
    return (
      <div>
        <PageTitle title="Tokens" sub="1 token per leg of a quote request. Once the contract is signed, no more tokens for that trip." />
        <LoadState loading={loading} error={error} onRetry={reload} />
      </div>
    );
  }

  const options = [data.single, ...data.bundles];
  const PAGE_SIZE = 10;
  const pages = Math.max(1, Math.ceil(data.ledger.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const pageRows = data.ledger.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const chosen = options.find((o) => o.tokens === selected) || data.bundles[0] || data.single;

  const buy = async () => {
    if (!chosen) return;
    setBuying(true);
    setNotice(null);
    try {
      const res = await api.curator.buyTokens(chosen.tokens, window.location.origin);
      if (res?.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }
      setNotice({ tone: "ok", text: `${chosen.tokens} token${chosen.tokens === 1 ? "" : "s"} added. The desk sends the invoice.` });
      toast(`${chosen.tokens} token${chosen.tokens === 1 ? "" : "s"} added to your balance.`);
      announceTokens();
      reload();
    } catch (err: any) {
      setNotice({ tone: "err", text: err?.message || "The purchase could not be completed." });
    } finally {
      setBuying(false);
    }
  };

  return (
    <div>
      <PageTitle title="Tokens" sub="1 token per leg of a quote request. Once the contract is signed, no more tokens for that trip." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <Kpi title="Balance" value={data.balance} gold sub={`Monthly ${data.buckets.monthly} · free ${data.buckets.free} · paid ${data.buckets.paid}`} />
        <Kpi
          title="Monthly allowance"
          value={data.monthlyAllowance}
          sub={`${data.tier} tier · ${data.monthlyLeft} left · expire ${data.monthlyExpires}`}
        />
        <Kpi title="Earned this year" value={data.earnedThisYear} sub="+1 per completed booking" />
        <Kpi
          title="Returned"
          value={data.returned}
          sub={data.returnedReasons.length ? data.returnedReasons.join(" · ") : "no aircraft · operational cancellation"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        <div className={`${cardCls} overflow-hidden px-3 py-1`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className={thCls}>Date</th>
                  <th className={thCls}>Movement</th>
                  <th className={thCls}>Trip</th>
                  <th className={`${thCls} text-right`}>Tokens</th>
                  <th className={thCls}>Type</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[15px] text-[#93A1B5]">
                      No token movements yet.
                    </td>
                  </tr>
                )}
                {pageRows.map((l) => {
                  const ref = parseRef(l.tripRef);
                  return (
                    <tr key={l.id} className="border-b border-white/[0.05] last:border-0">
                      <td className={`${tdCls} whitespace-nowrap`}>{day(l.at)}</td>
                      <td className={tdCls}>{l.movement}</td>
                      <td className={tdCls}>{ref ? <DocRef value={ref} /> : "—"}</td>
                      <td className={`${tdCls} text-right whitespace-nowrap`}>
                        {l.tokens > 0 ? `+${l.tokens}` : l.tokens < 0 ? `−${Math.abs(l.tokens)}` : "0"}
                      </td>
                      <td className={tdCls}>{l.type}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.ledger.length > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/[0.07] text-[14px] text-[#A8B3C2]">
              <span>
                {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, data.ledger.length)} of {data.ledger.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, current - 1))}
                  disabled={current === 1}
                  className="px-3 py-1.5 rounded-lg border border-[#2A3749] text-white disabled:opacity-40"
                >
                  ‹ Prev
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === pages || Math.abs(n - current) <= 1)
                  .map((n, i, arr) => (
                    <React.Fragment key={n}>
                      {i > 0 && n - arr[i - 1] > 1 && <span className="px-1">…</span>}
                      <button
                        type="button"
                        onClick={() => setPage(n)}
                        className={`min-w-[34px] px-2 py-1.5 rounded-lg border ${
                          n === current ? "bg-[#C9A24A] border-[#C9A24A] text-[#0B121C] font-bold" : "border-[#2A3749] text-white"
                        }`}
                      >
                        {n}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  type="button"
                  onClick={() => setPage(Math.min(pages, current + 1))}
                  disabled={current === pages}
                  className="px-3 py-1.5 rounded-lg border border-[#2A3749] text-white disabled:opacity-40"
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`${cardCls} p-6 self-start`}>
          <h3 className="text-[19px] font-bold text-white m-0 mb-4">Buy tokens</h3>
          <div className="space-y-1">
            {options.map((o) => (
              <button
                key={o.tokens}
                type="button"
                onClick={() => setSelected(o.tokens)}
                className={`w-full flex items-center justify-between text-[17px] px-2 py-1.5 -mx-2 rounded-lg transition-colors ${
                  selected === o.tokens ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                }`}
              >
                <span className="text-white">
                  {o.tokens} token{o.tokens === 1 ? "" : "s"}
                  {o.savePct ? ` · save ${o.savePct}%` : ""}
                </span>
                <span className="text-white font-bold">
                  {o.symbol}
                  {o.price.toLocaleString("en-US")}
                </span>
              </button>
            ))}
          </div>
          <GoldButton className="w-full mt-4 rounded-full" onClick={buy} disabled={buying || !chosen}>
            {buying ? "Working…" : `Buy ${chosen.tokens} token${chosen.tokens === 1 ? "" : "s"}`}
          </GoldButton>
          {notice && <div className={`mt-3 text-[14px] ${notice.tone === "ok" ? "text-[#6BD49E]" : "text-[#F08C8C]"}`}>{notice.text}</div>}
          <p className="text-[15px] text-[#A8B3C2] leading-relaxed mt-4 mb-0">
            Used in this order: monthly, then free, then paid. Paid tokens never expire. Two revisions per request are free before signing; a third
            change is a new request.
          </p>
        </div>
      </div>
    </div>
  );
}
