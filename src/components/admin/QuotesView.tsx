"use client";

import React, { useState, useMemo } from "react";
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
  FileText
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
}

const INITIAL_QUOTES: QuoteItemData[] = [
  {
    id: "QUO-RB3310",
    rootId: "TRI-RB3310",
    quoteCode: "QUO - RB3310 -002",
    versionsCount: 2,
    flightDate: "19 Nov",
    flightTimeStr: "14:15 LT",
    originIcao: "LFPB",
    destIcao: "LIML",
    routeTitle: "Paris Le Bourget → Milan Linate",
    tripTypeLabel: "One-way",
    account: "Okafor Capital",
    authorisedPerson: "N. Okafor (authorised)",
    curator: "M. Vance",
    curatorMarginPct: 8,
    aircraftCategory: "Light",
    aircraftModel: "Phenom 300",
    aircraftYear: "2019",
    aircraftFeatures: "Light · lav enclosed",
    pax: 3,
    clientPrice: "€ 14,900.00",
    clientPriceNum: 14900,
    expiresIn: "3 h",
    status: "open",
    operatorCost: "€ 12,542.00",
    companyMargin: "€ 1,254.00",
    companyMarginLabel: "Company margin 10 % · tier € 10k–35k",
    curatorMarkup: "€ 1,104.00",
    servicesText: "Limousine at LIML",
    luggagePetsText: "3 suitcases · none",
    versions: [
      { verNum: "-002", summary: "Time 12:00 → 14:15", price: "€ 14,900" },
      { verNum: "-001", summary: "Created from request", price: "€ 14,900" }
    ]
  },
  {
    id: "QUO-KD2201",
    rootId: "TRI-KD2201",
    quoteCode: "QUO - KD2201 -003",
    versionsCount: 3,
    flightDate: "21 Nov",
    flightTimeStr: "10:00 LT",
    originIcao: "EGGW",
    destIcao: "LFMN",
    routeTitle: "London Luton → Nice Côte d'Azur",
    tripTypeLabel: "One-way",
    account: "Sterling Equities",
    authorisedPerson: "A. Sterling",
    curator: "C. Laurent",
    curatorMarginPct: 8,
    aircraftCategory: "Light",
    aircraftModel: "CJ3+",
    aircraftYear: "2021",
    aircraftFeatures: "Light · 7 seats",
    pax: 3,
    clientPrice: "€ 6,930.00",
    clientPriceNum: 6930,
    expiresIn: "6 h",
    status: "curator_confirmed",
    operatorCost: "€ 5,800.00",
    companyMargin: "€ 620.00",
    companyMarginLabel: "Company margin 10 % · tier < € 10k",
    curatorMarkup: "€ 510.00",
    servicesText: "None requested",
    luggagePetsText: "3 bags · none",
    versions: [
      { verNum: "-003", summary: "Curator confirmed aircraft", price: "€ 6,930" },
      { verNum: "-002", summary: "Alternative tail proposed", price: "€ 7,200" },
      { verNum: "-001", summary: "Initial dispatch", price: "€ 7,500" }
    ]
  },
  {
    id: "QUO-MX5521",
    rootId: "TRI-MX5521",
    quoteCode: "QUO - MX5521 -001",
    versionsCount: 1,
    flightDate: "24 Nov",
    flightTimeStr: "08:30 LT",
    originIcao: "LFPB",
    destIcao: "DNAA",
    routeTitle: "Paris Le Bourget ⇄ Abuja",
    tripTypeLabel: "Round trip · 2 legs",
    account: "Bello Group",
    authorisedPerson: "I. Bello",
    curator: "C. Laurent",
    curatorMarginPct: 10,
    aircraftCategory: "Super mid",
    aircraftModel: "Challenger 350",
    aircraftYear: "2020",
    aircraftFeatures: "Super mid · stand-up cabin",
    pax: 5,
    clientPrice: "€ 59,111.94",
    clientPriceNum: 59111.94,
    expiresIn: "2 d",
    status: "open",
    operatorCost: "€ 50,200.00",
    companyMargin: "€ 4,728.95",
    companyMarginLabel: "Company margin 8 % · tier > € 35k",
    curatorMarkup: "€ 4,182.99",
    servicesText: "Limousine on arrival DNAA",
    luggagePetsText: "6 suitcases · none",
    versions: [
      { verNum: "-001", summary: "Sourcing completed · 4 offers", price: "€ 59,111.94" }
    ]
  },
  {
    id: "QUO-GH2290",
    rootId: "TRI-GH2290",
    quoteCode: "QUO - GH2290 -001",
    versionsCount: 1,
    flightDate: "28 Nov",
    flightTimeStr: "11:00 LT",
    originIcao: "DGAA",
    destIcao: "OMDB",
    routeTitle: "Accra Kotoka → Dubai Al Maktoum",
    tripTypeLabel: "One-way",
    account: "Mensah Ltd",
    authorisedPerson: "K. Mensah",
    curator: "A. Okafor",
    curatorMarginPct: 8,
    aircraftCategory: "Midsize",
    aircraftModel: "any",
    pax: 4,
    clientPrice: "—",
    clientPriceNum: 0,
    expiresIn: "—",
    status: "draft",
    operatorCost: "Awaiting offers",
    companyMargin: "—",
    companyMarginLabel: "Company margin 10 %",
    curatorMarkup: "—",
    servicesText: "Dubai VIP Lounge",
    luggagePetsText: "4 suitcases",
    versions: [
      { verNum: "-001", summary: "Request received", price: "—" }
    ]
  },
  {
    id: "QUO-LA0917",
    rootId: "TRI-LA0917",
    quoteCode: "QUO - LA0917 -001",
    versionsCount: 1,
    flightDate: "02 Dec",
    flightTimeStr: "09:00 LT",
    originIcao: "DNMM",
    destIcao: "KTEB",
    routeTitle: "Lagos → Teterboro → Lagos",
    tripTypeLabel: "Multi-leg · 3 legs",
    account: "Adeyemi Holdings",
    authorisedPerson: "T. Adeyemi",
    curator: "T. Bello",
    curatorMarginPct: 10,
    aircraftCategory: "Heavy",
    aircraftModel: "G550",
    aircraftYear: "2018",
    aircraftFeatures: "Ultra long range · 14 seats",
    pax: 6,
    clientPrice: "€ 182,400.00",
    clientPriceNum: 182400,
    expiresIn: "4 d",
    status: "open",
    operatorCost: "€ 156,000.00",
    companyMargin: "€ 14,592.00",
    companyMarginLabel: "Company margin 8 % · tier > € 35k",
    curatorMarkup: "€ 11,808.00",
    servicesText: "Transatlantic Oceanic Clearance",
    luggagePetsText: "8 suitcases · 200 kg",
    versions: [
      { verNum: "-001", summary: "Initial transatlantic quote", price: "€ 182,400.00" }
    ]
  }
];

export default function QuotesView() {
  const router = useRouter();
  const { bookings, openDocument, convertQuoteToBooked } = useAviation();

  const [activeFilter, setActiveFilter] = useState<QuoteFilter>("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [curatorFilter, setCuratorFilter] = useState("all");
  const [sortOption, setSortOption] = useState<"newest" | "price">("newest");

  // Selected quote for right preview rail
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("QUO-RB3310");

  // Combine baseline quotes with any unbooked dynamic bookings from context
  const allQuotes = useMemo(() => {
    const list = [...INITIAL_QUOTES];
    const existingIds = new Set(list.map((q) => q.id.toLowerCase()));

    bookings.forEach((b) => {
      if (b.isBooked || b.isContractSigned) return;
      const feToken = extractFeToken(b.tripId || b.tripNumber || b.quoteReference || b.id);
      const rootId = feToken ? `TRI-${feToken}` : (b.tripId || b.tripNumber || b.id);
      const quoteCode = `QUO - ${feToken || "QTE"} -00${b.quoteVersion || 1}`;
      if (existingIds.has(quoteCode.toLowerCase())) return;

      const leg = b.legs[0];
      const price = b.pricing?.totalFlightPrice || 14000;

      list.push({
        id: b.id,
        rootId,
        quoteCode,
        versionsCount: b.quoteVersion || 1,
        flightDate: leg?.flightDate || "Upcoming",
        flightTimeStr: `${leg?.departureTimeLocal || "10:00"} LT`,
        originIcao: leg?.origin?.icao || "LFPB",
        destIcao: leg?.destination?.icao || "LIML",
        routeTitle: `${leg?.origin?.city || leg?.origin?.icao || "Paris"} → ${leg?.destination?.city || leg?.destination?.icao || "Geneva"}`,
        tripTypeLabel: b.tripType === "round_trip" ? "Round trip" : "One-way",
        account: b.client?.companyName || b.client?.fullName || "Private Client",
        authorisedPerson: b.client?.fullName || "Authorised Client",
        curator: b.agentName ? b.agentName.split(" ")[0] : "Desk",
        curatorMarginPct: 8,
        aircraftCategory: b.aircraft?.categoryLabel || "Light",
        aircraftModel: b.aircraft?.name || "Jet",
        aircraftYear: "2020",
        aircraftFeatures: "Executive configuration",
        pax: leg?.paxCount || 4,
        clientPrice: formatCurrency(price, b.pricing?.currency || "EUR"),
        clientPriceNum: price,
        expiresIn: "2 d",
        status: "open",
        operatorCost: formatCurrency(price * 0.85, "EUR"),
        companyMargin: formatCurrency(price * 0.08, "EUR"),
        companyMarginLabel: "Company margin 8 %",
        curatorMarkup: formatCurrency(price * 0.07, "EUR"),
        servicesText: "Standard handling",
        luggagePetsText: "Standard luggage",
        versions: [
          { verNum: `-00${b.quoteVersion || 1}`, summary: "Latest quote iteration", price: formatCurrency(price, "EUR") }
        ]
      });
      existingIds.add(quoteCode.toLowerCase());
    });

    return list;
  }, [bookings]);

  // Counts for pills
  const counts = useMemo(() => {
    return {
      open: 9,
      expiring_today: 2,
      curator_confirmed: 1,
      draft: 1,
      expired: 0,
      declined: 0
    };
  }, []);

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    return allQuotes.filter((q) => {
      if (activeFilter === "expiring_today" && q.status !== "expiring_today") {
        // Allow demo view
      } else if (activeFilter === "curator_confirmed" && q.status !== "curator_confirmed") {
        return false;
      } else if (activeFilter === "draft" && q.status !== "draft") {
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
  }, [allQuotes, activeFilter, curatorFilter, searchQuery]);

  // Currently selected quote object
  const selectedQuote = useMemo(() => {
    return allQuotes.find((q) => q.id === selectedQuoteId) || allQuotes[0];
  }, [allQuotes, selectedQuoteId]);

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
                      onDoubleClick={() => router.push(`/trips/${quote.rootId}/pricing`)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-sky-50/70 border-l-2 border-l-blue-600"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Quote Code */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 block">
                          {quote.quoteCode}
                        </span>
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
                  href={`/trips/${selectedQuote.rootId}/pricing`}
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
                  const bookingObj = bookings.find((b) => b.id === selectedQuote.id) || {
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
                onClick={() => router.push(`/trips/${selectedQuote.rootId}/pricing`)}
                className="flex-1 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 py-1.5 px-3 rounded-lg text-xs font-medium shadow-2xs transition-colors text-center"
              >
                Revise
              </button>

              <button
                type="button"
                onClick={async () => {
                  const bookingObj = bookings.find((b) => b.id === selectedQuote.id);
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
