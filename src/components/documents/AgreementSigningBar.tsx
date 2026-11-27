"use client";

import React, { useState } from "react";
import type { Booking } from "@/types/aviation";
import { api } from "@/lib/api";
import { useAviation } from "@/lib/aviationContext";
import { toast } from "@/components/ui/Toaster";
import { agreementLinksFor, agreementNo, fmtDate } from "@/lib/documentData";

const MAX_FILE = 6 * 1024 * 1024;

/**
 * Desk bar above the charter agreement (R-093): signing status, the client's signing link, a wet-signed upload
 * that the MD confirms (it then does everything an online signature does), and the signed files.
 */
export default function AgreementSigningBar({ booking }: { booking: Booking }) {
  const { currentUser, refreshBookings } = useAviation() as any;
  const b: any = booking;
  const sig = b.contractSignature;
  const wet = b.wetSignature;
  const signed = Boolean(booking.isContractSigned);
  const links = agreementLinksFor(booking);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<{ name: string; url: string } | null>(null);
  const [signerName, setSignerName] = useState(b.authorisedOwnerName || booking.client?.fullName || "");
  const [signerPosition, setSignerPosition] = useState("");
  const [busy, setBusy] = useState(false);
  // The MD (super admin) or an admin confirms a signed copy and books the trip
  const isMd = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  // Curators see the agreement only; signing tools are the desk's
  if (currentUser?.role === "agent") return null;

  const pick = (f?: File) => {
    if (!f) return;
    if (f.size > MAX_FILE) {
      toast("The file is larger than 6 MB.", "error");
      return;
    }
    const r = new FileReader();
    r.onload = () => setFile({ name: f.name, url: String(r.result || "") });
    r.readAsDataURL(f);
  };

  const refresh = () => (typeof refreshBookings === "function" ? refreshBookings().catch(() => undefined) : undefined);

  const upload = async () => {
    if (!file || !signerName.trim()) {
      toast("Attach the signed copy and enter who signed.", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await api.agreements.uploadWet(booking.id, { file: file.url, fileName: file.name, signerName: signerName.trim(), signerPosition: signerPosition.trim() });
      toast(res?.message || "Signed copy uploaded. The MD confirms it.");
      setOpen(false);
      setFile(null);
      refresh();
    } catch (err: any) {
      toast(err?.message || "The signed copy could not be uploaded.", "error");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!window.confirm(`Confirm the wet-signed ${agreementNo(booking)}? The trip is booked, the countersigned copy is emailed and the first invoice is issued.`)) return;
    setBusy(true);
    try {
      const res = await api.agreements.confirmWet(booking.id, window.location.origin);
      toast(`Confirmed. Booking ${res.data?.tripNumber || ""} is confirmed${res.data?.invoice ? `; invoice ${res.data.invoice.number} issued` : ""}.`);
      refresh();
    } catch (err: any) {
      toast(err?.message || "The signed copy could not be confirmed.", "error");
    } finally {
      setBusy(false);
    }
  };

  const download = async (kind: "agreement" | "certificate" | "signed_upload") => {
    try {
      const res = await api.agreements.file(booking.id, kind);
      const a = document.createElement("a");
      a.href = res.data.dataUrl;
      a.download = res.data.fileName;
      a.click();
    } catch (err: any) {
      toast(err?.message || "The file could not be opened.", "error");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(links.signHref);
      toast("Signing link copied.");
    } catch {
      toast("The link could not be copied.", "error");
    }
  };

  const btn = "px-3 py-1.5 rounded-md text-[12px] font-semibold border border-white/15 text-white hover:bg-white/10 disabled:opacity-50";

  return (
    <div className="max-w-[794px] mx-auto mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[12.5px] text-slate-200 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {signed ? (
            <span className="text-emerald-300 font-semibold">
              Signed {sig?.method === "wet" ? "by hand" : "online"}
              {sig?.name || booking.contractSignedBy ? ` by ${sig?.name || booking.contractSignedBy}` : ""}
              {sig?.signedAt || booking.contractSignedDate ? ` · ${fmtDate(sig?.signedAt || booking.contractSignedDate)}` : ""}
              {b.countersignature ? ` · countersigned by ${b.countersignature.name}` : ""}
            </span>
          ) : wet?.uploadedAt && !wet?.confirmedAt ? (
            <span className="text-amber-300 font-semibold">
              Signed copy uploaded by {wet.uploadedBy}
              {wet.uploadedByRole === "curator" ? " (Curator)" : ""}
              {wet.signerName ? ` · signed by ${wet.signerName}` : ""} · waiting for confirmation
            </span>
          ) : (
            <span className="text-slate-300">Waiting for the client&apos;s signature</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!signed && links.signHref && (
            <button type="button" className={btn} onClick={copyLink}>
              Copy signing link
            </button>
          )}
          {!signed && !(wet?.uploadedAt && !wet?.confirmedAt) && (
            <button type="button" className={btn} onClick={() => setOpen(!open)}>
              Upload wet-signed copy
            </button>
          )}
          {!signed && wet?.uploadedAt && !wet?.confirmedAt && (
            <button type="button" className={btn} onClick={() => download("signed_upload")}>
              View signed copy
            </button>
          )}
          {!signed && wet?.uploadedAt && !wet?.confirmedAt && isMd && (
            <button type="button" className={`${btn} !bg-emerald-600 !border-emerald-600`} disabled={busy} onClick={confirm}>
              Confirm signed copy and book
            </button>
          )}
          {signed && (b.signedDocuments || sig) && (
            <>
              <button type="button" className={btn} onClick={() => download("agreement")}>
                Signed copy
              </button>
              <button type="button" className={btn} onClick={() => download("certificate")}>
                Certificate
              </button>
            </>
          )}
        </div>
      </div>
      {open && !signed && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
          <label className="text-[11px] text-slate-400">
            Signed copy (PDF or image)
            <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e) => pick(e.target.files?.[0])} className="block w-full text-[12px] text-slate-200 mt-1" />
          </label>
          <label className="text-[11px] text-slate-400">
            Signed by
            <input value={signerName} onChange={(e) => setSignerName(e.target.value)} className="block w-full mt-1 rounded-md bg-white/10 border border-white/15 px-2 py-1.5 text-white" />
          </label>
          <label className="text-[11px] text-slate-400">
            Position
            <input value={signerPosition} onChange={(e) => setSignerPosition(e.target.value)} className="block w-full mt-1 rounded-md bg-white/10 border border-white/15 px-2 py-1.5 text-white" />
          </label>
          <button type="button" className={`${btn} !bg-[#C9A24A] !text-[#0B121C] !border-[#C9A24A]`} disabled={busy} onClick={upload}>
            Upload
          </button>
        </div>
      )}
    </div>
  );
}
