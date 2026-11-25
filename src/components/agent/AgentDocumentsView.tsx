"use client";
import React, { useState } from "react";
import { api } from "@/lib/api";
import type { DocumentType } from "@/lib/aviationContext";
import { Badge, DocRef, LoadState, PageTitle, Ref, cardCls, goldLinkCls, tdCls, thCls, useLoad, useOpenTripDocument } from "./curatorUi";

interface SharedDoc {
  code: string;
  title: string;
  note: string;
  noteBold: boolean;
  version: string;
  updated: string;
  kind: "agreement" | "conduct" | "kit" | "brochure" | "pdf";
  acknowledged: boolean;
  signed: boolean;
}
interface DeskDoc {
  key: string;
  label: string;
  ref: Ref;
  title: string;
  version: string;
  updated: string;
  bookingId: string;
  docType: DocumentType;
  invoice?: { number: string; amount: number };
  creditNote?: any;
}
interface DocsData {
  shared: SharedDoc[];
  desk: DeskDoc[];
  user: { name: string; email: string };
}

const esc = (s: string) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

/** Opens a shared document as a printable page carrying the Curator's name and the date. */
function printLibraryDocument(d: any, forward = false) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Allow pop-ups for this site to download the PDF.");
    return;
  }
  const date = new Date(d.downloadedAt || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const body = esc(d.content || d.description || "").replace(/\n/g, "<br/>");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(d.title)} ${esc(d.version)}</title>
<style>
body{font-family:Inter,Arial,sans-serif;color:#0B121C;margin:48px;line-height:1.55}
h1{font-size:26px;margin:0 0 4px}
.meta{color:#5F6E82;font-size:13px;margin-bottom:28px}
.mark{position:fixed;bottom:24px;left:48px;right:48px;font-size:11px;color:#8C96A3;border-top:1px solid #E3E7EC;padding-top:8px}
.empty{color:#8C96A3;font-style:italic}
</style></head><body>
<h1>${esc(d.title)}</h1>
<div class="meta">${esc(d.code)} · ${esc(d.version)} · updated ${esc(d.updated)}${d.signedAt ? ` · signed ${esc(new Date(d.signedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }))}` : ""}</div>
<div>${body || '<p class="empty">The full text of this document is kept by the desk. Ask the desk for the signed copy.</p>'}</div>
<div class="mark">${forward ? "For the client" : `Downloaded by ${esc(d.downloadedBy)} on ${esc(date)}. Please don't forward.`}</div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`);
  w.document.close();
}

export default function AgentDocumentsView() {
  const { data, error, loading, reload } = useLoad<DocsData>(() => api.curator.documents(), []);
  const { open, busy } = useOpenTripDocument();
  const [working, setWorking] = useState<string | null>(null);

  const openShared = async (code: string, forward = false) => {
    setWorking(code);
    try {
      const res = await api.curator.libraryDocument(code);
      printLibraryDocument(res.data, forward);
    } catch (err: any) {
      alert(err?.message || "The document could not be opened.");
    } finally {
      setWorking(null);
    }
  };
  const acknowledge = async (code: string) => {
    setWorking(`ack-${code}`);
    try {
      await api.curator.acknowledge(code);
      reload();
    } catch (err: any) {
      alert(err?.message || "Could not record the acknowledgement.");
    } finally {
      setWorking(null);
    }
  };
  const sign = async () => {
    if (!window.confirm("Sign the Curator agreement now? Your name and today's date are recorded.")) return;
    setWorking("sign");
    try {
      await api.curator.signAgreement();
      reload();
    } catch (err: any) {
      alert(err?.message || "Could not record the signature.");
    } finally {
      setWorking(null);
    }
  };

  const link = (label: string, onClick: () => void, key: string) => (
    <button type="button" onClick={onClick} disabled={working === key} className={`${goldLinkCls} disabled:opacity-50`}>
      {label}
    </button>
  );
  const dot = <span className="text-white mx-1">·</span>;

  return (
    <div>
      <PageTitle title="Documents" sub="What OrbAero has shared with you. Your own signed agreement is always here." />
      {!data ? (
        <LoadState loading={loading} error={error} onRetry={reload} />
      ) : (
        <div className="space-y-6">
          <div className={`${cardCls} overflow-hidden px-3 py-1`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    <th className={`${thCls} w-[54%]`}>Document</th>
                    <th className={thCls}>Version</th>
                    <th className={thCls}>Updated</th>
                    <th className={thCls} />
                  </tr>
                </thead>
                <tbody>
                  {data.shared.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-[15px] text-[#93A1B5]">
                        Nothing shared with you yet.
                      </td>
                    </tr>
                  )}
                  {data.shared.map((d) => (
                    <tr key={d.code} className="border-b border-white/[0.05] last:border-0">
                      <td className={`${tdCls} text-[16px]`}>
                        <span className="font-bold text-white">{d.title}</span>
                        {d.note && <span className={d.noteBold ? "font-bold text-white" : "text-white"}> {d.note}</span>}
                      </td>
                      <td className={`${tdCls} font-mono`}>{d.version}</td>
                      <td className={`${tdCls} whitespace-nowrap`}>{d.updated}</td>
                      <td className={`${tdCls} whitespace-nowrap`}>
                        {d.kind === "agreement" && (
                          <>
                            {link("PDF", () => openShared(d.code), d.code)}
                            {!d.signed && (
                              <>
                                {dot}
                                {link("Sign", sign, "sign")}
                              </>
                            )}
                          </>
                        )}
                        {d.kind === "conduct" && (
                          <>
                            {link("PDF", () => openShared(d.code), d.code)}
                            {dot}
                            {d.acknowledged ? <Badge tone="green">Acknowledged</Badge> : link("Acknowledge", () => acknowledge(d.code), `ack-${d.code}`)}
                          </>
                        )}
                        {d.kind === "kit" && (
                          <>
                            {link("Open", () => openShared(d.code), d.code)}
                            {dot}
                            {link("PDF", () => openShared(d.code), d.code)}
                          </>
                        )}
                        {d.kind === "brochure" && link("PDF to forward", () => openShared(d.code, true), d.code)}
                        {d.kind === "pdf" && link("PDF", () => openShared(d.code), d.code)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-[19px] font-bold text-white mt-2 mb-3">From the desk</h2>
            <div className={`${cardCls} overflow-hidden px-3 py-1`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.07]">
                      <th className={`${thCls} w-[54%]`}>Document</th>
                      <th className={thCls}>Version</th>
                      <th className={thCls}>Updated</th>
                      <th className={thCls} />
                    </tr>
                  </thead>
                  <tbody>
                    {data.desk.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-[15px] text-[#93A1B5]">
                          Quotes, contracts, invoices and flight briefs for your trips show here as soon as the desk produces them.
                        </td>
                      </tr>
                    )}
                    {data.desk.map((d) => (
                      <tr key={d.key} className="border-b border-white/[0.05] last:border-0">
                        <td className={`${tdCls} text-[16px]`}>
                          <span className="font-bold text-white">{d.label}</span> <DocRef value={d.ref} className="text-[15px]" />
                          <span className="text-[#A8B3C2]"> · {d.title}</span>
                        </td>
                        <td className={`${tdCls} font-mono`}>{d.version}</td>
                        <td className={`${tdCls} whitespace-nowrap`}>{d.updated}</td>
                        <td className={`${tdCls} whitespace-nowrap`}>
                          <button
                            type="button"
                            disabled={busy === d.key}
                            onClick={() => open(d.key, d.bookingId, d.docType, { invoice: d.invoice, creditNote: d.creditNote })}
                            className={`${goldLinkCls} disabled:opacity-50`}
                          >
                            {busy === d.key ? "Opening…" : "PDF"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      <p className="text-[15px] text-[#93A1B5] mt-5">Downloads carry your name and the date. Please don&apos;t forward the agreement or code of conduct.</p>
    </div>
  );
}
