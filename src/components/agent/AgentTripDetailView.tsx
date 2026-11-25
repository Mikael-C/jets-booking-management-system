"use client";
import React, { useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { DocumentType } from "@/lib/aviationContext";
import {
  Badge,
  Card,
  DocRef,
  GhostButton,
  GoldButton,
  HeadingRef,
  LoadState,
  Modal,
  Ref,
  Tone,
  fieldCls,
  goldLinkCls,
  labelCls,
  money,
  readFileAsDataUrl,
  useLoad,
  useOpenTripDocument
} from "./curatorUi";

interface TripData {
  token: string;
  bookingId: string;
  ref: Ref;
  title: string;
  sub: string[];
  badges: { contract: "signed" | "awaiting"; open: number; missingPassports: number; cancelled: boolean };
  currency: string;
  invoices: { number: string; label: string; amount: number; open: number; status: { text: string; tone: Tone } }[];
  canUploadProof: boolean;
  passengers: { id: string; name: string; complete: boolean; nationality: string; passportExpiry: string }[];
  documents: {
    label: string;
    ref: Ref | null;
    bookingId: string;
    docType: DocumentType;
    ready: boolean;
    invoice?: { number: string; amount: number };
    creditNote?: any;
  }[];
  commission: { pct: number; amount: number; currency: string; note: string };
}

const INV_RE = /^INV-([A-Z0-9]+)(-\d{3}-\d+)$/i;
const invRef = (n: string): Ref => {
  const m = n.match(INV_RE);
  return m ? { prefix: "INV", token: m[1], suffix: m[2] } : { prefix: "", token: n };
};

export default function AgentTripDetailView({ tripId }: { tripId: string }) {
  const id = decodeURIComponent(tripId);
  const { data: t, error, loading, reload } = useLoad<TripData>(() => api.curator.trip(id), [id]);
  const { open, busy } = useOpenTripDocument();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [passportOpen, setPassportOpen] = useState(false);
  const [passportForm, setPassportForm] = useState<Record<string, { passportNumber: string; nationality: string; passportExpiry: string; dateOfBirth: string }>>({});
  const [sendingPassports, setSendingPassports] = useState(false);

  if (!t) {
    return (
      <div className="space-y-4">
        <Link href="/agent/trips" className={goldLinkCls}>
          ← My trips
        </Link>
        <LoadState loading={loading} error={error} onRetry={reload} />
      </div>
    );
  }

  const onFile = async (file?: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setNotice({ tone: "err", text: "The file is larger than 4 MB. Send a smaller PDF or image." });
      return;
    }
    setUploading(true);
    setNotice(null);
    try {
      const proofUrl = await readFileAsDataUrl(file);
      const res = await api.curator.uploadProof(t.token, { proofUrl, proofName: file.name });
      setNotice({ tone: "ok", text: `Proof uploaded for ${res?.data?.invoiceNumber || "the open invoice"}. The desk confirms once the money arrives.` });
      reload();
    } catch (err: any) {
      setNotice({ tone: "err", text: err?.message || "The proof could not be uploaded." });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const missing = t.passengers.filter((p) => !p.complete);
  const openPassports = () => {
    const init: typeof passportForm = {};
    missing.forEach((p) => (init[p.id] = { passportNumber: "", nationality: p.nationality || "", passportExpiry: p.passportExpiry || "", dateOfBirth: "" }));
    setPassportForm(init);
    setPassportOpen(true);
  };
  const sendPassports = async () => {
    const list = missing
      .map((p) => ({ id: p.id, name: p.name, ...passportForm[p.id] }))
      .filter((p) => p.passportNumber && p.passportNumber.trim());
    if (!list.length) return;
    setSendingPassports(true);
    try {
      await api.curator.sendPassports(t.token, list);
      setPassportOpen(false);
      setNotice({ tone: "ok", text: `Passport details sent for ${list.length} passenger${list.length === 1 ? "" : "s"}.` });
      reload();
    } catch (err: any) {
      alert(err?.message || "The passport details could not be sent.");
    } finally {
      setSendingPassports(false);
    }
  };

  return (
    <div>
      <h1 className="text-[40px] leading-tight font-bold text-white tracking-tight m-0 flex flex-wrap items-baseline gap-x-3">
        <HeadingRef value={t.ref} />
        <span>·</span>
        <span>{t.title}</span>
      </h1>
      <p className="text-[15px] text-[#93A1B5] mt-1.5 mb-4">{t.sub.join(" · ")}</p>
      <div className="flex flex-wrap gap-2.5 mb-6">
        {t.badges.cancelled ? (
          <Badge tone="red">Cancelled</Badge>
        ) : t.badges.contract === "signed" ? (
          <Badge tone="green">Contract signed</Badge>
        ) : (
          <Badge tone="amber">Contract awaiting signature</Badge>
        )}
        {t.badges.open > 0 && <Badge tone="amber">{money(t.badges.open, t.currency)} open</Badge>}
        {t.badges.missingPassports > 0 && (
          <Badge tone="amber">
            ▲ {t.badges.missingPassports} passport{t.badges.missingPassports === 1 ? "" : "s"} missing
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        <div className="space-y-6">
          <Card title="Payment">
            {t.invoices.length === 0 ? (
              <p className="text-[15px] text-[#93A1B5] m-0">No invoice yet. It appears here when the desk issues it.</p>
            ) : (
              <div className="space-y-2.5">
                {t.invoices.map((inv) => (
                  <div key={inv.number} className="flex items-center justify-between gap-4">
                    <span className="text-[17px] text-white">
                      <DocRef value={invRef(inv.number)} mono={false} /> · {inv.label}
                    </span>
                    <Badge tone={inv.status.tone} className="min-w-[180px] justify-start">
                      {inv.status.text}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {t.canUploadProof && (
              <div
                className="mt-5 border-2 border-dashed border-[#2A3749] rounded-xl px-6 py-7 text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onFile(e.dataTransfer.files?.[0]);
                }}
              >
                <div className="text-[19px] font-bold text-white">Client paid? Upload the transfer proof</div>
                <div className="text-[15px] text-[#93A1B5] mt-1">The desk confirms once the money arrives. Until then it shows amber.</div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <GhostButton className="mt-4" disabled={uploading} onClick={() => fileInput.current?.click()}>
                  {uploading ? "Uploading…" : "Choose file"}
                </GhostButton>
              </div>
            )}
            {notice && <div className={`mt-4 text-[14px] ${notice.tone === "ok" ? "text-[#6BD49E]" : "text-[#F08C8C]"}`}>{notice.text}</div>}
          </Card>

          <Card title="Passengers">
            {t.passengers.length === 0 ? (
              <p className="text-[15px] text-[#93A1B5] m-0">No passengers on the manifest yet.</p>
            ) : (
              <div className="space-y-2.5">
                {t.passengers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4">
                    <span className="text-[17px] text-white">{p.name}</span>
                    {p.complete ? <Badge tone="green">Complete</Badge> : <Badge tone="amber">▲ Passport</Badge>}
                  </div>
                ))}
              </div>
            )}
            {missing.length > 0 && (
              <GhostButton className="mt-5" onClick={openPassports}>
                Send passport details
              </GhostButton>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Documents">
            <div className="space-y-2.5">
              {t.documents.map((d, i) => {
                const key = `${d.docType}-${i}`;
                return (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <span className="text-[17px] text-white">
                      {d.label} {d.ref && <DocRef value={d.ref} mono={false} className="text-[15px]" />}
                    </span>
                    {d.ready ? (
                      <button
                        type="button"
                        disabled={busy === key}
                        onClick={() => open(key, d.bookingId, d.docType, { invoice: d.invoice, creditNote: d.creditNote })}
                        className={`${goldLinkCls} disabled:opacity-50`}
                      >
                        {busy === key ? "…" : "PDF"}
                      </button>
                    ) : (
                      <span className="text-[15px] text-[#93A1B5]">when ready</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="My commission">
            <div className="flex items-center justify-between text-[17px] text-white">
              <span>{t.commission.pct ? `${t.commission.pct} % of charter` : "Commission"}</span>
              <span>{money(t.commission.amount, t.commission.currency, 2)}</span>
            </div>
            <div className="text-[15px] text-[#93A1B5] mt-2">{t.commission.note}</div>
          </Card>
        </div>
      </div>

      {passportOpen && (
        <Modal title="Send passport details" onClose={() => setPassportOpen(false)} width="max-w-2xl">
          <div className="space-y-5">
            {missing.map((p) => {
              const f = passportForm[p.id] || { passportNumber: "", nationality: "", passportExpiry: "", dateOfBirth: "" };
              const set = (k: keyof typeof f, v: string) => setPassportForm((prev) => ({ ...prev, [p.id]: { ...f, [k]: v } }));
              return (
                <div key={p.id}>
                  <div className="text-[16px] font-bold text-white mb-2">{p.name}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className={labelCls}>Passport no.</label>
                      <input className={fieldCls} value={f.passportNumber} onChange={(e) => set("passportNumber", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Nationality</label>
                      <input className={fieldCls} value={f.nationality} onChange={(e) => set("nationality", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Expires</label>
                      <input type="date" className={fieldCls} value={f.passportExpiry} onChange={(e) => set("passportExpiry", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Date of birth</label>
                      <input type="date" className={fieldCls} value={f.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end mt-6">
            <GoldButton onClick={sendPassports} disabled={sendingPassports || !Object.values(passportForm).some((f) => f.passportNumber.trim())}>
              {sendingPassports ? "Sending…" : "Send to the desk"}
            </GoldButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
