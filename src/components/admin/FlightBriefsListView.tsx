"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { formatDocumentId } from "@/lib/idGenerator";
import StatusPill from "@/components/ui/StatusPill";
import RecordHeader from "@/components/ui/RecordHeader";
import KpiStrip from "@/components/ui/KpiStrip";
import {
  Search,
  Eye,
  Compass,
  Plane,
  Calendar,
  Building
} from "lucide-react";

export default function FlightBriefsListView() {
  const router = useRouter();
  const { bookings, openDocument } = useAviation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const briefs = useMemo(() => {
    return bookings
      .filter((b) => b.legs && b.legs.length > 0)
      .map((b) => {
        const rootId = (b.tripId || b.tripNumber || "FE4578").split("-")[0];
        const versionNum = b.quoteVersion || 1;
        const briefId = formatDocumentId("FB", rootId, versionNum);
        const leg = b.legs[0];

        // Status logic
        let briefStatus: "draft" | "briefed" | "dispatched" | "flown" = "briefed";
        if (b.status === "completed" || b.status === "flown") briefStatus = "flown";
        else if (b.status === "dispatched") briefStatus = "dispatched";
        else if (!b.isBooked && b.status === "quoted") briefStatus = "draft";

        return {
          id: b.id,
          briefId,
          rootId,
          flightDate: leg?.flightDate || b.contractDate || "20.11.2026",
          departureTime: leg?.departureTimeLocal || "10:00",
          originIcao: leg?.origin?.icao || "LEIB",
          destIcao: leg?.destination?.icao || "LSGG",
          aircraftName: b.aircraft.name,
          tailNumber: leg?.aircraftRegistration || b.aircraft.registration || "OE-FFB",
          paxCount: leg?.paxCount || 4,
          fboDep: leg?.departureHandling?.name || "ExecuJet FBO",
          fboArr: leg?.arrivalHandling?.name || "Jet Aviation",
          status: briefStatus,
          booking: b
        };
      });
  }, [bookings]);

  const filteredBriefs = useMemo(() => {
    return briefs.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchId = item.briefId.toLowerCase().includes(q);
        const matchTrip = item.rootId.toLowerCase().includes(q);
        const matchOrigin = item.originIcao.toLowerCase().includes(q);
        const matchDest = item.destIcao.toLowerCase().includes(q);
        const matchTail = item.tailNumber.toLowerCase().includes(q);
        const matchAircraft = item.aircraftName.toLowerCase().includes(q);
        if (!matchId && !matchTrip && !matchOrigin && !matchDest && !matchTail && !matchAircraft) return false;
      }

      return true;
    });
  }, [briefs, statusFilter, searchQuery]);

  const dispatchedCount = briefs.filter((b) => b.status === "dispatched" || b.status === "briefed").length;
  const flownCount = briefs.filter((b) => b.status === "flown").length;

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <RecordHeader
        title="Flight Briefs"
        subtitle="Operational flight dispatch briefs, crew assignments, and airport handling manifests"
        badge="R-036 DISPATCH REPOSITORY"
        breadcrumbs={[{ label: "Overview", href: "/overview" }, { label: "Flight Briefs" }]}
      />

      {/* 2. KPI Strip */}
      <KpiStrip
        items={[
          {
            id: "active",
            label: "Active Briefs",
            value: dispatchedCount.toString(),
            subtext: "Ready for departure / briefed crew",
            trend: "positive"
          },
          {
            id: "flown",
            label: "Flown Missions",
            value: flownCount.toString(),
            subtext: "Historical archived flight briefs"
          },
          {
            id: "total",
            label: "Total Dispatch",
            value: briefs.length.toString(),
            subtext: "Total legs generated"
          },
          {
            id: "fbo",
            label: "FBO Integration",
            value: "100%",
            subtext: "Direct handling coordinates"
          }
        ]}
      />

      {/* 3. Search and Filters */}
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Brief ID, Trip ID, ICAO, Tail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--ink)]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all", label: "All Briefs" },
            { id: "briefed", label: "Briefed" },
            { id: "dispatched", label: "Dispatched" },
            { id: "flown", label: "Flown" },
            { id: "draft", label: "Draft" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-display uppercase tracking-wider font-bold rounded-lg transition-all ${
                statusFilter === tab.id
                  ? "bg-[var(--ink)] text-[var(--card)]"
                  : "bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Dense Register Table */}
      <div className="tablewrap">
        <table className="dense-table">
          <thead>
            <tr>
              <th>Brief ID</th>
              <th>Trip ID</th>
              <th>Flight Date</th>
              <th>Route</th>
              <th>Departure Time</th>
              <th>Aircraft & Tail</th>
              <th>FBO Departure</th>
              <th>FBO Arrival</th>
              <th>Pax</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBriefs.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-xs text-[var(--muted)] font-mono">
                  No flight briefs match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredBriefs.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => router.push(`/trips/${b.rootId}/itinerary`)}
                  className="cursor-pointer hover:bg-[var(--paper)] transition-colors"
                >
                  <td className="font-mono font-bold text-xs text-[var(--ink)]">
                    {b.briefId}
                  </td>
                  <td className="font-mono font-bold text-xs">
                    <Link
                      href={`/trips/${b.rootId}/itinerary`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline text-[var(--accent)]"
                    >
                      {b.rootId}
                    </Link>
                  </td>
                  <td className="font-mono text-xs">{b.flightDate}</td>
                  <td className="font-mono font-bold text-xs">
                    {b.originIcao} → {b.destIcao}
                  </td>
                  <td className="font-mono text-xs">{b.departureTime} Local</td>
                  <td>
                    <span className="font-bold text-xs text-[var(--ink)] block">{b.aircraftName}</span>
                    <span className="font-mono text-[11px] text-[var(--muted)]">{b.tailNumber}</span>
                  </td>
                  <td className="text-xs text-[var(--muted)] truncate max-w-[140px]" title={b.fboDep}>
                    {b.fboDep}
                  </td>
                  <td className="text-xs text-[var(--muted)] truncate max-w-[140px]" title={b.fboArr}>
                    {b.fboArr}
                  </td>
                  <td className="font-mono text-xs font-bold">{b.paxCount}</td>
                  <td>
                    <StatusPill
                      label={b.status.toUpperCase()}
                      variant={b.status === "flown" || b.status === "briefed" ? "green" : b.status === "dispatched" ? "blue" : "grey"}
                    />
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openDocument(b.booking, "flight_brief")}
                      className="btn-secondary text-[11px] py-1 px-2"
                      title="View PDF Document"
                    >
                      <Eye className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
