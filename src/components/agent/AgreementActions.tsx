"use client";

/**
 * The Curator's two steps towards a booking:
 *   Confirm — the client agrees to the quote; the desk is told and prepares the charter agreement.
 *   Upload signed agreement — once the desk has sent the agreement and the client has signed it;
 *   the desk confirms the signed copy and books the trip.
 */
import React, { useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toaster";
import { GoldButton, Modal, fieldCls, labelCls } from "./curatorUi";

const MAX_FILE = 6 * 1024 * 1024;

export const announceDealChanged = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("curator-messages-changed"));
};

export function ConfirmQuoteButton({
  quoteId,
  refLabel,
  onDone,
  className = ""
}: {
  quoteId: string;
  refLabel: string;
  onDone?: () => void;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const confirm = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (busy) return;
    if (!window.confirm(`Confirm ${refLabel}? The desk is told the client agrees and prepares the charter agreement.`)) return;
    setBusy(true);
    try {
      await api.curator.confirmQuote(quoteId);
      toast(`${refLabel} confirmed. The desk will send the charter agreement.`);
      announceDealChanged();
      onDone?.();
    } catch (err: any) {
      toast(err?.message || "The quote could not be confirmed.", "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={confirm}
      disabled={busy}
      className={`bg-[#C9A24A] hover:bg-[#D7B05A] text-[#0B121C] font-bold text-[13px] px-3.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${className}`}
    >
      {busy ? "Confirming…" : "Confirm"}
    </button>
  );
}

export function UploadSignedButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`bg-[#C9A24A] hover:bg-[#D7B05A] text-[#0B121C] font-bold text-[13px] px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${className}`}
    >
      Upload signed agreement
    </button>
  );
}

export function UploadSignedModal({
  target,
  refLabel,
  defaultSigner = "",
  onClose,
  onDone
}: {
  target: { quoteId?: string; requestId?: string };
  refLabel: string;
  defaultSigner?: string;
  onClose: () => void;
  onDone?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; url: string } | null>(null);
  const [signerName, setSignerName] = useState(defaultSigner);
  const [signerPosition, setSignerPosition] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = (f?: File | null) => {
    if (!f) return;
    if (!/^(application\/pdf|image\/(png|jpeg))$/.test(f.type)) {
      toast("Upload a PDF, PNG or JPEG.", "error");
      return;
    }
    if (f.size > MAX_FILE) {
      toast("The file is larger than 6 MB.", "error");
      return;
    }
    const r = new FileReader();
    r.onload = () => setFile({ name: f.name, url: String(r.result || "") });
    r.onerror = () => toast("The file could not be read.", "error");
    r.readAsDataURL(f);
  };

  const send = async () => {
    if (!file || !signerName.trim() || busy) return;
    setBusy(true);
    try {
      await api.curator.uploadSignedAgreement(target, {
        file: file.url,
        fileName: file.name,
        signerName: signerName.trim(),
        signerPosition: signerPosition.trim()
      });
      toast(`Signed ${refLabel} sent to the desk. They confirm it and book the trip.`);
      announceDealChanged();
      onDone?.();
      onClose();
    } catch (err: any) {
      toast(err?.message || "The signed agreement could not be uploaded.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Upload signed agreement · ${refLabel}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-[15px] text-[#93A1B5] m-0">
          Upload the charter agreement your client signed. The desk checks it, confirms it and books the trip; it then moves to My trips.
        </p>
        <div>
          <label className={labelCls}>Signed agreement (PDF or image, up to 6 MB)</label>
          <input ref={input} type="file" accept="application/pdf,image/png,image/jpeg" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="w-full border border-dashed border-[#263345] rounded-lg px-4 py-4 text-[15px] text-[#A8B3C2] hover:border-[#C9A24A] text-left"
          >
            {file ? file.name : "Choose the file…"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Signed by</label>
            <input className={fieldCls} value={signerName} onChange={(e) => setSignerName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Position</label>
            <input className={fieldCls} value={signerPosition} onChange={(e) => setSignerPosition(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <GoldButton onClick={send} disabled={!file || !signerName.trim() || busy}>
            {busy ? "Sending…" : "Send to the desk"}
          </GoldButton>
        </div>
      </div>
    </Modal>
  );
}

/** Downloads a stored file of a quote or trip (signed copy uploaded, signed agreement, signature certificate). */
export async function downloadCuratorFile(id: string, kind: "agreement" | "certificate" | "signed_upload") {
  try {
    const res = await api.curator.tripFile(id, kind);
    const a = document.createElement("a");
    a.href = res.data.dataUrl;
    a.download = res.data.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err: any) {
    toast(err?.message || "The file could not be opened.", "error");
  }
}
