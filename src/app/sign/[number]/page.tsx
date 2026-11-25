"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import CharterAgreementDoc from "@/components/documents/CharterAgreementDoc";
import { documentPdfDataUri } from "@/lib/pdfExporter";
import { agreementLinksFor, docMoney, documentPricing } from "@/lib/documentData";

interface SignInfo {
  number: string;
  quote: string;
  signed: boolean;
  signedAt: string | null;
  signedBy: string;
  wetPending: boolean;
  signer: { name: string; position: string; email: string; company: string };
  versions: { C1: string; C2: string; C3: string; C5: string };
  links: any;
  booking: any;
}

/** Signature box: draw with a mouse, finger or pen. */
function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const drawn = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * ratio;
    c.height = h * ratio;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ref.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    drawn.current = true;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (drawn.current && ref.current) onChange(ref.current.toDataURL("image/png"));
  };
  const clear = () => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();
    drawn.current = false;
    onChange("");
  };
  return (
    <div>
      <canvas
        ref={ref}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="w-full h-[140px] rounded-lg border border-dashed border-slate-400 bg-white touch-none cursor-crosshair"
      />
      <div className="flex justify-between text-[12px] text-slate-500 mt-1">
        <span>Sign in the box</span>
        <button type="button" onClick={clear} className="underline">
          Clear
        </button>
      </div>
    </div>
  );
}

/** S-SignAgreement: the client reads the agreement, confirms four points, signs and enters the emailed code. */
export default function SignAgreementPage({ params }: { params: { number: string } }) {
  const [key, setKey] = useState("");
  const [info, setInfo] = useState<SignInfo | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [checks, setChecks] = useState({ flights: false, legal: false, passengers: false, authorised: false });
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [signature, setSignature] = useState("");
  const [code, setCode] = useState("");
  const [codeSentTo, setCodeSentTo] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [signing, setSigning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [signedPreview, setSignedPreview] = useState<any | null>(null);

  const load = useCallback(async (k: string) => {
    try {
      const res = await api.sign.get(params.number, k, window.location.origin);
      setInfo(res.data);
      setName(res.data?.signer?.name || "");
      setPosition(res.data?.signer?.position || "");
      setState("ready");
    } catch (err: any) {
      setError(err?.message || "This signing link could not be opened.");
      setState("error");
    }
  }, [params.number]);

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("k") || "";
    setKey(k);
    if (!k) {
      setError("This signing link is incomplete. Open the link from your email.");
      setState("error");
      return;
    }
    load(k);
  }, [load]);

  const sendCode = async () => {
    setSendingCode(true);
    setError("");
    try {
      const res = await api.sign.code(params.number, key);
      setCodeSentTo(res.data.sentTo);
    } catch (err: any) {
      setError(err?.message || "The code could not be sent.");
    } finally {
      setSendingCode(false);
    }
  };

  const allTicked = checks.flights && checks.legal && checks.passengers && checks.authorised;
  const ready = Boolean(allTicked && name.trim().length > 1 && position.trim().length > 1 && signature && /^\d{6}$/.test(code.replace(/\s+/g, "")));

  const sign = async () => {
    if (!info || !ready || signing) return;
    setSigning(true);
    setError("");
    try {
      // The signed copy: the agreement with the client's signature and the countersignature, as one PDF
      const company = info.booking?.documentSnapshot?.company || {};
      setSignedPreview({
        ...info.booking,
        isContractSigned: true,
        contractSignedBy: name,
        contractSignedDate: new Date().toISOString().slice(0, 10),
        contractSignature: { method: "online", name, position, signatureImage: signature, signedAt: new Date().toISOString(), email: "" },
        countersignature: { name: company.representativeName || "", title: company.signatoryTitle || "", at: new Date().toISOString() }
      });
      await new Promise((r) => setTimeout(r, 150));
      const pdf = (await documentPdfDataUri("signed-agreement-pdf", { scale: 1.5, quality: 0.85 })) || "";
      const res = await api.sign.sign(params.number, key, {
        checks,
        name: name.trim(),
        position: position.trim(),
        signature,
        code: code.replace(/\s+/g, ""),
        pdf: pdf.length < 7.5 * 1024 * 1024 ? pdf : "",
        origin: window.location.origin
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err?.message || "The agreement could not be signed. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  const booking = info?.booking;
  const pricing = booking ? documentPricing(booking) : null;
  const links = booking ? agreementLinksFor(booking) : null;
  const v = info?.versions || ({} as any);
  const box = "w-4 h-4 mt-0.5 accent-[#0B1320] shrink-0";

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-8">
      <div className="max-w-[1240px] mx-auto">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-8 h-8 rounded-lg bg-[#111827] flex items-center justify-center">
            <span className="w-3 h-3 rounded-[3px] bg-[#C9A24A]" />
          </span>
          <span className="text-xl font-bold text-slate-900">ORBELO</span>
          {info && <span className="text-slate-500 text-sm ml-2 font-mono">{info.number}</span>}
        </div>

        {state === "loading" && <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">Loading the agreement…</div>}
        {state === "error" && <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-rose-700 text-sm max-w-lg mx-auto">{error}</div>}

        {state === "ready" && info && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
            <div className="min-w-0 overflow-x-auto">
              <CharterAgreementDoc booking={booking} />
            </div>

            <aside className="lg:sticky lg:top-6 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              {result || info.signed ? (
                <div className="space-y-2">
                  <div className="text-lg font-bold text-emerald-800">Agreement signed</div>
                  {result ? (
                    <>
                      <p className="text-sm text-slate-700 m-0">
                        Thank you. {info.number} is signed and countersigned, and booking <strong>{result.tripNumber}</strong> is confirmed.
                      </p>
                      {result.invoice && (
                        <p className="text-sm text-slate-700 m-0">
                          Invoice {result.invoice.number} · {docMoney(result.invoice.amount, pricing?.currency)}
                          {result.invoice.dueDate ? ` · due ${new Date(result.invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                        </p>
                      )}
                      <p className="text-sm text-slate-500 m-0">
                        {result.emailed
                          ? "The countersigned agreement and your signature certificate are on their way by email."
                          : "Your representative will send you the countersigned agreement and your signature certificate."}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-700 m-0">
                      Signed by {info.signedBy}
                      {info.signedAt ? ` on ${new Date(info.signedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}.
                    </p>
                  )}
                </div>
              ) : info.booking?.isCancelled ? (
                <div className="text-sm text-amber-800">This agreement has been replaced by a newer version. Please use the link in the latest email.</div>
              ) : (
                <>
                  <div>
                    <div className="text-lg font-bold text-slate-900">Sign the agreement</div>
                    <div className="text-[13px] text-slate-500">Read the agreement, then confirm, sign and enter the code we email you.</div>
                  </div>

                  <div className="space-y-2.5 text-[13.5px] text-slate-800">
                    <label className="flex gap-2.5 items-start cursor-pointer">
                      <input type="checkbox" className={box} checked={checks.flights} onChange={(e) => setChecks({ ...checks, flights: e.target.checked })} />
                      <span>
                        I confirm the flights and the price{pricing ? ` of ${docMoney(pricing.total, pricing.currency)}` : ""}.
                      </span>
                    </label>
                    <label className="flex gap-2.5 items-start cursor-pointer">
                      <input type="checkbox" className={box} checked={checks.legal} onChange={(e) => setChecks({ ...checks, legal: e.target.checked })} />
                      <span>
                        I have read and accept{" "}
                        <a className="text-blue-700 underline" href={links?.terms.href} target="_blank" rel="noopener noreferrer">
                          C1 Brokerage Terms{v.C1 ? ` ${v.C1}` : ""}
                        </a>
                        ,{" "}
                        <a className="text-blue-700 underline" href={links?.cancellation.href} target="_blank" rel="noopener noreferrer">
                          C3 Cancellation Policy{v.C3 ? ` ${v.C3}` : ""}
                        </a>{" "}
                        and{" "}
                        <a className="text-blue-700 underline" href={links?.privacy.href} target="_blank" rel="noopener noreferrer">
                          C5 Privacy Notice{v.C5 ? ` ${v.C5}` : ""}
                        </a>
                        .
                      </span>
                    </label>
                    <label className="flex gap-2.5 items-start cursor-pointer">
                      <input type="checkbox" className={box} checked={checks.passengers} onChange={(e) => setChecks({ ...checks, passengers: e.target.checked })} />
                      <span>I will send the passenger details and travel documents 48 hours before departure.</span>
                    </label>
                    <label className="flex gap-2.5 items-start cursor-pointer">
                      <input type="checkbox" className={box} checked={checks.authorised} onChange={(e) => setChecks({ ...checks, authorised: e.target.checked })} />
                      <span>I am authorised to sign for {info.signer.company || "the client"}.</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-[12px] font-semibold text-slate-600">
                      Name
                      <input className="mt-1 w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <label className="text-[12px] font-semibold text-slate-600">
                      Position
                      <input className="mt-1 w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm" value={position} onChange={(e) => setPosition(e.target.value)} />
                    </label>
                  </div>

                  <SignaturePad onChange={setSignature} />

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={sendCode}
                      disabled={sendingCode}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {sendingCode ? "Sending…" : codeSentTo ? "Send a new code" : `Email me a code${info.signer.email ? ` (${info.signer.email})` : ""}`}
                    </button>
                    {codeSentTo && <div className="text-[12.5px] text-slate-500">Code sent to {codeSentTo}. It is valid for 15 minutes.</div>}
                    <input
                      inputMode="numeric"
                      maxLength={7}
                      placeholder="6-digit code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/[^0-9 ]/g, ""))}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-center tracking-[0.4em] font-mono text-lg"
                    />
                  </div>

                  {error && <div className="text-[13px] text-rose-700">{error}</div>}

                  <button
                    type="button"
                    onClick={sign}
                    disabled={!ready || signing}
                    className="w-full bg-[#0B1320] text-white rounded-lg px-4 py-3 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {signing ? "Signing…" : "Sign the agreement"}
                  </button>
                  {!ready && (
                    <div className="text-[12px] text-slate-500">
                      The button unlocks when all four boxes are ticked, your name and position are filled in, you have signed and the code is entered.
                    </div>
                  )}
                </>
              )}
            </aside>
          </div>
        )}

        {/* The signed copy is drawn here, off screen, to make the PDF kept with the trip */}
        {signedPreview && (
          <div aria-hidden style={{ position: "fixed", left: -12000, top: 0, width: 820 }}>
            <div id="signed-agreement-pdf">
              <CharterAgreementDoc booking={signedPreview} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
