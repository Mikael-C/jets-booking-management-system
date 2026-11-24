"use client";

import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money, shortDay } from "@/lib/financeDocs";

interface PayInfo {
  invoiceNumber: string;
  purpose: string;
  trip: string;
  client: string;
  amount: number;
  open: number;
  currency: string;
  dueDate: string | null;
  status: string;
  proofUploaded: boolean;
  card: boolean;
  checkoutUrl: string;
  bank: { accountHolder: string; bankName: string; iban: string; bic: string; reference: string };
}

const MAX_FILE = 5 * 1024 * 1024;

/** Public page behind "Generate payment link": the client pays by card or uploads proof of a bank transfer. */
export default function PayPage({ params }: { params: { token: string } }) {
  const [info, setInfo] = useState<PayInfo | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [payerName, setPayerName] = useState("");
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<{ name: string; url: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState("");

  const load = useCallback(async () => {
    try {
      const paidReturn = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("paid") === "1";
      const res = paidReturn ? await api.pay.check(params.token) : await api.pay.get(params.token);
      setInfo(res.data);
      setState("ready");
      if (paidReturn && res.data.open <= 0.005) setDone("Thank you, your card payment has been received.");
    } catch (err: any) {
      setError(err?.message || "This payment link could not be opened.");
      setState("error");
    }
  }, [params.token]);

  useEffect(() => {
    load();
  }, [load]);

  const onFile = (f?: File) => {
    if (!f) return;
    if (f.size > MAX_FILE) {
      setError("The file is larger than 5 MB. Please upload a smaller screenshot or PDF.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => setFile({ name: f.name, url: String(reader.result || "") });
    reader.readAsDataURL(f);
  };

  const sendProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !reference.trim()) {
      setError("Attach the transfer confirmation or type the bank reference.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await api.pay.proof(params.token, { payerName, reference, proofName: file?.name, proofUrl: file?.url });
      setInfo(res.data);
      setDone("Thank you. We have your transfer confirmation and will confirm as soon as the money arrives.");
    } catch (err: any) {
      setError(err?.message || "The confirmation could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-[#C9A54C]" />
          <span className="text-xl font-bold text-slate-900">Orbelo</span>
        </div>

        {state === "loading" && <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">Loading…</div>}

        {state === "error" && <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-rose-700 text-sm">{error}</div>}

        {state === "ready" && info && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
              <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {info.invoiceNumber} · {info.trip}
              </div>
              <div className="text-3xl font-bold text-slate-900">{money(info.open, info.currency)}</div>
              <div className="text-sm text-slate-600">
                {info.purpose} · {info.client}
                {info.dueDate ? ` · due ${shortDay(info.dueDate)}` : ""}
              </div>
              {info.open <= 0.005 && <div className="text-emerald-700 font-semibold text-sm">This invoice is paid. Thank you.</div>}
              {info.open > 0.005 && info.proofUploaded && !done && (
                <div className="text-amber-800 text-sm">Your transfer confirmation was received and is being checked.</div>
              )}
            </div>

            {done && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-5 py-4 text-sm">{done}</div>}

            {info.open > 0.005 && info.card && info.checkoutUrl && (
              <a
                href={info.checkoutUrl}
                className="block w-full text-center bg-[#0B1320] hover:bg-slate-800 text-white px-4 py-3 rounded-lg font-semibold"
              >
                Pay {money(info.open, info.currency)} by card
              </a>
            )}

            {info.open > 0.005 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900 m-0">Pay by bank transfer</h2>
                <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-y-1.5 text-sm">
                  <span className="text-slate-500">Account holder</span>
                  <span className="text-slate-900">{info.bank.accountHolder || "—"}</span>
                  <span className="text-slate-500">Bank</span>
                  <span className="text-slate-900">{info.bank.bankName || "—"}</span>
                  <span className="text-slate-500">IBAN</span>
                  <span className="text-slate-900 font-mono break-all">{info.bank.iban || "—"}</span>
                  <span className="text-slate-500">BIC</span>
                  <span className="text-slate-900 font-mono">{info.bank.bic || "—"}</span>
                  <span className="text-slate-500">Reference</span>
                  <span className="text-slate-900 font-mono">{info.bank.reference}</span>
                </div>

                <form onSubmit={sendProof} className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="text-sm font-semibold text-slate-900 pt-2">Already paid? Send us the confirmation</div>
                  <input
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Name on the transfer"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
                  />
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Bank reference (optional if you attach a file)"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
                  />
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => onFile(e.target.files?.[0])} className="block w-full text-sm" />
                  {file && <div className="text-xs text-slate-500">Attached: {file.name}</div>}
                  {error && <div className="text-sm text-rose-700">{error}</div>}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 px-4 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
                  >
                    {sending ? "Sending…" : "Send transfer confirmation"}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
