"use client";

/**
 * Shared layout of the printed documents (A4): letterhead, meta block, sections, footer.
 * Company details always come from Settings; a missing setting prints as a highlighted
 * [placeholder] so it is easy to spot and fill in.
 */
import React from "react";
import type { AppSettings } from "@/types/aviation";
import { useAviation } from "@/lib/aviationContext";
import { initialSettings } from "@/data/initialSettings";
import { api } from "@/lib/api";

export const mono = "font-mono";

/** Highlighted placeholder, or the value when there is one. */
export function Ph({ value, label, className = "" }: { value?: React.ReactNode; label: string; className?: string }) {
  const empty = value === undefined || value === null || (typeof value === "string" && !value.trim());
  if (!empty) return <>{value}</>;
  return <span className={`bg-[#FEF3C7] text-[#8A5A00] px-1 rounded-[3px] ${className}`}>[{label}]</span>;
}

export function useDocSettings(): AppSettings {
  const { settings } = useAviation();
  const s = settings || initialSettings;
  return { ...initialSettings, ...s, company: { ...initialSettings.company, ...(s.company || {}) } } as AppSettings;
}

/** One A4 page. */
export function DocPage({ children, footerLeft, page, pages }: { children: React.ReactNode; footerLeft: string; page: number; pages: number }) {
  return (
    <div className="doc-page w-full max-w-[794px] mx-auto min-h-[1123px] bg-white text-[#111827] px-[56px] pt-[50px] pb-[34px] shadow-xl border border-slate-200 mb-8 print:mb-0 print:border-none print:shadow-none flex flex-col box-border font-sans text-[13px] leading-[1.45] break-after-page">
      <div className="flex-1" data-doc-body>
        {children}
      </div>
      <div data-doc-footer className="mt-8 pt-3 border-t border-[#D1D5DB] flex items-center justify-between text-[11px] text-[#6B7280] select-none">
        <span className={mono}>{footerLeft}</span>
        <span data-doc-pageno>
          Page {page} / {pages}
        </span>
      </div>
    </div>
  );
}

/** ORBELO letterhead with the company's legal details from Settings, and the gold rule. */
export function Letterhead() {
  const { company } = useDocSettings();
  const regLine = [company.registrationNumber, company.vatNumber ? `VAT ${company.vatNumber}` : ""].filter(Boolean).join(" · ");
  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-[30px] h-[30px] rounded-[8px] bg-[#111827] flex items-center justify-center shrink-0">
            <div className="w-[12px] h-[12px] rounded-[3px] bg-[#C9A24A]" />
          </div>
          <div className="leading-tight">
            <div className="text-[19px] font-bold tracking-[0.02em] text-[#111827]">{(company.name || "Orbelo").split(" ")[0].toUpperCase()}</div>
            <div className="text-[11px] text-[#4B5563]">Private jet charter</div>
          </div>
        </div>
        <div className="text-right text-[11.5px] leading-[1.35] text-[#4B5563] space-y-[2px]">
          <div>
            <Ph value={company.legalEntity} label="Company legal name" />
          </div>
          <div>
            <Ph value={company.address} label="Registered address" />
          </div>
          <div>
            <Ph value={regLine} label="Company no. · VAT no." />
          </div>
          <div>
            {company.email || "charter@orbelo.com"} · <Ph value={company.phone} label="phone" />
          </div>
        </div>
      </div>
      <div className="h-[2px] bg-[#C9A24A] mt-5 mb-6" />
    </div>
  );
}

/** Big title on the left, label/value pairs on the right. */
export function TitleBlock({ title, meta }: { title: string; meta: { label: string; value: React.ReactNode; mono?: boolean }[] }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-6">
      <h1 className="text-[31px] leading-none font-bold tracking-tight text-[#111827] m-0 pb-[2px]">{title}</h1>
      <div className="grid grid-cols-[auto_auto] gap-x-10 gap-y-[5px] text-[13px]">
        {meta.map((m) => (
          <React.Fragment key={m.label}>
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#4B5563] self-center">{m.label}</span>
            <span className={`text-right ${m.mono ? mono : ""}`}>{m.value}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-[11px] font-semibold tracking-[0.12em] uppercase text-[#4B5563] ${className}`}>{children}</div>
);
export const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-[13px] font-bold tracking-[0.08em] uppercase text-[#111827] m-0 ${className}`}>{children}</h3>
);

export function PartyBlock({ label, party }: { label: string; party: { name: string; attn: string; lines: string[]; account: string } }) {
  return (
    <div>
      <Label className="mb-2">{label}</Label>
      <div className="font-bold">{party.name || <Ph label="Client name" />}</div>
      {party.attn && <div>Attn: {party.attn}</div>}
      {party.lines.map((l) => (
        <div key={l}>{l}</div>
      ))}
      {party.account && (
        <div>
          Account <span className={mono}>{party.account}</span>
        </div>
      )}
    </div>
  );
}

export function RepBlock({ label, rep }: { label: string; rep: { name: string; email: string; phone: string } }) {
  return (
    <div>
      <Label className="mb-2">{label}</Label>
      <div>{rep.name || <Ph label="Representative" />}</div>
      {rep.email && <div>{rep.email}</div>}
      {rep.phone && <div>{rep.phone}</div>}
    </div>
  );
}

export function PhotoBox({ src, label }: { src?: string; label: string }) {
  return (
    <div className="h-[64px] rounded-[6px] border border-[#D1D5DB] bg-[#F3F4F6] overflow-hidden flex items-center justify-center text-[11px] text-[#6B7280]">
      {src ? <img src={src} alt={label} className="w-full h-full object-cover" /> : label}
    </div>
  );
}

/** Table row with a light divider; amount right-aligned. */
export function AmountRow({ label, amount, bold = false, border = "light" }: { label: React.ReactNode; amount: React.ReactNode; bold?: boolean; border?: "light" | "dark" | "none" }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-6 px-[6px] py-[7px] ${
        border === "dark" ? "border-b-2 border-[#111827]" : border === "light" ? "border-b border-[#E5E7EB]" : ""
      } ${bold ? "font-bold" : ""}`}
    >
      <span>{label}</span>
      <span className="whitespace-nowrap text-right">{amount}</span>
    </div>
  );
}

export const thCls = "text-left text-[11px] font-semibold tracking-[0.12em] uppercase text-[#4B5563] py-[7px] px-[6px]";

/** The trip's money ledger (invoices, credit notes, payments) from the backend; null while loading or offline. */
export function useLedger(bookingId?: string) {
  const [ledger, setLedger] = React.useState<any | null>(null);
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");
  React.useEffect(() => {
    if (!bookingId) {
      setState("error");
      return;
    }
    let alive = true;
    setState("loading");
    api.registry
      .ledger(bookingId)
      .then((res: any) => {
        if (!alive) return;
        setLedger(res?.data || null);
        setState(res?.data ? "ready" : "error");
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [bookingId]);
  return { ledger, state };
}
