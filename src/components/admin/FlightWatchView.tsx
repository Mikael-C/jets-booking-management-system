"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FlightWatchItem, FlightWatchSummary, FlightWatchAlertRules } from "@/types/aviation";
import {
  Plane,
  AlertTriangle,
  Clock,
  Radio,
  Share2,
  Sliders,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  Compass,
  ArrowRight,
  ShieldAlert,
  Bell
} from "lucide-react";

export default function FlightWatchView() {
  const [flights, setFlights] = useState<FlightWatchItem[]>([]);
  const [summary, setSummary] = useState<FlightWatchSummary>({
    airborneCount: 1,
    airborneActiveTrip: "FE4578",
    departingNext6hCount: 3,
    delayedCount: 1,
    delayedActiveTrip: "MX5521 - 40 min",
    openAlertsCount: 1,
    openAlertsNote: "needs duty officer",
  });
  const [alertRules, setAlertRules] = useState<FlightWatchAlertRules>({
    departureDelayMinutes: 15,
    departureTemplateCode: "FW-02",
    squawkAlertNotification: "FW-04 to duty officer and MD",
    noPositionCallMinutes: 20,
  });
  const [loading, setLoading] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(60);

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [generatedShareLink, setGeneratedShareLink] = useState<{
    token: string;
    url: string;
    expiresAt: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchFlightWatchData = async () => {
    try {
      const res = await api.flightWatch.list();
      if (res && res.success) {
        if (res.data) setFlights(res.data);
        if (res.summary) setSummary(res.summary);
        if (res.alertRules) setAlertRules(res.alertRules);
      }
    } catch (e) {
      console.warn("Could not load flight watch from API, using fallback data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlightWatchData();
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchFlightWatchData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenShareModal = async (tripNum?: string) => {
    try {
      const res = await api.flightWatch.shareLink(tripNum || "FE4578-005");
      if (res && res.data) {
        setGeneratedShareLink({
          token: res.data.token,
          url: `${window.location.origin}/live-flight/${res.data.token}`,
          expiresAt: res.data.expiresAt,
        });
      }
    } catch {
      const token = "flw_" + Math.random().toString(36).substring(2, 8);
      setGeneratedShareLink({
        token,
        url: `${window.location.origin}/live-flight/${token}`,
        expiresAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      });
    }
    setIsShareModalOpen(true);
  };

  const handleCopyShareLink = () => {
    if (generatedShareLink?.url) {
      navigator.clipboard.writeText(generatedShareLink.url);
      setCopiedLink(true);
      showToast("Live flight tracking link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.flightWatch.updateRules(alertRules);
      showToast("Alert rules updated successfully");
      setIsRulesModalOpen(false);
    } catch {
      showToast("Rules updated locally");
      setIsRulesModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B1320] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 border border-gray-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-gray-400 font-medium tracking-tight mb-1">
            Work / Flight watch
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">
            Flight watch
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenShareModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-gray-500" />
            <span>Share live link</span>
          </button>
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#0B1320] text-white hover:bg-[#151D2A] shadow-sm transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-gray-300" />
            <span>Alert rules</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Airborne */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            AIRBORNE
          </div>
          <div className="text-2xl font-bold text-gray-900 font-sans">
            {summary.airborneCount}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">
            {summary.airborneActiveTrip}
          </div>
        </div>

        {/* Card 2: Departing Next 6 H */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            DEPARTING NEXT 6 H
          </div>
          <div className="text-2xl font-bold text-gray-900 font-sans">
            {summary.departingNext6hCount}
          </div>
          <div className="text-xs text-gray-400 font-medium mt-0.5">
            Confirmed slots
          </div>
        </div>

        {/* Card 3: Delayed */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            DELAYED
          </div>
          <div className="text-2xl font-bold text-gray-900 font-sans">
            {summary.delayedCount}
          </div>
          <div className="text-xs text-amber-600 font-medium mt-0.5">
            {summary.delayedActiveTrip}
          </div>
        </div>

        {/* Card 4: Open Alerts */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            OPEN ALERTS
          </div>
          <div className="text-2xl font-bold text-gray-900 font-sans">
            {summary.openAlertsCount}
          </div>
          <div className="text-xs text-rose-500 font-medium mt-0.5">
            {summary.openAlertsNote}
          </div>
        </div>
      </div>

      {/* Main Section: Interactive Live Map + Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Live Map Box (2 Columns) */}
        <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Map Header */}
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">Live map</span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ADS-B Active
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>Positions from ADS-B data feed, refreshed every 60 s</span>
              <button
                onClick={() => fetchFlightWatchData()}
                title="Force refresh"
                className="hover:text-gray-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Interactive Radar/ADS-B Map Viewport */}
          <div className="relative flex-1 min-h-[340px] bg-[#E8EEF5] flex items-center justify-center overflow-hidden select-none">
            {/* Soft stylized map continent silhouettes */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
              viewBox="0 0 800 450"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <radialGradient id="airRadarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="#EEF2F7" />
              {/* Landmass silhouettes approximating Europe & North/West Africa */}
              <path
                d="M180,60 Q260,40 380,70 Q450,90 490,140 Q420,180 340,200 Q260,240 220,180 Q160,120 180,60 Z"
                fill="#DCE5EF"
              />
              <path
                d="M320,240 Q420,220 540,260 Q580,340 500,420 Q360,440 290,360 Q260,280 320,240 Z"
                fill="#DCE5EF"
              />
              {/* Sector range rings */}
              <circle cx="360" cy="180" r="80" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="360" cy="180" r="160" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="360" cy="180" r="240" fill="url(#airRadarGlow)" />
            </svg>

            {/* SVG Flight Routes & Airway Vector Paths */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 450">
              {/* Route 1: LEIB to LSGG (Active Flight D-IOBA - FE4578) */}
              <path
                d="M 280 220 Q 340 180 375 145"
                fill="none"
                stroke="#0284C7"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
              {/* Route 2: LFPB to LIML (Boarding OE-GLX - RB3310) */}
              <path
                d="M 330 110 L 400 135"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {/* Route 3: LFPB to DNAA (Delayed 9H-VJA - MX5521) */}
              <path
                d="M 330 110 Q 370 230 430 350"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Airport Waypoint Markers */}
              {/* LEIB */}
              <circle cx="280" cy="220" r="3.5" fill="#0B1320" />
              <text x="260" y="235" fontSize="11" fontWeight="600" fill="#475569" fontFamily="sans-serif">
                LEIB
              </text>
              {/* LSGG */}
              <circle cx="375" cy="145" r="3.5" fill="#0B1320" />
              <text x="382" y="148" fontSize="11" fontWeight="600" fill="#475569" fontFamily="sans-serif">
                LSGG
              </text>
              {/* LFPB */}
              <circle cx="330" cy="110" r="3.5" fill="#0B1320" />
              <text x="310" y="102" fontSize="11" fontWeight="600" fill="#475569" fontFamily="sans-serif">
                LFPB
              </text>
              {/* LIML */}
              <circle cx="400" cy="135" r="3.5" fill="#0B1320" />
              <text x="408" y="132" fontSize="11" fontWeight="600" fill="#475569" fontFamily="sans-serif">
                LIML
              </text>
              {/* DNAA */}
              <circle cx="430" cy="350" r="3.5" fill="#0B1320" />
              <text x="440" y="355" fontSize="11" fontWeight="600" fill="#475569" fontFamily="sans-serif">
                DNAA
              </text>

              {/* ACTIVE PLANE: D-IOBA on FE4578 at ~ (335, 178) */}
              <g transform="translate(338, 178)">
                {/* Radar ping ring animation */}
                <circle cx="0" cy="0" r="16" fill="none" stroke="#0284C7" strokeWidth="1.5" className="animate-ping opacity-60" />
                <circle cx="0" cy="0" r="7" fill="#0284C7" />
                <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
              </g>
            </svg>

            {/* Aircraft Floating Tag Card on Map */}
            <div
              className="absolute left-[44%] top-[34%] bg-[#0B1320] text-white px-2.5 py-1 rounded-md shadow-lg border border-gray-700/80 flex items-center gap-2 text-[11px] font-sans font-medium pointer-events-auto cursor-pointer hover:bg-[#1E293B] transition-colors"
              onClick={() => handleOpenShareModal("FE4578-005")}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>D-IOBA · FE4578</span>
            </div>

            {/* Map bottom-left telemetry badge */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-gray-200/80 text-[10px] text-gray-600 font-mono flex items-center gap-3 shadow-xs">
              <span>ACTIVE: 1</span>
              <span>•</span>
              <span>RADAR ALT: FL410</span>
              <span>•</span>
              <span>GS: 425 KTS</span>
            </div>
          </div>
        </div>

        {/* Right Rail: Alert & Alert Rules & Shared Live Link (1 Column) */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Alert Card */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                ALERT · 08:52
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="font-semibold text-gray-900 text-xs tracking-tight">
              MX5521 delayed 40 min
            </div>
            <div className="text-xs text-gray-600 leading-relaxed">
              Crew duty start late. New ETD 09:10.
            </div>
            <div className="pt-1">
              <span className="inline-block bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[11px] font-medium px-2 py-0.5 rounded-md">
                FW-02 sent to Curator and driver
              </span>
            </div>
          </div>

          {/* Alert Rules Card */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                ALERT RULES
              </span>
              <button
                onClick={() => setIsRulesModalOpen(true)}
                className="text-[11px] text-[#E59700] hover:underline font-medium"
              >
                Edit
              </button>
            </div>
            <ul className="text-xs text-gray-700 space-y-2 leading-snug">
              <li className="flex items-start gap-1.5">
                <span className="text-gray-400 font-bold">•</span>
                <span>Departure &gt; 15 min late → FW-02</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-gray-400 font-bold">•</span>
                <span>Diversion or emergency squawk → FW-04 to duty officer and MD</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-gray-400 font-bold">•</span>
                <span>No position 20 min after slot → call operator</span>
              </li>
            </ul>
          </div>

          {/* Shared Live Link Card */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-2">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              SHARED LIVE LINK
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Read-only page for family or an assistant: aircraft, route, ETA. No names, no prices. Expires 2 h after landing.
            </p>
            <div className="pt-1">
              <button
                onClick={() => handleOpenShareModal()}
                className="w-full text-center py-2 px-3 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-gray-500" />
                <span>Create link for leg</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Watch Legs Table */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FA] border-b border-gray-200/80 text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none">
              <tr>
                <th className="py-3 px-4">TRIP</th>
                <th className="py-3 px-4">AIRCRAFT</th>
                <th className="py-3 px-4">ROUTE</th>
                <th className="py-3 px-4">SCHED. OFF / ON (UTC)</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">NOW</th>
                <th className="py-3 px-4">MESSAGES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flights.map((f, idx) => (
                <tr
                  key={f.tripNumber || idx}
                  className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                  onClick={() => handleOpenShareModal(f.tripNumber)}
                >
                  {/* Trip Number */}
                  <td className="py-3.5 px-4 font-mono font-medium text-gray-900 whitespace-nowrap">
                    {f.tripNumber}
                  </td>

                  {/* Aircraft */}
                  <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{f.aircraft?.registration}</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span className="text-gray-600">{f.aircraft?.type}</span>
                  </td>

                  {/* Route */}
                  <td className="py-3.5 px-4 font-mono text-gray-800 whitespace-nowrap">
                    <span>{f.route?.fromIcao}</span>
                    <span className="text-gray-400 mx-1.5">→</span>
                    <span>{f.route?.toIcao}</span>
                  </td>

                  {/* Schedule */}
                  <td className="py-3.5 px-4 text-gray-600 font-mono whitespace-nowrap">
                    {f.schedule?.scheduledOffUtc} / {f.schedule?.scheduledOnUtc}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {f.status === "airborne_on_time" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                        {f.statusLabel || "Airborne · on time"}
                      </span>
                    )}
                    {f.status === "boarding" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE]">
                        {f.statusLabel || "Boarding"}
                      </span>
                    )}
                    {f.status === "delayed" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                        {f.statusLabel || "Delayed 40 min"}
                      </span>
                    )}
                    {f.status === "scheduled" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        {f.statusLabel || "Scheduled"}
                      </span>
                    )}
                  </td>

                  {/* Now */}
                  <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                    {f.nowDescription}
                  </td>

                  {/* Messages */}
                  <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                    {f.messagesSummary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="px-5 py-3 border-t border-gray-100 bg-[#FAFAFA] text-xs text-gray-500 leading-normal">
          Every confirmed leg is watched automatically from 3 h before departure until 30 min after landing, using the registration from the flight brief.
        </div>
      </div>

      {/* MODAL 1: Share Live Link */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#E59700]" />
                <h3 className="font-bold text-gray-900 text-base">Shared live link</h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              This link gives real-time access to flight location, route, and ETA. Client names, passenger details, and financial costs are fully hidden.
            </p>

            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-2">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                READ-ONLY URL
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedShareLink?.url || ""}
                  className="w-full text-xs font-mono bg-white border border-gray-200 rounded px-2.5 py-1.5 text-gray-800 select-all"
                />
                <button
                  onClick={handleCopyShareLink}
                  className="px-3 py-1.5 bg-[#0B1320] text-white rounded text-xs font-medium hover:bg-[#151D2A] flex items-center gap-1 flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 flex items-center justify-between">
              <span>Security: Tokenized & public</span>
              <span>Expires: 2 hours post-landing</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Alert Rules */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#E59700]" />
                <h3 className="font-bold text-gray-900 text-base">Flight watch alert rules</h3>
              </div>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRules} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Departure delay threshold (minutes)
                </label>
                <input
                  type="number"
                  value={alertRules.departureDelayMinutes}
                  onChange={(e) =>
                    setAlertRules({ ...alertRules, departureDelayMinutes: Number(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Triggers delay alert FW-02 to Curator and driver.
                </span>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Diversion or Squawk Emergency Notification
                </label>
                <input
                  type="text"
                  value={alertRules.squawkAlertNotification}
                  onChange={(e) =>
                    setAlertRules({ ...alertRules, squawkAlertNotification: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Triggered immediately upon squawk 7500 / 7600 / 7700 or heading deviation.
                </span>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  No position after slot (minutes)
                </label>
                <input
                  type="number"
                  value={alertRules.noPositionCallMinutes}
                  onChange={(e) =>
                    setAlertRules({ ...alertRules, noPositionCallMinutes: Number(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Escalates to operator dispatch control automatically.
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRulesModalOpen(false)}
                  className="px-3.5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B1320] text-white rounded-lg hover:bg-[#151D2A] font-medium"
                >
                  Save alert rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
