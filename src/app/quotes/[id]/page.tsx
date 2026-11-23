"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAviation } from "@/lib/aviationContext";
import { Booking } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import { renderFormattedId, formatDocumentId, extractFeToken } from "@/lib/idGenerator";
import StatusPill from "@/components/ui/StatusPill";
import {
  FileText,
  Plane,
  Clock,
  ArrowRight,
  User,
  Shield,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  Send,
  Download,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Phone,
  Mail,
  Receipt
} from "lucide-react";

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = (params?.id as string) || "";
  const decodedId = decodeURIComponent(rawId);

  const [activeTab, setActiveTab] = useState<"overview" | "revisions">(() => {
    return searchParams.get("tab") === "revisions" ? "revisions" : "overview";
  });

  const {
    bookings,
    openDocument,
    advanceQuoteToContract,
    convertQuoteToBooked,
    role,
    currentUser
  } = useAviation();

  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Find quote matching decodedId
  const quote = useMemo(() => {
    return bookings.find((b) => {
      const qId = (b.quoteId || "").toLowerCase();
      const qRef = (b.quoteReference || "").toLowerCase();
      const bId = (b.id || "").toLowerCase();
      const tNum = (b.tripNumber || "").toLowerCase();
      const tId = (b.tripId || "").toLowerCase();
      const target = decodedId.toLowerCase();
      return qId === target || qRef === target || bId === target || tNum === target || tId === target;
    });
  }, [bookings, decodedId]);

  const quoteRevisions = useMemo(() => {
    if (!quote) return [];
    const feToken = extractFeToken(quote.tripId || quote.tripNumber || quote.quoteReference || quote.quoteId || quote.id);
    return bookings
      .filter((b) => {
        if (b.isBooked) return false;
        const bToken = extractFeToken(b.tripId || b.tripNumber || b.quoteReference || b.quoteId || b.id);
        if (feToken && bToken && feToken.toUpperCase() === bToken.toUpperCase()) return true;
        if (b.tripId && quote.tripId && b.tripId.toUpperCase() === quote.tripId.toUpperCase()) return true;
        return b.id === quote.id;
      })
      .sort((a, b) => (b.quoteVersion || 1) - (a.quoteVersion || 1));
  }, [bookings, quote]);

  const latestQuoteVersion = useMemo(() => {
    if (quoteRevisions.length === 0) return quote?.quoteVersion || 1;
    return Math.max(...quoteRevisions.map((r) => r.quoteVersion || 1));
  }, [quoteRevisions, quote]);

  if (!quote) {
    return (
      <AppShell navKey="quotes">
        <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold font-display text-[var(--ink)]">Quote Not Found</h1>
          <p className="text-sm text-[var(--muted)] font-mono">
            Could not find an active quote matching reference: {decodedId}
          </p>
          <div className="pt-2">
            <Link href="/quotes" className="btn-secondary inline-flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Quotes</span>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const quoteIdDisplay = quote.quoteId || quote.quoteReference || `QUO-${quote.tripId?.replace(/^TRI-/, "") || "FE1001"}-001`;
  const isBooked = Boolean(
    quote.isBooked ||
    quote.isContractSigned ||
    ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(quote.status)
  );
  const isSuperAdminOrAdmin = role === "super_admin" || role === "admin" || role === "operations";

  // Actions
  const handleSendToCurator = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess("Quotation officially dispatched to Curator via WhatsApp & Email notification.");
      setTimeout(() => setSendSuccess(null), 4000);
    }, 600);
  };

  const handleAdvanceToContract = async () => {
    try {
      await advanceQuoteToContract(quote.id, {});
      router.push(`/contracts`);
    } catch {
      router.push(`/contracts`);
    }
  };

  const handleReviseQuote = () => {
    router.push(`/quotes/new?reviseQuote=${encodeURIComponent(quoteIdDisplay)}`);
  };

  return (
    <AppShell navKey="quotes">
      <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/quotes"
              className="p-2 rounded-lg border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--wf)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-[var(--muted)]">
                  CHARTER QUOTATION
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  VERSION {String(quote.quoteVersion || 1).padStart(3, "0")}
                </span>
              </div>
              <h1 className="text-2xl font-bold font-display text-[var(--ink)] m-0 flex items-center gap-2">
                {renderFormattedId(quoteIdDisplay)}
              </h1>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openDocument(quote, "quotation")}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Quotation PDF</span>
            </button>

            <button
              onClick={handleSendToCurator}
              disabled={isSending}
              className="btn-secondary text-xs flex items-center gap-1.5 text-cyan-600 border-cyan-200 hover:bg-cyan-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? "Sending..." : "Send to Curator"}</span>
            </button>

            <button
              onClick={handleReviseQuote}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revise Quote</span>
            </button>

            {isSuperAdminOrAdmin && !isBooked && (
              <button
                onClick={handleAdvanceToContract}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Advance to Charter Agreement</span>
              </button>
            )}

            {isBooked && (
              <Link
                href={`/trips/${encodeURIComponent(quote.tripId || quote.tripNumber || quote.id)}/itinerary`}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <span>Open Confirmed Trip</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {sendSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{sendSuccess}</span>
          </div>
        )}

        {/* Boundary Notice: MOD-02 Enforcement Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>
              <strong>Quote Phase Boundary (MOD-02):</strong> This flight is in quotation stage. No invoices, flight briefs, operational reminders, or revenue recognition can exist before the Master Charter Agreement is officially executed.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wide">STAGE: QUOTED</span>
        </div>

        {/* Tab Navigation (Overview & Revisions) */}
        <div className="flex items-center gap-2 border-b border-[var(--line)]">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-[var(--accent)] text-[var(--accent)] font-bold"
                : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("revisions")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "revisions"
                ? "border-[var(--accent)] text-[var(--accent)] font-bold"
                : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Revisions</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === "revisions" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"
              }`}
            >
              {quoteRevisions.length}
            </span>
          </button>
        </div>

        {/* Tab Content: Revisions */}
        {activeTab === "revisions" && (
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Version Control Timeline</h3>
                <p className="text-xs text-[var(--muted)]">All historical quote iterations newest first. Older versions remain frozen and marked cancelled.</p>
              </div>
              <button
                type="button"
                onClick={handleReviseQuote}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Create New Revision</span>
              </button>
            </div>

            <div className="tablewrap">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Type</th>
                    <th>Route &amp; Aircraft</th>
                    <th>Total Amount</th>
                    <th>State</th>
                    <th>Documents</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteRevisions.map((rev) => {
                    const isLatest = (rev.quoteVersion || 1) === latestQuoteVersion;
                    const revDocId = rev.quoteId || formatDocumentId("Q", quote.tripId || "FE1001", rev.quoteVersion || 1);
                    const revLeg = rev.legs[0];

                    return (
                      <tr key={rev.id}>
                        <td className="font-mono font-bold whitespace-nowrap">
                          {renderFormattedId(revDocId)}
                          {rev.id === quote.id && (
                            <span className="ml-2 text-[10px] font-sans px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">Viewing</span>
                          )}
                        </td>
                        <td>
                          <span className="text-xs font-semibold">Charter Quotation</span>
                        </td>
                        <td>
                          <span className="font-display font-bold text-xs block whitespace-nowrap">
                            {revLeg?.origin?.icao || "—"} ⇄ {revLeg?.destination?.icao || "—"}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--muted)]">
                            {rev.aircraft?.name || "Private Jet"}
                          </span>
                        </td>
                        <td className="font-mono font-bold whitespace-nowrap">
                          {formatCurrency(rev.pricing?.totalFlightPrice || 0, rev.pricing?.currency)}
                        </td>
                        <td>
                          {isLatest ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300">
                              CANCELLED
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openDocument(rev, "quotation")}
                              className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 text-[var(--accent)] hover:underline"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Generate PDF</span>
                            </button>
                            {rev.id !== quote.id && (
                              <Link
                                href={`/quotes/${encodeURIComponent(revDocId)}`}
                                className="text-[11px] font-mono text-[var(--muted)] hover:text-[var(--ink)] underline ml-1"
                              >
                                View Details
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Overview */}
        {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2 Cols: Flight Routing, Aircraft, Services */}
          <div className="lg:col-span-2 space-y-5">
            {/* Itinerary Card */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <h3 className="text-sm font-bold font-display text-[var(--ink)] m-0 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-[var(--accent)]" />
                  <span>Flight Routing & Schedule</span>
                </h3>
                <span className="text-xs font-mono uppercase font-bold text-[var(--muted)]">
                  {quote.tripType.replace("_", " ")}
                </span>
              </div>

              <div className="space-y-3">
                {quote.legs.map((leg, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-[var(--paper)] border border-[var(--line)] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[var(--ink)] text-[var(--card)] flex items-center justify-center font-bold text-[10px]">
                          {leg.legNumber || idx + 1}
                        </span>
                        <span className="font-bold text-sm text-[var(--ink)] font-display">
                          {leg.origin?.icao || (leg as any).fromIcao || "ORIG"} → {leg.destination?.icao || (leg as any).toIcao || "DEST"}
                        </span>
                        <span className="text-[var(--muted)] font-mono">
                          ({leg.origin?.city || (leg as any).from || "Origin"} to {leg.destination?.city || (leg as any).to || "Destination"})
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--muted)] flex items-center gap-3 font-mono">
                        <span>Date: <strong>{leg.flightDate || "TBD"}</strong></span>
                        <span>•</span>
                        <span>Depart: <strong>{leg.departureTimeLocal || "11:00"} LT</strong></span>
                        <span>•</span>
                        <span>Arrive: <strong>{leg.arrivalTimeLocal || "12:30"} LT</strong></span>
                        <span>•</span>
                        <span>Est. Block: <strong>{leg.flightTimeFormatted || "01h 30m"}</strong></span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-mono text-xs font-bold text-[var(--ink)] block">
                        {leg.paxCount || 2} Pax
                      </span>
                      {leg.aircraftType && (
                        <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          ✈ {leg.aircraftType}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aircraft Specifications Card (MOD-08 Photos Support) */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <h3 className="text-sm font-bold font-display text-[var(--ink)] m-0 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-[var(--accent)]" />
                  <span>Sourced Aircraft & Cabin</span>
                </h3>
                <span className="text-xs font-mono font-bold text-[var(--accent)]">
                  {quote.aircraft?.categoryLabel || "Executive Jet"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">AIRCRAFT MODEL</span>
                    <span className="font-bold text-sm text-[var(--ink)] font-display">{quote.aircraft?.name || "Bombardier Challenger 350"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">CABIN CAPACITY</span>
                    <span className="text-[var(--ink)]">{quote.aircraft?.passengers || 8} Executive Seats • Enclosed Lavatory</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">CRUISE SPEED & RANGE</span>
                    <span className="text-[var(--ink)] font-mono">{quote.aircraft?.cruiseSpeed || (quote.aircraft as any)?.speedKts || 450} KTAS • {quote.aircraft?.range || (quote.aircraft as any)?.rangeNm || 3200} NM</span>
                  </div>
                </div>

                {/* Aircraft Photo Previews */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-24 bg-slate-100 rounded-lg border border-[var(--line)] overflow-hidden flex items-center justify-center text-[10px] text-[var(--muted)]">
                    {quote.aircraftCustomImages?.exterior || quote.aircraft?.imageExterior ? (
                      <img
                        src={quote.aircraftCustomImages?.exterior || quote.aircraft?.imageExterior}
                        alt="Exterior"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>Exterior Photo</span>
                    )}
                  </div>
                  <div className="h-24 bg-slate-100 rounded-lg border border-[var(--line)] overflow-hidden flex items-center justify-center text-[10px] text-[var(--muted)]">
                    {quote.aircraftCustomImages?.interior || quote.aircraft?.imageInterior ? (
                      <img
                        src={quote.aircraftCustomImages?.interior || quote.aircraft?.imageInterior}
                        alt="Cabin"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>Cabin Photo</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Services & Write-ups Card (NF-07, NF-09, NF-10, NF-11) */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold font-display text-[var(--ink)] m-0">
                Concierge Services & Transfers (NF-09, NF-10, NF-11)
              </h3>
              <div className="space-y-2 text-xs">
                {quote.services?.vipCateringDetails && (
                  <div className="p-3 bg-[var(--paper)] rounded-lg border border-[var(--line)]">
                    <span className="font-bold text-[10px] uppercase text-[var(--muted)] block">VIP CATERING</span>
                    <p className="m-0 text-[var(--ink)]">{quote.services.vipCateringDetails}</p>
                  </div>
                )}
                {quote.services?.limousineService && (
                  <div className="p-3 bg-[var(--paper)] rounded-lg border border-[var(--line)]">
                    <span className="font-bold text-[10px] uppercase text-[var(--muted)] block">GROUND TRANSPORTATION</span>
                    <p className="m-0 text-[var(--ink)]">
                      {(quote.groundTransportation as any)?.writeUp || quote.groundTransportation?.additionalRequirements?.specialInstructions || "VIP tarmac meet & greet with executive chauffeur transfer."}
                    </p>
                  </div>
                )}
                {quote.services?.helicopterService && (
                  <div className="p-3 bg-[var(--paper)] rounded-lg border border-[var(--line)]">
                    <span className="font-bold text-[10px] uppercase text-[var(--muted)] block">HELICOPTER TRANSFER</span>
                    <p className="m-0 text-[var(--ink)]">
                      {(quote.helicopterTransfer as any)?.writeUp || (quote.helicopterTransfer as any)?.instructions || "Direct helipad connection via twin-engine VIP helicopter."}
                    </p>
                  </div>
                )}
                {quote.petDetails && (quote.petDetails as any).count > 0 && (
                  <div className="p-3 bg-[var(--paper)] rounded-lg border border-[var(--line)]">
                    <span className="font-bold text-[10px] uppercase text-[var(--muted)] block">PET ACCOMMODATION (NF-07)</span>
                    <p className="m-0 text-[var(--ink)]">
                      {(quote.petDetails as any).count} pet(s) • Breed: {(quote.petDetails as any).breed || "Domestic"} • Weight: {(quote.petDetails as any).weight || "8"} kg • Cabin accommodation
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Rail: Pricing Breakdown & Client Information */}
          <div className="space-y-5">
            {/* Pricing Summary Card (MOD-09 Margins Folded) */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold font-display text-[var(--ink)] m-0">
                Quotation Financial Summary
              </h3>

              <div className="space-y-2 text-xs border-b border-[var(--line)] pb-4 font-mono">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Base Charter Flight</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(quote.pricing?.flightPrice || quote.pricing?.totalFlightPrice || 0, quote.pricing?.currency)}
                  </span>
                </div>
                {Boolean(quote.pricing?.passengerFees) && (
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Passenger Fees (Itemized)</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(quote.pricing.passengerFees, quote.pricing.currency)}
                    </span>
                  </div>
                )}
                {Boolean(quote.pricing?.additionalServicesTotal) && (
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Transfers & Concierge</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(quote.pricing?.additionalServicesTotal || 0, quote.pricing?.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>VAT Exemption (Art. 44/196)</span>
                  <span>€ 0.00</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center pt-1 font-mono">
                <span className="text-xs uppercase font-bold text-slate-600">Grand Total (Wire)</span>
                <span className="text-xl font-bold text-slate-900">
                  {formatCurrency(quote.pricing?.totalFlightPrice || 0, quote.pricing?.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                <span>Card (incl. 3.5% fee)</span>
                <span>
                  {formatCurrency((quote.pricing?.totalFlightPrice || 0) * 1.035, quote.pricing?.currency)}
                </span>
              </div>

              {/* Admin Internal Margin Indicator (Admin only) */}
              {isSuperAdminOrAdmin && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-[10px] uppercase text-amber-900 block">INTERNAL MARGIN BREAKDOWN (ADMIN ONLY)</span>
                  <div className="flex justify-between text-amber-800 text-[11px] font-mono">
                    <span>Company Margin:</span>
                    <span>{(quote.pricing as any)?.companyMargin || (quote.pricing as any)?.adminMarginPercentage || 10}%</span>
                  </div>
                  <div className="flex justify-between text-amber-800 text-[11px] font-mono">
                    <span>Curator Mark-up:</span>
                    <span>{quote.commissionPercentage || 8}%</span>
                  </div>
                  <span className="text-[10px] text-amber-700/80 block italic">Folded into charter total on client documents (MOD-09, MOD-15).</span>
                </div>
              )}
            </div>

            {/* Client & Authorised Owner Card (MOD-05) */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold font-display text-[var(--ink)] m-0">
                Client & Account
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">ACCOUNT / ENTITY</span>
                  <span className="font-bold text-slate-900 block">{quote.client?.companyName || quote.client?.fullName || "Private Client"}</span>
                  <span className="font-mono text-cyan-600 text-[11px]">{quote.accountNumber || "ACC-DIRECT"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">AUTHORISED OWNER</span>
                  <span className="text-slate-800">{quote.client?.fullName || "Lead Passenger"}</span>
                </div>
                {(quote.client?.isHandledByPa || quote.isHandledByPa) && (quote.client?.paName || quote.paName) && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                    <span className="font-bold block text-[10px] uppercase">REPRESENTATIVE / PA</span>
                    <span className="font-semibold">{quote.client?.paName || quote.paName}</span>
                    <span className="block text-[10px] text-amber-700 font-mono mt-0.5">
                      {[quote.client?.paEmail || quote.paEmail, quote.client?.paPhone || quote.paPhone].filter(Boolean).join(" • ")}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">SEND DOCUMENTS TO</span>
                  <span className="text-slate-800 font-mono">{quote.client?.email || "Email pending"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">ASSIGNED CURATOR</span>
                  <span className="text-slate-800">{quote.agentName || "Direct Desk"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </AppShell>
  );
}
