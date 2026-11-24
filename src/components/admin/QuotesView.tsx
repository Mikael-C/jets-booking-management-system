"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { Booking } from "@/types/aviation";
import { extractFeToken, renderFormattedId } from "@/lib/idGenerator";
import { formatCurrency } from "@/lib/pricingCalculator";
import {
  Search,
  Plus,
  ExternalLink,
  ChevronDown,
  FileText,
  RotateCw
} from "lucide-react";

type QuoteFilter =
  | "open"
  | "expiring_today"
  | "curator_confirmed"
  | "draft"
  | "expired"
  | "declined";

interface QuoteItemData {
  id: string;
  rootId: string;
  quoteCode: string;
  versionsCount: number;
  flightDate: string;
  flightTimeStr: string;
  originIcao: string;
  destIcao: string;
  routeTitle: string;
  tripTypeLabel: string;
  account: string;
  authorisedPerson: string;
  curator: string;
  curatorMarginPct: number;
  aircraftCategory: string;
  aircraftModel: string;
  aircraftYear?: string;
  aircraftFeatures?: string;
  pax: number;
  clientPrice: string;
  clientPriceNum: number;
  expiresIn: string;
  status: "open" | "expiring_today" | "curator_confirmed" | "draft" | "expired" | "declined";
  operatorCost: string;
  companyMargin: string;
  companyMarginLabel: string;
  curatorMarkup: string;
  servicesText?: string;
  luggagePetsText?: string;
  versions: Array<{
    verNum: string;
    summary: string;
    price: string;
  }>;
  bookingRef?: Booking;
}

// Baseline mock data removed per request - dynamic quotes only

export default function QuotesView() {
  const router = useRouter();
  const { bookings, openDocument, convertQuoteToBooked, refreshBookings, isBookingsLoading } = useAviation();

  useEffect(() => {
    refreshBookings();
  }, []);

  const [activeFilter, setActiveFilter] = useState<QuoteFilter>("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [curatorFilter, setCuratorFilter] = useState("all");
  const [sortOption, setSortOption] = useState<"newest" | "price">("newest");

  // Selected quote for right preview rail
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // Group unbooked quotes by root trip ID and get latest iteration dynamically
  const allQuotes: QuoteItemData[] = useMemo(() => {
    const unbookedTrips = bookings.filter((b) => {
      const isBooked = Boolean(
        b.isBooked ||
        b.isContractSigned ||
        ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(b.status)
      );
      return !isBooked;
    });

    const getQuoteGroupRoot = (b: Booking): string => {
      const feToken = extractFeToken(b.tripId || b.tripNumber || b.quoteReference || b.id);
      if (feToken) return `TRI-${feToken}`;
      if (b.tripNumber && !b.tripNumber.toUpperCase().startsWith("QTE-")) return b.tripNumber;
      if (b.tripId) return b.tripId;
      return b.id;
    };

    const rootMap = new Map<string, Booking[]>();
    unbookedTrips.forEach((b) => {
      const root = getQuoteGroupRoot(b);
      const list = rootMap.get(root) || [];
      list.push(b);
      rootMap.set(root, list);
    });

    const list: QuoteItemData[] = [];
    rootMap.forEach((versions, rootId) => {
      const sorted = [...versions].sort((a, b) => (a.quoteVersion || 1) - (b.quoteVersion || 1));
      const latest = sorted[sorted.length - 1];
      const leg = latest.legs[0];
      const feToken = extractFeToken(latest.tripId || latest.tripNumber || latest.quoteReference || latest.id) || rootId.replace(/^TRI-/, "");
      const vNum = latest.quoteVersion || versions.length || 1;
      const vNumStr = `-${String(vNum).padStart(3, "0")}`;
      const quoteCode = latest.quoteId || `QUO - ${feToken} ${vNumStr}`;

      const clientPriceNum = latest.pricing?.totalFlightPrice || 0;
      const clientPrice = clientPriceNum > 0 ? formatCurrency(clientPriceNum, latest.pricing?.currency || "EUR") : "—";

      const operatorCostNum = latest.pricing?.operatorCost || clientPriceNum * 0.84;
      const companyMarginNum = latest.pricing?.companyMargin || clientPriceNum * 0.10;
      const curatorMarkupNum = latest.pricing?.agentCommission || clientPriceNum * 0.08;

      const versionsList = sorted.slice().reverse().map((v) => {
        const verStr = `-${String(v.quoteVersion || 1).padStart(3, "0")}`;
        const pNum = v.pricing?.totalFlightPrice || 0;
        return {
          verNum: verStr,
          summary: (v.quoteVersion || 1) > 1 ? `Revision ${verStr}` : "Created from request",
          price: pNum > 0 ? formatCurrency(pNum, v.pricing?.currency || "EUR") : "—"
        };
      });

      const tripTypeLabel = latest.tripType === "round_trip"
        ? `Round trip · ${latest.legs.length} legs`
        : latest.tripType === "multi_leg"
        ? `Multi-leg · ${latest.legs.length} legs`
        : "One-way";

      list.push({
        id: latest.id,
        rootId,
        quoteCode,
        versionsCount: versions.length,
        flightDate: leg?.flightDate || "—",
        flightTimeStr: leg?.departureTimeLocal ? `${leg.departureTimeLocal} LT` : "—",
        originIcao: leg?.origin?.icao || "—",
        destIcao: leg?.destination?.icao || "—",
        routeTitle: `${leg?.origin?.city || leg?.origin?.icao || "Origin"} → ${leg?.destination?.city || leg?.destination?.icao || "Destination"}`,
        tripTypeLabel,
        account: latest.client?.companyName || latest.client?.fullName || "—",
        authorisedPerson: latest.client?.fullName ? `${latest.client.fullName} (authorised)` : "—",
        curator: latest.agentName || "M. Vance",
        curatorMarginPct: 8,
        aircraftCategory: latest.aircraft?.categoryLabel || latest.aircraft?.category || "Light",
        aircraftModel: latest.aircraft?.name || (latest.aircraft as any)?.model || "—",
        aircraftYear: "2021",
        aircraftFeatures: `${latest.aircraft?.categoryLabel || "Light"} · lav enclosed`,
        pax: leg?.paxCount || leg?.passengers?.length || 1,
        clientPrice,
        clientPriceNum,
        expiresIn: latest.quoteExpirationDate || "3 h",
        status: (latest.quoteStatus as any) || (latest.status === "draft" ? "draft" : "open"),
        operatorCost: clientPriceNum > 0 ? formatCurrency(operatorCostNum, latest.pricing?.currency || "EUR") : "Awaiting sourcing",
        companyMargin: clientPriceNum > 0 ? formatCurrency(companyMarginNum, latest.pricing?.currency || "EUR") : "—",
        companyMarginLabel: "Company margin 10 % · tier € 10k–35k",
        curatorMarkup: clientPriceNum > 0 ? formatCurrency(curatorMarkupNum, latest.pricing?.currency || "EUR") : "—",
        servicesText: (latest as any).cateringNotes || (latest as any).groundTransportNotes || latest.specialRequests || "None requested",
        luggagePetsText: (latest as any).luggageNotes ? `${(latest as any).luggageNotes} · ${(latest as any).petNotes || "none"}` : "Standard luggage · none",
        versions: versionsList,
        bookingRef: latest
      });
    });

    list.sort((a, b) => {
      const dateA = a.bookingRef?.createdAt ? new Date(a.bookingRef.createdAt).getTime() : 0;
      const dateB = b.bookingRef?.createdAt ? new Date(b.bookingRef.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return list;
  }, [bookings]);

  // Counts for pills
  const counts = useMemo(() => {
    return {
      open: allQuotes.filter((q) => q.status === "open").length,
      expiring_today: allQuotes.filter((q) => q.status === "expiring_today" || (q.expiresIn && (q.expiresIn.toLowerCase().includes("today") || q.expiresIn.toLowerCase().includes("h")))).length,
      curator_confirmed: allQuotes.filter((q) => q.status === "curator_confirmed" || q.bookingRef?.agentConfirmedPendingSuperAdmin).length,
      draft: allQuotes.filter((q) => q.status === "draft").length,
      expired: allQuotes.filter((q) => q.status === "expired").length,
      declined: allQuotes.filter((q) => q.status === "declined").length
    };
  }, [allQuotes]);

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    const res = allQuotes.filter((q) => {
      if (activeFilter === "expiring_today" && q.status !== "expiring_today") {
        return false;
      } else if (activeFilter === "curator_confirmed" && q.status !== "curator_confirmed") {
        return false;
      } else if (activeFilter === "draft" && q.status !== "draft") {
        return false;
      } else if (activeFilter === "expired" && q.status !== "expired") {
        return false;
      } else if (activeFilter === "declined" && q.status !== "declined") {
        return false;
      }

      if (curatorFilter !== "all") {
        if (!q.curator.toLowerCase().includes(curatorFilter.toLowerCase())) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const match =
          q.quoteCode.toLowerCase().includes(query) ||
          q.account.toLowerCase().includes(query) ||
          q.curator.toLowerCase().includes(query) ||
          q.originIcao.toLowerCase().includes(query) ||
          q.destIcao.toLowerCase().includes(query) ||
          q.aircraftModel.toLowerCase().includes(query);
        if (!match) return false;
      }

      return true;
    });

    if (sortOption === "price") {
      res.sort((a, b) => b.clientPriceNum - a.clientPriceNum);
    }

    return res;
  }, [allQuotes, activeFilter, curatorFilter, searchQuery, sortOption]);

  // Currently selected quote object
  const selectedQuote = useMemo(() => {
    if (filteredQuotes.length === 0) return null;
    if (selectedQuoteId) {
      const found = filteredQuotes.find((q) => q.id === selectedQuoteId);
      if (found) return found;
    }
    return filteredQuotes[0];
  }, [filteredQuotes, selectedQuoteId]);

  return (
    <div className="w-full space-y-5 pb-12">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 m-0">
          Quotes
        </h1>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => refreshBookings()}
            disabled={isBookingsLoading}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-2xs transition-colors flex items-center gap-1.5"
            title="Refresh quotes from server"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isBookingsLoading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-2xs transition-colors"
          >
            Export
          </button>
          <Link
            href="/quotes/new"
            className="bg-[#0f172a] hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1.5"
          >
            <span>New quote</span>
          </Link>
        </div>
      </div>

      {/* ─── Filter Bar & Search ───────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[260px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, client, Curator, ICAO..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 font-sans shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={() => setActiveFilter("open")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === "open"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Open {counts.open}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("expiring_today")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === "expiring_today"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Expiring today {counts.expiring_today}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("curator_confirmed")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === "curator_confirmed"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Curator confirmed {counts.curator_confirmed}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("draft")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === "draft"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Draft {counts.draft}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("expired")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === "expired"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Expired
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("declined")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === "declined"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Declined
          </button>

          {/* Curator Dropdown Pill */}
          <div className="relative">
            <select
              value={curatorFilter}
              onChange={(e) => setCuratorFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-400 cursor-pointer shadow-2xs"
            >
              <option value="all">Curator: all ▾</option>
              <option value="Vance">Curator: M. Vance</option>
              <option value="Laurent">Curator: C. Laurent</option>
              <option value="Bello">Curator: T. Bello</option>
              <option value="Okafor">Curator: A. Okafor</option>
            </select>
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 self-end xl:self-auto shrink-0">
          <span>Sort</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-400 cursor-pointer shadow-2xs"
          >
            <option value="newest">Newest first</option>
            <option value="price">Price highest</option>
          </select>
        </div>
      </div>

      {/* ─── Main Two-Column View: Table (Left) + Preview Rail (Right) ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Quotes Table (approx 7.5/12 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-white">
                  <th className="py-3 px-3.5">QUOTE</th>
                  <th className="py-3 px-3.5">FLIGHT</th>
                  <th className="py-3 px-3.5">ROUTE</th>
                  <th className="py-3 px-3.5">ACCOUNT · CURATOR</th>
                  <th className="py-3 px-3.5">AIRCRAFT</th>
                  <th className="py-3 px-3.5">PAX</th>
                  <th className="py-3 px-3.5">CLIENT PRICE</th>
                  <th className="py-3 px-3.5">EXP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((quote) => {
                  const isSelected = selectedQuote?.id === quote.id;
                  return (
                    <tr
                      key={quote.id}
                      onClick={() => setSelectedQuoteId(quote.id)}
                      onDoubleClick={() => router.push(`/quotes/${encodeURIComponent(quote.id)}`)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-sky-50/70 border-l-2 border-l-blue-600"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Quote Code */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <Link href={`/quotes/${encodeURIComponent(quote.id)}`} className="font-mono font-bold text-slate-900 block hover:text-blue-600 hover:underline">
                          {quote.quoteCode}
                        </Link>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {quote.versionsCount} {quote.versionsCount === 1 ? "version" : "versions"}
                        </span>
                      </td>

                      {/* Flight Date & Time */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-medium text-slate-900 block">
                          {quote.flightDate}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {quote.flightTimeStr}
                        </span>
                      </td>

                      {/* Route */}
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-slate-900 block whitespace-nowrap">
                          {quote.originIcao} → {quote.destIcao}
                        </span>
                        <span className="text-[11px] text-slate-500 whitespace-nowrap">
                          {quote.tripTypeLabel}
                        </span>
                      </td>

                      {/* Account · Curator */}
                      <td className="py-3 px-3.5">
                        <span className="font-medium text-slate-900 block">
                          {quote.account}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {quote.curator}
                        </span>
                      </td>

                      {/* Aircraft */}
                      <td className="py-3 px-3.5">
                        <span className="text-slate-900 block">
                          {quote.aircraftCategory}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {quote.aircraftModel}
                        </span>
                      </td>

                      {/* Pax */}
                      <td className="py-3 px-3.5 font-mono font-medium text-slate-900">
                        {quote.pax}
                      </td>

                      {/* Client Price */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {quote.clientPrice}
                      </td>

                      {/* Expiration */}
                      <td className="py-3 px-3.5 font-mono font-medium text-amber-700 whitespace-nowrap">
                        {quote.expiresIn}
                      </td>
                    </tr>
                  );
                })}

                {filteredQuotes.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      No quotes found matching this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 text-xs text-slate-400 bg-slate-50/40">
            One row per quote, always its latest version. Click a row to preview it on the right. Double-click or &ldquo;Open&rdquo; goes to its full page.
          </div>
        </div>

        {/* Right Column: Preview Rail (approx 4.5/12 cols) */}
        {selectedQuote && (
          <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4 sticky top-6">
            {/* Top row with Code and Open quote link */}
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400 font-medium">
                  {selectedQuote.quoteCode}
                </span>
                <Link
                  href={`/quotes/${encodeURIComponent(selectedQuote.id)}`}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-0.5 transition-colors"
                >
                  <span>Open quote</span>
                  <span>→</span>
                </Link>
              </div>

              <h2 className="text-base font-bold text-slate-900 tracking-tight mt-1 mb-0">
                {selectedQuote.routeTitle}
              </h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                {selectedQuote.account} · {selectedQuote.authorisedPerson} · Curator {selectedQuote.curator}
              </p>
            </div>

            {/* 4-Grid Specs */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  LEG 1
                </div>
                <div className="font-medium text-slate-900 mt-0.5">
                  {selectedQuote.flightDate} {selectedQuote.flightTimeStr}
                </div>
                <div className="text-[11px] text-slate-500">
                  {selectedQuote.originIcao} → {selectedQuote.destIcao} · {selectedQuote.pax} pax
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  AIRCRAFT
                </div>
                <div className="font-medium text-slate-900 mt-0.5">
                  {selectedQuote.aircraftModel} · {selectedQuote.aircraftYear || "2020"}
                </div>
                <div className="text-[11px] text-slate-500">
                  {selectedQuote.aircraftFeatures || "Light · lav enclosed"}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  LUGGAGE / PETS
                </div>
                <div className="text-slate-700 mt-0.5">
                  {selectedQuote.luggagePetsText || "3 suitcases · none"}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  SERVICES
                </div>
                <div className="text-slate-700 mt-0.5">
                  {selectedQuote.servicesText || "None requested"}
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Operator cost (admin only)</span>
                <span className="font-mono text-slate-900">{selectedQuote.operatorCost}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>{selectedQuote.companyMarginLabel}</span>
                <span className="font-mono text-slate-900">{selectedQuote.companyMargin}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Curator mark-up {selectedQuote.curatorMarginPct} %</span>
                <span className="font-mono text-slate-900">{selectedQuote.curatorMarkup}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-slate-900 pt-1.5 border-t border-slate-100 text-sm">
                <span>Client price</span>
                <span className="font-mono text-base">{selectedQuote.clientPrice}</span>
              </div>
            </div>

            {/* Versions List */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                VERSIONS · LATEST FIRST
              </div>
              <div className="space-y-1.5">
                {selectedQuote.versions.map((v, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-slate-900 mr-2">{v.verNum}</span>
                      <span className="text-slate-500 text-[11px]">{v.summary}</span>
                    </div>
                    <span className="font-mono font-medium text-slate-900">{v.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const bookingObj = selectedQuote.bookingRef || bookings.find((b) => b.id === selectedQuote.id) || {
                    id: selectedQuote.id,
                    tripNumber: selectedQuote.rootId,
                    quoteId: selectedQuote.quoteCode,
                    quoteVersion: selectedQuote.versionsCount,
                    pricing: {
                      totalFlightPrice: selectedQuote.clientPriceNum,
                      currency: "EUR"
                    },
                    legs: [{
                      flightDate: selectedQuote.flightDate,
                      departureTimeLocal: selectedQuote.flightTimeStr,
                      origin: { icao: selectedQuote.originIcao, city: "Origin" },
                      destination: { icao: selectedQuote.destIcao, city: "Destination" }
                    }]
                  };
                  openDocument(bookingObj as any, "quotation");
                }}
                className="flex-1 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 py-1.5 px-3 rounded-lg text-xs font-medium shadow-2xs transition-colors text-center"
              >
                Quote PDF
              </button>

              <button
                type="button"
                onClick={() => router.push(`/quotes/new?reviseQuote=${encodeURIComponent(selectedQuote.id)}`)}
                className="flex-1 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 py-1.5 px-3 rounded-lg text-xs font-medium shadow-2xs transition-colors text-center"
              >
                Revise
              </button>

              <button
                type="button"
                onClick={async () => {
                  const bookingObj = selectedQuote.bookingRef || bookings.find((b) => b.id === selectedQuote.id);
                  if (bookingObj) {
                    await convertQuoteToBooked(bookingObj.id, bookingObj);
                  }
                  router.push(`/trips/${selectedQuote.rootId}/itinerary`);
                }}
                className="flex-1 bg-[#0f172a] hover:bg-slate-800 text-white py-1.5 px-3 rounded-lg text-xs font-semibold shadow-2xs transition-colors text-center"
              >
                Book
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
