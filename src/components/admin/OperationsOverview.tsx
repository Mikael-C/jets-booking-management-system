"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { api } from "@/lib/api";
import {
  Plane,
  Clock,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  MoveRight,
  ExternalLink
} from "lucide-react";

import {
  FinancialHealthMetric,
  FinancialHealthData,
  FlightItem,
  NeedsActionItem,
  BoardCardItem,
  emptyFinancialHealth
} from "@/data/overviewData";

const FLIGHTS_PER_PAGE = 8;
const ACTIONS_PER_PAGE = 8;
const CARDS_PER_COLUMN = 5;

/** Small pager used by the Overview panels and the Board columns. */
function Pager({
  page,
  total,
  perPage,
  onPage,
  compact = false
}: {
  page: number;
  total: number;
  perPage: number;
  onPage: (p: number) => void;
  compact?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (total <= perPage) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  const btn =
    "px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-1 pt-3 text-[11px] text-slate-500" onClick={(e) => e.stopPropagation()}>
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          ‹
        </button>
        <span className="font-mono">
          {page}/{pages}
        </span>
        <button type="button" className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          ›
        </button>
      </div>
    );
  }
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-slate-500">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} className="px-1">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n)}
              className={`px-2.5 py-1 rounded-md border transition-colors ${
                n === page ? "bg-[#0f172a] text-white border-[#0f172a]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {n}
            </button>
          )
        )}
        <button type="button" className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export interface BoardColumn {
  id: "request" | "sourcing" | "quoted" | "booked" | "confirmed" | "flown_close";
  title: string;
  count: number;
  cards: BoardCardItem[];
}

export default function OperationsOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active view: 'overview' or 'board' (defaults to 'overview' on initial land)
  const initialViewParam = searchParams.get("view");
  const [view, setView] = useState<"overview" | "board">(
    initialViewParam === "board" ? "board" : "overview"
  );

  // Flight filter: 'next_24h' or 'today'
  const [flightFilter, setFlightFilter] = useState<"next_24h" | "today">("next_24h");

  // Needs action filter: 'everyone' or 'mine'
  const [actionFilter, setActionFilter] = useState<"everyone" | "mine">("everyone");

  // Board filter pill: 'all' | 'mine' | 'needs_action' | 'departing_7d'
  const [boardFilter, setBoardFilter] = useState<"all" | "mine" | "needs_action" | "departing_7d">("all");

  // Live clocks for Vienna and UTC
  const [liveTimes, setLiveTimes] = useState<{ vienna: string; utc: string; dateStr: string }>({
    vienna: "13:05",
    utc: "12:05",
    dateStr: "Tue 17 Nov"
  });

  // State from API / fallback
  // Everything on this page comes from the backend (/api/dashboard/*); nothing is pre-filled
  const [financialHealth, setFinancialHealth] = useState<FinancialHealthData>(emptyFinancialHealth);
  const [flightsList, setFlightsList] = useState<FlightItem[]>([]);
  const [actionItems, setActionItems] = useState<NeedsActionItem[]>([]);
  const [boardCards, setBoardCards] = useState<BoardCardItem[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "offline">("loading");
  const [reloadTick, setReloadTick] = useState(0);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [tripsByStage, setTripsByStage] = useState<{
    request: number;
    sourcing: number;
    quoted: number;
    booked: number;
    confirmed: number;
    flownClose: number;
  }>({
    request: 0,
    sourcing: 0,
    quoted: 0,
    booked: 0,
    confirmed: 0,
    flownClose: 0
  });

  // Drag and drop state for board
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Live Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      try {
        const vienna = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Vienna",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).format(now);

        const utc = new Intl.DateTimeFormat("en-GB", {
          timeZone: "UTC",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).format(now);

        const dateStr = new Intl.DateTimeFormat("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short"
        }).format(now);

        setLiveTimes({ vienna, utc, dateStr });
      } catch (e) {
        // Fallback
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Sync view switch with URL parameter without full refresh
  const handleViewChange = useCallback((newView: "overview" | "board") => {
    setView(newView);
    const params = new URLSearchParams(window.location.search);
    if (newView === "board") {
      params.set("view", "board");
    } else {
      params.delete("view");
    }
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }, []);

  // Fetch live overview and board data from the backend; refreshes every minute without a page reload
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      let ok = false;
      try {
        const overviewRes = await api.dashboard.getOverview({
          timeframe: flightFilter,
          assignee: actionFilter
        });
        if (isMounted && overviewRes?.data && !(overviewRes as any).offline) {
          ok = true;
          setFinancialHealth(overviewRes.data.financialHealth || emptyFinancialHealth);
          setFlightsList(overviewRes.data.flights?.items || []);
          setActionItems(overviewRes.data.needsAction?.items || []);
          if (overviewRes.data.tripsByStage) setTripsByStage(overviewRes.data.tripsByStage);
        }
      } catch {
        // shown as "offline" below
      }

      try {
        const boardRes = await api.dashboard.getBoard({
          curator: boardFilter === "mine" ? "mine" : "all",
          needsAction: boardFilter === "needs_action",
          departing7Days: boardFilter === "departing_7d"
        });
        if (isMounted && boardRes?.data?.columns && !(boardRes as any).offline) {
          ok = true;
          const cardsFromColumns: BoardCardItem[] = [];
          boardRes.data.columns.forEach((col: any) => {
            if (Array.isArray(col.cards)) cardsFromColumns.push(...col.cards);
          });
          setBoardCards(cardsFromColumns);
        }
      } catch {
        // shown as "offline" below
      }

      if (isMounted) setLoadState(ok ? "ready" : "offline");
    }

    loadData();
    const timer = setInterval(loadData, 60000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [flightFilter, actionFilter, boardFilter, reloadTick]);

  // Filtered flights for overview display
  const displayedFlights = useMemo(() => {
    if (flightFilter === "today") {
      return flightsList.filter((f) => f.dateGroup === "today");
    }
    return flightsList;
  }, [flightsList, flightFilter]);

  // Flights · paged (8 per page), then grouped by date
  const [flightPage, setFlightPage] = useState(1);
  useEffect(() => setFlightPage(1), [flightFilter]);
  const flightPages = Math.max(1, Math.ceil(displayedFlights.length / FLIGHTS_PER_PAGE));
  const flightPageSafe = Math.min(flightPage, flightPages);
  const pagedFlights = useMemo(
    () => displayedFlights.slice((flightPageSafe - 1) * FLIGHTS_PER_PAGE, flightPageSafe * FLIGHTS_PER_PAGE),
    [displayedFlights, flightPageSafe]
  );
  const flightsByDate = useMemo(() => {
    const today = pagedFlights.filter((f) => f.dateGroup === "today");
    const next24 = pagedFlights.filter((f) => f.dateGroup === "next_24h");
    return { today, next24 };
  }, [pagedFlights]);

  // Filtered Needs Action items
  const displayedActionItems = useMemo(() => {
    if (actionFilter === "mine") {
      return actionItems.filter((i) => i.isMine);
    }
    return actionItems;
  }, [actionItems, actionFilter]);

  // Needs action · paged (8 per page)
  const [actionPage, setActionPage] = useState(1);
  useEffect(() => setActionPage(1), [actionFilter]);
  const actionPages = Math.max(1, Math.ceil(displayedActionItems.length / ACTIONS_PER_PAGE));
  const actionPageSafe = Math.min(actionPage, actionPages);
  const pagedActionItems = useMemo(
    () => displayedActionItems.slice((actionPageSafe - 1) * ACTIONS_PER_PAGE, actionPageSafe * ACTIONS_PER_PAGE),
    [displayedActionItems, actionPageSafe]
  );

  // Board · each column has its own page (5 cards per page); back to page 1 when the filter changes
  const [columnPages, setColumnPages] = useState<Record<string, number>>({});
  useEffect(() => setColumnPages({}), [boardFilter]);

  // Filtered Board Cards
  const displayedBoardCards = useMemo(() => {
    let result = [...boardCards];
    if (boardFilter === "mine") {
      result = result.filter((c) => c.isMine);
    } else if (boardFilter === "needs_action") {
      result = result.filter((c) => c.needsAction);
    } else if (boardFilter === "departing_7d") {
      result = result.filter((c) => c.departingIn7Days);
    }
    return result;
  }, [boardCards, boardFilter]);

  // Board columns configured
  const boardColumns: BoardColumn[] = useMemo(() => {
    const stages: Array<"request" | "sourcing" | "quoted" | "booked" | "confirmed" | "flown_close"> = [
      "request",
      "sourcing",
      "quoted",
      "booked",
      "confirmed",
      "flown_close"
    ];

    const titleMap: Record<string, string> = {
      request: "REQUEST",
      sourcing: "SOURCING",
      quoted: "QUOTED",
      booked: "BOOKED",
      confirmed: "CONFIRMED",
      flown_close: "FLOWN · CLOSE"
    };

    return stages.map((stg) => {
      const cardsInStage = displayedBoardCards.filter((c) => c.stage === stg);
      return {
        id: stg,
        title: titleMap[stg],
        count: cardsInStage.length,
        cards: cardsInStage
      };
    });
  }, [displayedBoardCards]);

  // Handle drag and drop across columns
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.setData("text/plain", cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: BoardColumn["id"]) => {
    e.preventDefault();
    const cardId = draggedCardId || e.dataTransfer.getData("text/plain");
    if (!cardId) return;

    const previous = boardCards;
    const card = boardCards.find((c) => c.id === cardId);
    setDraggedCardId(null);
    if (!card || card.stage === targetStage) return;

    // Optimistic move, then saved on the booking / request by the backend
    setBoardCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, stage: targetStage } : c)));
    const key = (st: string) => (st === "flown_close" ? "flownClose" : st) as keyof typeof tripsByStage;
    setTripsByStage((prev) => ({
      ...prev,
      [key(card.stage)]: Math.max(0, prev[key(card.stage)] - 1),
      [key(targetStage)]: prev[key(targetStage)] + 1
    }));

    try {
      await api.dashboard.updateCardStage(cardId, targetStage);
      setMoveError(null);
      setReloadTick((t) => t + 1);
    } catch (err: any) {
      // Put the card back where it was
      setBoardCards(previous);
      setReloadTick((t) => t + 1);
      setMoveError(err?.message || "The card could not be moved. Try again.");
      setTimeout(() => setMoveError(null), 5000);
    }
  };

  // Badge color helper
  const getBadgeClasses = (variant: string | null) => {
    switch (variant) {
      case "green":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
      case "rose":
        return "bg-rose-50 text-rose-700 border border-rose-200/80";
      case "amber":
        return "bg-amber-50 text-amber-800 border border-amber-200/80";
      case "peach":
        return "bg-[#FEF3C7] text-[#92400E] border border-amber-200/80";
      case "sky":
        return "bg-sky-50 text-sky-700 border border-sky-200/80";
      case "slate":
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200/80";
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ─── Top Header with Switcher & Live Clock ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Breadcrumb / Title */}
        <div>
          {view === "board" ? (
            <div className="space-y-1">
              <div className="text-xs text-slate-400 font-medium">Overview / Board view</div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 m-0">
                Overview · board
              </h1>
            </div>
          ) : (
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 m-0">
                Overview · {liveTimes.dateStr}
              </h1>
            </div>
          )}
        </div>

        {/* Right: Live indicator & Toggle Buttons */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {view === "overview" && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                Live · {liveTimes.vienna} Vienna · {liveTimes.utc} UTC
              </span>
            </div>
          )}

          {/* Toggle Buttons: Overview / Board */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => handleViewChange("overview")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                view === "overview"
                  ? "bg-[#0f172a] text-white shadow-xs"
                  : "bg-white text-slate-700 hover:text-slate-900"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("board")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                view === "board"
                  ? "bg-[#0f172a] text-white shadow-xs"
                  : "bg-white text-slate-700 hover:text-slate-900"
              }`}
            >
              Board
            </button>
          </div>
        </div>
      </div>

      {/* Connection status · the page only shows live data */}
      {loadState === "offline" && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-4 py-2.5 text-xs">
          <span>Can&apos;t reach the server, so the figures below may be out of date. It retries every minute.</span>
          <button
            type="button"
            onClick={() => {
              setLoadState("loading");
              setReloadTick((t) => t + 1);
            }}
            className="font-semibold underline underline-offset-2"
          >
            Retry now
          </button>
        </div>
      )}
      {moveError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-4 py-2.5 text-xs">{moveError}</div>
      )}

      {/* ─── Board View Subheader Filters ─────────────────────────────────── */}
      {view === "board" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setBoardFilter("all")}
            className={`px-3.5 py-1 rounded-full font-medium transition-all ${
              boardFilter === "all"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Curators
          </button>
          <button
            type="button"
            onClick={() => setBoardFilter("mine")}
            className={`px-3.5 py-1 rounded-full font-medium transition-all ${
              boardFilter === "mine"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Mine
          </button>
          <button
            type="button"
            onClick={() => setBoardFilter("needs_action")}
            className={`px-3.5 py-1 rounded-full font-medium transition-all ${
              boardFilter === "needs_action"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Needs action
          </button>
          <button
            type="button"
            onClick={() => setBoardFilter("departing_7d")}
            className={`px-3.5 py-1 rounded-full font-medium transition-all ${
              boardFilter === "departing_7d"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Departing 7 days
          </button>
        </div>
      )}

      {/* ─── Overview View: 2 Top Operational Columns ──────────────────────── */}
      {view === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Flights · today and next 24 h */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Header with Today / Next 24 h toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 m-0">
                  Flights · today and next 24 h · {displayedFlights.length}
                </h3>
                <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setFlightFilter("today")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                      flightFilter === "today"
                        ? "bg-[#0f172a] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlightFilter("next_24h")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                      flightFilter === "next_24h"
                        ? "bg-[#0f172a] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Next 24 h
                  </button>
                </div>
              </div>

              {/* Flights rows */}
              <div className="pt-3 space-y-4">
                {displayedFlights.length === 0 && (
                  <div className="text-xs text-slate-400 py-6 text-center">
                    {loadState === "loading"
                      ? "Loading flights…"
                      : flightFilter === "today"
                      ? "No flights departing today."
                      : "No flights departing in the next 24 h."}
                  </div>
                )}
                {/* Today section */}
                {flightsByDate.today.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-semibold text-slate-400">
                      {liveTimes.dateStr}
                    </div>
                    {flightsByDate.today.map((flight) => (
                      <div
                        key={flight.id}
                        onClick={() => router.push(`/trips/${flight.tripId}/itinerary`)}
                        className="flex items-center justify-between gap-3 text-xs py-1 hover:bg-slate-50/80 px-1 rounded transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono font-bold text-slate-900 w-11 shrink-0">
                            {flight.time}
                          </span>
                          <span className="text-slate-700 truncate">
                            <span className="text-slate-400 font-mono text-[11px] mr-1.5">
                              {flight.code}
                            </span>
                            <span className="font-medium mr-1.5">{flight.route}</span>
                            {flight.leg && (
                              <span className="text-slate-400 mr-1.5">· {flight.leg}</span>
                            )}
                            <span className="text-slate-500">· {flight.aircraft}</span>
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 whitespace-nowrap ${getBadgeClasses(
                            flight.badgeVariant
                          )}`}
                        >
                          {flight.badgeText}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Next 24h section */}
                {flightFilter === "next_24h" && flightsByDate.next24.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400">
                      {flightsByDate.next24[0]?.dateLabel || "Next 24 h"}
                    </div>
                    {flightsByDate.next24.map((flight) => (
                      <div
                        key={flight.id}
                        onClick={() => router.push(`/trips/${flight.tripId}/itinerary`)}
                        className="flex items-center justify-between gap-3 text-xs py-1 hover:bg-slate-50/80 px-1 rounded transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono font-bold text-slate-900 w-11 shrink-0">
                            {flight.time}
                          </span>
                          <span className="text-slate-700 truncate">
                            <span className="text-slate-400 font-mono text-[11px] mr-1.5">
                              {flight.code}
                            </span>
                            <span className="font-medium mr-1.5">{flight.route}</span>
                            {flight.leg && (
                              <span className="text-slate-400 mr-1.5">· {flight.leg}</span>
                            )}
                            <span className="text-slate-500">· {flight.aircraft}</span>
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 whitespace-nowrap ${getBadgeClasses(
                            flight.badgeVariant
                          )}`}
                        >
                          {flight.badgeText}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer note */}
            <div className="pt-4 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
              <Pager page={flightPageSafe} total={displayedFlights.length} perPage={FLIGHTS_PER_PAGE} onPage={setFlightPage} />
              <div className={displayedFlights.length > FLIGHTS_PER_PAGE ? "pt-3" : ""}>
                Local departure times · live status from flight tracking · updates without refresh
              </div>
            </div>
          </div>

          {/* Right Column: Needs action · {count} */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Header with Everyone / Mine toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 m-0">
                  Needs action · {displayedActionItems.length}
                </h3>
                <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setActionFilter("everyone")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                      actionFilter === "everyone"
                        ? "bg-[#0f172a] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Everyone
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionFilter("mine")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                      actionFilter === "mine"
                        ? "bg-[#0f172a] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Mine
                  </button>
                </div>
              </div>

              {/* Needs Action List */}
              <div className="pt-3 space-y-3">
                {displayedActionItems.length === 0 && (
                  <div className="text-xs text-slate-400 py-6 text-center">
                    {loadState === "loading"
                      ? "Loading…"
                      : actionFilter === "mine"
                      ? "Nothing assigned to you needs action."
                      : "Nothing needs action right now."}
                  </div>
                )}
                {pagedActionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-xs py-1 px-1 rounded hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Urgency Pill */}
                      <span
                        className={`w-18 shrink-0 text-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          item.badgeVariant === "rose"
                            ? "bg-rose-100 text-rose-700"
                            : item.badgeVariant === "amber"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.urgency}
                      </span>

                      {/* Description */}
                      <span className="text-slate-800 truncate font-medium">
                        {item.title}
                      </span>
                    </div>

                    {/* Right Link */}
                    <Link
                      href={item.linkUrl}
                      className="text-slate-500 hover:text-slate-900 font-medium shrink-0 flex items-center gap-1 transition-colors whitespace-nowrap"
                    >
                      <span>{item.linkText}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer note */}
            <div className="pt-4 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
              <Pager page={actionPageSafe} total={displayedActionItems.length} perPage={ACTIONS_PER_PAGE} onPage={setActionPage} />
              <div className={displayedActionItems.length > ACTIONS_PER_PAGE ? "pt-3" : ""}>
                Sorted by urgency, most overdue first. &ldquo;Mine&rdquo; shows only tasks assigned to you.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Financial Health Metrics Row (Displayed on both Overview & Board) ── */}
      <div className="space-y-3">
        {view === "overview" && (
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            FINANCIAL HEALTH · {financialHealth.monthLabel || new Date().toLocaleDateString("en-GB", { month: "long" }).toUpperCase()}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. UNPAID */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                UNPAID
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                € {financialHealth.unpaid.amount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {financialHealth.unpaid.label}
              </div>
            </div>
            <Link
              href={financialHealth.unpaid.link}
              className="text-xs text-slate-500 hover:text-slate-900 mt-3 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Payments · unpaid →</span>
            </Link>
          </div>

          {/* 2. OVERDUE */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
                OVERDUE
              </div>
              <div className="text-xl font-bold text-rose-600 mt-1">
                € {financialHealth.overdue.amount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {financialHealth.overdue.label}
              </div>
            </div>
            <Link
              href={financialHealth.overdue.link}
              className="text-xs text-slate-500 hover:text-slate-900 mt-3 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Payments · overdue →</span>
            </Link>
          </div>

          {/* 3. RECEIVED · NOV */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                RECEIVED · {financialHealth.received.month || new Date().toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                € {financialHealth.received.amount.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-0.5">
                {financialHealth.received.compareText}
              </div>
            </div>
            <Link
              href={financialHealth.received.link}
              className="text-xs text-slate-500 hover:text-slate-900 mt-3 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Cash report →</span>
            </Link>
          </div>

          {/* 4. COMPANY MARGIN · NOV */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                COMPANY MARGIN · {financialHealth.companyMargin.month || new Date().toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                € {financialHealth.companyMargin.amount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {financialHealth.companyMargin.compareText}
              </div>
            </div>
            <Link
              href={financialHealth.companyMargin.link}
              className="text-xs text-slate-500 hover:text-slate-900 mt-3 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Margin report →</span>
            </Link>
          </div>

          {/* 5. CURATOR PAYOUTS DUE */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                CURATOR PAYOUTS DUE
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                € {financialHealth.curatorPayoutsDue.amount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {financialHealth.curatorPayoutsDue.label}
              </div>
            </div>
            <Link
              href={financialHealth.curatorPayoutsDue.link}
              className="text-xs text-slate-500 hover:text-slate-900 mt-3 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Curators · payouts →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Trips by stage (Overview View Bottom Card) ────────────────────── */}
      {view === "overview" && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 m-0">Trips by stage</h3>
            <button
              type="button"
              onClick={() => handleViewChange("board")}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Open board view →</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
            <div
              onClick={() => handleViewChange("board")}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                REQUEST
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {tripsByStage.request}
              </div>
            </div>

            <div
              onClick={() => handleViewChange("board")}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                SOURCING
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {tripsByStage.sourcing}
              </div>
            </div>

            <div
              onClick={() => handleViewChange("board")}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                QUOTED
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {tripsByStage.quoted}
              </div>
            </div>

            <div
              onClick={() => handleViewChange("board")}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                BOOKED
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {tripsByStage.booked}
              </div>
            </div>

            <div
              onClick={() => handleViewChange("board")}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                CONFIRMED
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {tripsByStage.confirmed}
              </div>
            </div>

            <div
              onClick={() => handleViewChange("board")}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                FLOWN · CLOSE
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {tripsByStage.flownClose}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Board View: 6-Column Kanban Board ─────────────────────────────── */}
      {view === "board" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-start">
            {boardColumns.map((col) => {
              const colPages = Math.max(1, Math.ceil(col.cards.length / CARDS_PER_COLUMN));
              const colPage = Math.min(columnPages[col.id] || 1, colPages);
              const colCards = col.cards.slice((colPage - 1) * CARDS_PER_COLUMN, colPage * CARDS_PER_COLUMN);
              return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3 min-h-[460px] flex flex-col justify-between"
              >
                <div>
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 px-1 text-slate-700">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {col.title}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {col.count}
                    </span>
                  </div>

                  {/* Cards inside column */}
                  <div className="space-y-3">
                    {col.cards.length === 0 ? (
                      <div className="text-center py-10 text-[11px] text-slate-400 font-mono border border-dashed border-slate-200 rounded-lg">
                        Empty
                      </div>
                    ) : (
                      colCards.map((card) => (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, card.id)}
                          onClick={() => router.push(card.linkUrl)}
                          className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer space-y-2 group"
                        >
                          {/* Code */}
                          <div className="text-[11px] font-mono text-slate-400">
                            {card.code}
                          </div>

                          {/* Route */}
                          <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                            {card.route}
                          </div>

                          {/* Details */}
                          <div className="text-xs text-slate-500 leading-snug">
                            {card.details}
                          </div>

                          {/* Badge (if exists) */}
                          {card.badge && (
                            <div className="pt-1">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${getBadgeClasses(
                                  card.badgeVariant
                                )}`}
                              >
                                {card.badge}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <Pager
                  compact
                  page={colPage}
                  total={col.cards.length}
                  perPage={CARDS_PER_COLUMN}
                  onPage={(p) => setColumnPages((prev) => ({ ...prev, [col.id]: p }))}
                />
              </div>
              );
            })}
          </div>

          {/* Board Footer note */}
          <div className="text-xs text-slate-500 pt-2">
            Every card opens its request, quote or trip on the tab its flag belongs to. Newest first inside each column.
          </div>
        </div>
      )}
    </div>
  );
}
