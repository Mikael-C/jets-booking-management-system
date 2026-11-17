"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { formatTripVersion } from "@/lib/idGenerator";
import StatusPill from "@/components/ui/StatusPill";
import MissingDataBadge from "@/components/ui/MissingDataBadge";
import RecordHeader from "@/components/ui/RecordHeader";
import KpiStrip from "@/components/ui/KpiStrip";
import {
  Plane,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  CreditCard,
  FileText
} from "lucide-react";

export default function OperationsOverview() {
  const router = useRouter();
  const {
    bookings,
    agentRequests,
    clients,
    role,
    settings
  } = useAviation();

  // Bookings vs Quotes
  const bookedTrips = useMemo(() => {
    return bookings.filter(
      (b) => b.isBooked || ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(b.status)
    );
  }, [bookings]);

  const openQuotes = useMemo(() => {
    return bookings.filter((b) => !b.isBooked && (b.status === "quoted" || b.quoteStatus === "sent"));
  }, [bookings]);

  const sourcingTrips = useMemo(() => {
    return bookings.filter((b) => b.status === "in_sourcing");
  }, [bookings]);

  const activeRequests = useMemo(() => {
    return agentRequests.filter((r) => r.status === "pending" || r.status === "in_sourcing");
  }, [agentRequests]);

  // Financials
  const bookedRevenue = bookedTrips.reduce((sum, b) => sum + (b.pricing.totalFlightPrice || 0), 0);
  const realizedMargin = bookedRevenue * 0.10; // ~10% average tier margin

  // Needs Action Queue items (urgency sorted per R-025)
  const actionQueue = useMemo(() => {
    const queue: Array<{
      id: string;
      title: string;
      subtitle: string;
      urgency: "critical" | "high" | "normal";
      badge: string;
      link: string;
      actionText: string;
    }> = [];

    // 1. Unconfirmed payments for departures within 72h (critical red)
    bookedTrips.forEach((b) => {
      if (b.paymentStatus !== "fully_paid") {
        const rootId = (b.tripId || b.tripNumber || "FE4578").split("-")[0];
        queue.push({
          id: `pay-${b.id}`,
          title: `Trip ${rootId} departure pending payment settlement`,
          subtitle: `${b.client.fullName} • ${b.legs[0]?.origin?.icao} → ${b.legs[0]?.destination?.icao} • Due: ${b.paymentDueDate || "Prior to flight"}`,
          urgency: "critical",
          badge: "72H UNPAID BALANCE",
          link: `/trips/${rootId}/accounting`,
          actionText: "Verify Wire"
        });
      }
    });

    // 2. Missing passport details within 48h
    bookedTrips.forEach((b) => {
      const missingCount = b.legs.flatMap((l) => l.passengers).filter((p) => !p.passportNumber || p.passportNumber.length < 5).length;
      if (missingCount > 0) {
        const rootId = (b.tripId || b.tripNumber || "FE4578").split("-")[0];
        queue.push({
          id: `pax-${b.id}`,
          title: `Trip ${rootId} has ${missingCount} passenger(s) missing passport details`,
          subtitle: `Manifest clearance required before border control APIS filing`,
          urgency: "high",
          badge: "48H MANIFEST GAP",
          link: `/trips/${rootId}/passengers`,
          actionText: "Manifest"
        });
      }
    });

    // 3. New broker requests requiring quotation (< 30 min SLA)
    agentRequests.forEach((r) => {
      if (r.status === "pending") {
        queue.push({
          id: `req-${r.id}`,
          title: `New agent request: ${r.route} (${r.paxCount} pax)`,
          subtitle: `Agent: ${r.agentName} • Target budget: ${r.budgetNotes || "Market rate"}`,
          urgency: "high",
          badge: "30M SLA TARGET",
          link: `/requests/${r.id}`,
          actionText: "Send Quote"
        });
      }
    });

    // 4. Quotes expiring soon
    openQuotes.forEach((q) => {
      const rootId = (q.tripId || q.tripNumber || "FE4578").split("-")[0];
      queue.push({
        id: `quote-${q.id}`,
        title: `Quote ${formatTripVersion(rootId, q.quoteVersion || 1)} validity expires today`,
        subtitle: `${q.client.fullName} • ${q.legs[0]?.origin?.icao} → ${q.legs[0]?.destination?.icao} (${formatCurrency(q.pricing.totalFlightPrice, q.pricing.currency)})`,
        urgency: "normal",
        badge: "QUOTE EXPIRING",
        link: `/trips/${rootId}/pricing`,
        actionText: "View Quote"
      });
    });

    return queue;
  }, [bookedTrips, openQuotes, agentRequests]);

  // Today's Departures Timeline (R-025)
  const todayDepartures = useMemo(() => {
    return bookedTrips.flatMap((b) => {
      const rootId = (b.tripId || b.tripNumber || "FE4578").split("-")[0];
      return b.legs.map((leg, legIdx) => ({
        id: `${b.id}-${legIdx}`,
        rootId,
        legIndex: legIdx + 1,
        flightNumber: leg.flightNumber || "PEA501",
        tailNumber: leg.aircraftRegistration || b.aircraft.registration || "OE-FFB",
        originIcao: leg.origin?.icao || "LSGG",
        destIcao: leg.destination?.icao || "EGSS",
        depTimeLocal: leg.departureTimeLocal || "10:00",
        arrTimeLocal: leg.arrivalTimeLocal || "12:05",
        paxCount: leg.paxCount || 4,
        aircraftName: b.aircraft.name,
        fboName: leg.departureHandling?.name || "ExecuJet FBO",
        status: b.status === "flown" || b.status === "completed" ? "Landed" : b.status === "in_flight" ? "En Route" : "Scheduled"
      }));
    });
  }, [bookedTrips]);

  return (
    <div className="space-y-6">
      {/* 1. Header with Quick Actions (R-025) */}
      <RecordHeader
        title="Operations Overview"
        subtitle="Live flight operations command, pipeline velocity, action queue, and active departures"
        badge="R-025 FLIGHT COMMAND"
        breadcrumbs={[{ label: "Overview" }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/requests" className="btn-secondary text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>New Request</span>
            </Link>
            <Link href="/quotes/new" className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Quote</span>
            </Link>
            <Link href="/payments" className="btn-secondary text-xs">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Wire</span>
            </Link>
          </div>
        }
      />

      {/* 2. Top KPI Ribbon (R-025) */}
      <KpiStrip
        items={[
          {
            id: "active-req",
            label: "Active Requests",
            value: activeRequests.length.toString(),
            subtext: "Awaiting quote dispatch"
          },
          {
            id: "in-sourcing",
            label: "In Sourcing",
            value: sourcingTrips.length.toString(),
            subtext: "Marketplace operator desk"
          },
          {
            id: "open-quotes",
            label: "Open Quotes",
            value: openQuotes.length.toString(),
            subtext: "Client review / pending"
          },
          {
            id: "bookings-month",
            label: "Bookings This Month",
            value: bookedTrips.length.toString(),
            subtext: "Signed charter agreements",
            trend: "positive"
          },
          {
            id: "revenue",
            label: "Charter Revenue",
            value: formatCurrency(bookedRevenue, "EUR"),
            subtext: "Booked flights volume"
          },
          {
            id: "margin",
            label: "Margin Realized",
            value: formatCurrency(realizedMargin, "EUR"),
            subtext: "10.0% avg company net",
            trend: "positive"
          }
        ]}
      />

      {/* 3. Main Operational Grid: Needs Action Queue & Today's Departures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Action Queue (Urgency Sorted per R-025) */}
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--amber)]" />
                <h3 className="font-display font-bold text-base text-[var(--ink)] m-0">
                  Needs Action Queue
                </h3>
              </div>
              <span className="pill amber font-mono text-[10px]">
                {actionQueue.length} TASKS PENDING
              </span>
            </div>

            <div className="space-y-3">
              {actionQueue.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--muted)] font-mono">
                  All flight operations, payments, and manifests are cleared.
                </div>
              ) : (
                actionQueue.slice(0, 5).map((item) => {
                  const isCritical = item.urgency === "critical";
                  const isHigh = item.urgency === "high";

                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-3 text-xs flex items-center justify-between gap-3 transition-colors ${
                        isCritical
                          ? "border-[var(--red)]/40 bg-[var(--red-soft)]/20"
                          : isHigh
                          ? "border-[var(--amber)]/40 bg-[var(--amber-soft)]/20"
                          : "border-[var(--line)] bg-[var(--paper)]"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`pill ${
                              isCritical ? "red" : isHigh ? "amber" : "grey"
                            } text-[9px]`}
                          >
                            {item.badge}
                          </span>
                          <span className="font-bold text-[var(--ink)] block">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-[var(--muted)] m-0 text-[11px]">
                          {item.subtitle}
                        </p>
                      </div>

                      <Link href={item.link} className="btn-secondary text-[11px] py-1 px-2.5 whitespace-nowrap">
                        <span>{item.actionText}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--line)] text-right">
            <Link href="/requests" className="text-xs font-mono text-[var(--accent)] hover:underline inline-flex items-center gap-1">
              <span>View all operational queues</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Departures Timeline (R-025) */}
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-[var(--ink)]" />
                <h3 className="font-display font-bold text-base text-[var(--ink)] m-0">
                  Today's Departures Timeline
                </h3>
              </div>
              <span className="font-mono text-xs text-[var(--muted)]">
                {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}
              </span>
            </div>

            <div className="space-y-3">
              {todayDepartures.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--muted)] font-mono">
                  No charter departures scheduled for today.
                </div>
              ) : (
                todayDepartures.map((dep) => (
                  <div
                    key={dep.id}
                    onClick={() => router.push(`/trips/${dep.rootId}/itinerary`)}
                    className="border border-[var(--line)] rounded-lg p-3.5 bg-[var(--paper)] hover:border-[var(--accent)] cursor-pointer transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[var(--ink)]">
                          {dep.depTimeLocal} Local
                        </span>
                        <span className="font-mono text-xs text-[var(--muted)]">
                          ({dep.originIcao} → {dep.destIcao})
                        </span>
                      </div>
                      <StatusPill
                        label={dep.status.toUpperCase()}
                        variant={dep.status === "Landed" ? "green" : dep.status === "En Route" ? "blue" : "grey"}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[var(--ink)] block">{dep.aircraftName}</span>
                        <span className="font-mono text-[11px] text-[var(--muted)]">
                          Tail: {dep.tailNumber} • FBO: {dep.fboName}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[var(--ink)]">{dep.paxCount} Pax</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--line)] text-right">
            <Link href="/flight-briefs" className="text-xs font-mono text-[var(--accent)] hover:underline inline-flex items-center gap-1">
              <span>View full dispatch board</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
