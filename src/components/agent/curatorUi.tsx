"use client";

/**
 * Shared look of the Curator portal (dark theme, gold accents), as in the designs.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { normalizeBooking, useAviation } from "@/lib/aviationContext";
import type { DocumentType } from "@/lib/aviationContext";
import { invoiceDocBooking, creditNoteDocBooking } from "@/lib/financeDocs";

export const C = {
  page: "#0B121C",
  card: "#111A27",
  cardBorder: "#1E2A3B",
  field: "#0D1520",
  fieldBorder: "#263345",
  gold: "#C9A24A",
  goldHover: "#D7B05A",
  muted: "#93A1B5",
  text: "#E8EDF3"
};

export const cardCls = "bg-[#111A27] border border-[#1E2A3B] rounded-2xl";
export const fieldCls =
  "w-full bg-[#0D1520] border border-[#263345] rounded-lg px-4 py-2.5 text-[15px] text-white placeholder:text-[#5F6E82] focus:outline-none focus:border-[#C9A24A]";
export const labelCls = "block text-[12px] font-semibold tracking-[0.06em] text-[#93A1B5] mb-1.5";
export const thCls = "text-left text-[12px] font-semibold tracking-[0.06em] text-[#93A1B5] px-4 py-3.5 whitespace-nowrap";
export const tdCls = "px-4 py-3.5 text-[15px] text-[#E8EDF3]";
export const goldLinkCls = "text-[#C9A24A] underline underline-offset-4 decoration-1 hover:text-[#D7B05A] text-[15px] font-medium";

export function PageTitle({ title, sub, right }: { title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[32px] leading-tight font-bold text-white tracking-tight m-0">{title}</h1>
        {sub && <p className="text-[15px] text-[#93A1B5] mt-1.5 mb-0">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Card({ children, className = "", title }: { children: React.ReactNode; className?: string; title?: React.ReactNode }) {
  return (
    <div className={`${cardCls} p-6 ${className}`}>
      {title && <h3 className="text-[19px] font-bold text-white m-0 mb-4">{title}</h3>}
      {children}
    </div>
  );
}

export function GoldButton({
  children,
  onClick,
  disabled,
  type = "button",
  className = ""
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-[#C9A24A] hover:bg-[#D7B05A] text-[#0B121C] font-bold text-[15px] px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  className = ""
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`bg-transparent border border-[#2A3749] hover:border-[#3A4A60] hover:bg-white/[0.03] text-white font-bold text-[15px] px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-[15px] font-semibold transition-colors border ${
        active ? "bg-[#C9A24A] border-[#C9A24A] text-[#0B121C]" : "bg-transparent border-[#2A3749] text-[#D5DCE5] hover:border-[#3A4A60]"
      }`}
    >
      {children}
    </button>
  );
}

export type Tone = "green" | "amber" | "slate" | "red" | "grey";
const TONES: Record<Tone, string> = {
  green: "bg-[#17372A] text-[#6BD49E]",
  amber: "bg-[#3A2A10] text-[#F0B54C]",
  slate: "bg-[#1A2738] text-[#C7D1DE]",
  red: "bg-[#3A1A1F] text-[#F08C8C]",
  grey: "bg-[#1A2230] text-[#93A1B5]"
};
export function Badge({ tone = "slate", children, className = "" }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[13px] font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}>{children}</span>;
}

export interface Ref {
  prefix: string;
  token: string;
  suffix?: string;
}

/** A document number as in the designs: small prefix and version, bold code (monospace in tables). */
export function DocRef({ value, className = "", mono = true }: { value?: Ref | null; className?: string; mono?: boolean }) {
  if (!value || !value.token) return <span className={className}>—</span>;
  return (
    <span className={`inline-flex items-baseline whitespace-nowrap ${mono ? "font-mono" : ""} ${className}`}>
      {value.prefix && <span className="text-[0.62em] uppercase">{value.prefix}-</span>}
      <span className="font-bold">{value.token}</span>
      {value.suffix && <span className="text-[0.62em]">{value.suffix}</span>}
    </span>
  );
}

/** Heading ID in gold: "TRI-FE4578 · Ibiza → Geneva". */
export function HeadingRef({ value }: { value?: Ref | null }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-baseline font-mono text-[#C9A24A] whitespace-nowrap">
      <span className="text-[0.62em] font-bold">{value.prefix}-</span>
      <span className="font-bold">{value.token}</span>
      {value.suffix && <span className="text-[0.62em] font-bold">{value.suffix}</span>}
    </span>
  );
}

export const refText = (r?: Ref | null) => (r ? `${r.prefix ? `${r.prefix}-` : ""}${r.token}${r.suffix || ""}` : "");

const SYMBOL: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", CHF: "CHF" };
export const money = (n: number | null | undefined, currency = "EUR", decimals = 0) =>
  n === null || n === undefined
    ? "—"
    : `${SYMBOL[currency] || currency} ${Number(n).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

/** Loads data from the backend with loading / error state and a reload function. */
export function useLoad<T>(fetcher: () => Promise<{ data: T } | any>, deps: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetcher();
      if (alive.current) {
        setData((res && res.data) as T);
        setError(null);
      }
    } catch (err: any) {
      if (alive.current) setError(err?.message || "Could not load. Check your connection and try again.");
    } finally {
      if (alive.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    alive.current = true;
    reload();
    return () => {
      alive.current = false;
    };
  }, [reload]);
  return { data, error, loading, reload, setData };
}

export function LoadState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry?: () => void }) {
  if (error)
    return (
      <div className={`${cardCls} p-6 text-[15px] text-[#F08C8C] flex items-center justify-between gap-4`}>
        <span>{error}</span>
        {onRetry && (
          <button type="button" onClick={onRetry} className={goldLinkCls}>
            Try again
          </button>
        )}
      </div>
    );
  if (loading) return <div className={`${cardCls} p-6 text-[15px] text-[#93A1B5]`}>Loading…</div>;
  return null;
}

/** Tells the top bar to refresh the token balance. */
export const announceTokens = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("curator-tokens-changed"));
};

/** Opens a trip document (quote, contract, invoice, credit note, brief) in the document viewer. */
export function useOpenTripDocument() {
  const { openDocument } = useAviation();
  const [busy, setBusy] = useState<string | null>(null);
  const open = async (
    key: string,
    bookingId: string,
    docType: DocumentType,
    extra?: { invoice?: { number: string; amount: number }; creditNote?: any }
  ) => {
    setBusy(key);
    try {
      const res: any = await api.bookings.get(bookingId);
      let booking = normalizeBooking(res?.data || res);
      if (docType === "invoice" && extra?.invoice) booking = invoiceDocBooking(booking, extra.invoice);
      if (docType === "credit_note" && extra?.creditNote) booking = creditNoteDocBooking(booking, extra.creditNote);
      openDocument(booking, docType);
    } catch (err: any) {
      alert(err?.message || "The document could not be opened.");
    } finally {
      setBusy(null);
    }
  };
  return { open, busy };
}

export function Modal({ title, onClose, children, width = "max-w-lg" }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode; width?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className={`${cardCls} w-full ${width} p-6 shadow-2xl max-h-[90vh] overflow-y-auto`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="text-[19px] font-bold text-white m-0">{title}</h3>
          <button type="button" onClick={onClose} className="text-[#93A1B5] hover:text-white text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Reads a file into a data URL (for proof of payment). */
export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("The file could not be read."));
    r.readAsDataURL(file);
  });
