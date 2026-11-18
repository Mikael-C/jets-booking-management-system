"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";

interface AgentItem {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  agencyName: string;
  email: string;
  phone: string;
  country: string;
  commissionPct: number;
  tokensLeft: number;
  tokensBought: number;
  tokensFree: number;
  requests30d: number;
  bookedCount: number;
  conversionRate: number;
  commissionOpen: string;
  nextPayout: string;
  status: "active" | "inactive" | "pending";
  referenceId: string;
  tokenTransactions: Array<{
    date: string;
    entry: string;
    tokens: string;
    balance: number;
    by: "Agent" | "Rule" | "Admin";
  }>;
}

interface AgentsViewProps {
  selectedAgentId?: string;
}

export default function AgentsView({ selectedAgentId }: AgentsViewProps = {}) {
  const router = useRouter();
  const { accounts, contacts, bookings, agentRequests, setActiveNav, addAuditEntry, currentUser } = useAviation();

  const [activeAgId, setActiveAgId] = useState<string | null>(selectedAgentId || null);
  const [activeTab, setActiveTab] = useState<"profile" | "requests" | "trips" | "tokens_ledger" | "payouts" | "clients">("tokens_ledger");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPill, setFilterPill] = useState<"all" | "active" | "brokers" | "concierge">("all");

  // Sync prop
  useEffect(() => {
    if (selectedAgentId) {
      setActiveAgId(selectedAgentId);
    }
  }, [selectedAgentId]);

  // Unified list of agents with rich details
  const agentsList: AgentItem[] = useMemo(() => {
    return [
      {
        id: "vance-marcus",
        name: "Marcus Vance",
        firstName: "Marcus",
        lastName: "Vance",
        agencyName: "Vance Luxury Aviation & Brokerage Ltd",
        email: "m.vance@vanceaviation.co.uk",
        phone: "+44 20 7946 0912",
        country: "United Kingdom",
        commissionPct: 8,
        tokensLeft: 11,
        tokensBought: 10,
        tokensFree: 5,
        requests30d: 14,
        bookedCount: 4,
        conversionRate: 29,
        commissionOpen: "1,697",
        nextPayout: "27 Nov",
        status: "active",
        referenceId: "AGT-0412",
        tokenTransactions: [
          { date: "14 Nov", entry: "Request RQ-0430", tokens: "– 1", balance: 11, by: "Agent" },
          { date: "10 Nov", entry: "Free tokens · conversion above 25 %", tokens: "+ 5", balance: 12, by: "Rule" },
          { date: "03–06 Nov", entry: "3 requests", tokens: "– 3", balance: 7, by: "Agent" },
          { date: "02 Nov", entry: "Bundle of 10 bought · [price per Q-03]", tokens: "+ 10", balance: 10, by: "Agent" }
        ]
      },
      {
        id: "laurent-camille",
        name: "Camille Laurent",
        firstName: "Camille",
        lastName: "Laurent",
        agencyName: "Monaco Luxury Jet Brokers SARL",
        email: "c.laurent@monacojets.mc",
        phone: "+377 98 06 20 00",
        country: "Monaco",
        commissionPct: 10,
        tokensLeft: 8,
        tokensBought: 20,
        tokensFree: 4,
        requests30d: 19,
        bookedCount: 6,
        conversionRate: 31,
        commissionOpen: "3,450",
        nextPayout: "27 Nov",
        status: "active",
        referenceId: "AGT-0391",
        tokenTransactions: [
          { date: "14 Nov", entry: "Request RQ-0431", tokens: "– 1", balance: 8, by: "Agent" },
          { date: "12 Nov", entry: "Request RQ-0428", tokens: "– 1", balance: 9, by: "Agent" },
          { date: "08 Nov", entry: "Free tokens · conversion above 30 %", tokens: "+ 4", balance: 10, by: "Rule" },
          { date: "01 Nov", entry: "Bundle of 20 bought", tokens: "+ 20", balance: 6, by: "Agent" }
        ]
      },
      {
        id: "bello-taofeek",
        name: "Taofeek Bello",
        firstName: "Taofeek",
        lastName: "Bello",
        agencyName: "AfriJets Executive Concierge Ltd",
        email: "t.bello@afrijets.com",
        phone: "+234 803 555 1212",
        country: "Nigeria",
        commissionPct: 8,
        tokensLeft: 14,
        tokensBought: 15,
        tokensFree: 3,
        requests30d: 8,
        bookedCount: 3,
        conversionRate: 38,
        commissionOpen: "2,150",
        nextPayout: "27 Nov",
        status: "active",
        referenceId: "AGT-0520",
        tokenTransactions: [
          { date: "14 Nov", entry: "Request RQ-0434", tokens: "– 1", balance: 14, by: "Agent" },
          { date: "05 Nov", entry: "Bundle of 15 bought", tokens: "+ 15", balance: 15, by: "Agent" }
        ]
      },
      {
        id: "okafor-amara",
        name: "Amara Okafor",
        firstName: "Amara",
        lastName: "Okafor",
        agencyName: "Lagos Executive Wings Ltd",
        email: "a.okafor@lagoswings.aero",
        phone: "+234 802 999 8888",
        country: "Nigeria",
        commissionPct: 8,
        tokensLeft: 6,
        tokensBought: 10,
        tokensFree: 2,
        requests30d: 11,
        bookedCount: 2,
        conversionRate: 22,
        commissionOpen: "1,100",
        nextPayout: "27 Nov",
        status: "active",
        referenceId: "AGT-0488",
        tokenTransactions: [
          { date: "14 Nov", entry: "Request RQ-0433", tokens: "– 1", balance: 6, by: "Agent" },
          { date: "03 Nov", entry: "Bundle of 10 bought", tokens: "+ 10", balance: 7, by: "Agent" }
        ]
      }
    ];
  }, []);

  const activeAgent = useMemo(() => {
    if (!activeAgId) return null;
    return agentsList.find((a) => a.id === activeAgId || a.referenceId === activeAgId || a.name.toLowerCase().includes(activeAgId.toLowerCase())) || null;
  }, [activeAgId, agentsList]);

  // Filtered agents
  const filteredAgents = useMemo(() => {
    return agentsList.filter((ag) => {
      if (filterPill === "active" && ag.status !== "active") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = ag.name.toLowerCase().includes(q);
        const matchAgency = ag.agencyName.toLowerCase().includes(q);
        const matchEmail = ag.email.toLowerCase().includes(q);
        const matchCountry = ag.country.toLowerCase().includes(q);
        const matchRef = ag.referenceId.toLowerCase().includes(q);
        if (!matchName && !matchAgency && !matchEmail && !matchCountry && !matchRef) return false;
      }
      return true;
    });
  }, [agentsList, filterPill, searchQuery]);

  const handleOpenAgent = (agent: AgentItem) => {
    setActiveAgId(agent.id);
    setActiveTab("tokens_ledger");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/agents/${agent.id}`);
    }
  };

  const handleBackToList = () => {
    setActiveAgId(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/agents`);
    }
  };

  // ==========================================
  // VIEW: DETAILS SCREEN (SCREEN 1)
  // ==========================================
  if (activeAgent) {
    const breadcrumbName = `${activeAgent.lastName}, ${activeAgent.firstName}`;

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <button
            onClick={handleBackToList}
            className="hover:text-gray-900 transition-colors"
          >
            Agents
          </button>
          <span>/</span>
          <span className="text-gray-800">{breadcrumbName}</span>
        </div>

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeAgent.name}{" "}
              <span className="text-gray-500 font-normal">· {activeAgent.agencyName}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                Active
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
                Login: agent portal
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
                Default margin {activeAgent.commissionPct} %
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => alert(`Login reset link dispatched to ${activeAgent.email}`)}
              className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Reset login
            </button>
            <button
              onClick={() => alert(`Deactivated status for ${activeAgent.name}`)}
              className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Deactivate
            </button>
            <button
              onClick={() => {
                const count = prompt("Number of bonus tokens to grant:", "5");
                if (count) alert(`Granted ${count} tokens to ${activeAgent.name}`);
              }}
              className="bg-[#111827] text-white hover:bg-gray-800 text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Grant tokens
            </button>
          </div>
        </div>

        {/* 4 Stat Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. TOKENS LEFT */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              TOKENS LEFT
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeAgent.tokensLeft}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              bought {activeAgent.tokensBought} · free {activeAgent.tokensFree}
            </div>
          </div>

          {/* 2. REQUESTS · 30 D */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              REQUESTS · 30 D
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeAgent.requests30d}
            </div>
          </div>

          {/* 3. BOOKED */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              BOOKED
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeAgent.bookedCount}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              conversion {activeAgent.conversionRate} %
            </div>
          </div>

          {/* 4. COMMISSION OPEN */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              COMMISSION OPEN
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              € {activeAgent.commissionOpen}
            </div>
            <div className="text-xs text-[#D97706] font-medium mt-1">
              payout {activeAgent.nextPayout}
            </div>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="flex items-center gap-6 border-b border-gray-200 text-xs">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "requests"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => setActiveTab("trips")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "trips"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Trips
          </button>
          <button
            onClick={() => setActiveTab("tokens_ledger")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "tokens_ledger"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Tokens ledger
          </button>
          <button
            onClick={() => setActiveTab("payouts")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "payouts"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Payouts
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "clients"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Clients (5)
          </button>
        </div>

        {/* Tab 4: TOKENS LEDGER (Screen 1 Layout) */}
        {activeTab === "tokens_ledger" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Tokens ledger</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 font-semibold">DATE</th>
                    <th className="py-2.5 font-semibold">ENTRY</th>
                    <th className="py-2.5 text-right font-semibold">TOKENS</th>
                    <th className="py-2.5 text-right font-semibold">BALANCE</th>
                    <th className="py-2.5 text-right font-semibold">BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeAgent.tokenTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 text-gray-700 whitespace-nowrap">{tx.date}</td>
                      <td className="py-3 font-medium text-gray-900">{tx.entry}</td>
                      <td className={`py-3 text-right font-mono font-medium ${tx.tokens.startsWith("+") ? "text-emerald-600" : "text-gray-700"}`}>
                        {tx.tokens}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-gray-900">{tx.balance}</td>
                      <td className="py-3 text-right text-gray-600">{tx.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 leading-relaxed">
              A declined request (no aircraft found) can be refunded with one click. Free-token rules are set in Settings.
            </div>
          </div>
        )}

        {/* Tab 1: PROFILE */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Broker Profile & Accreditation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Representative Name</span>
                <span className="font-medium text-gray-900">{activeAgent.name}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Agency Legal Name</span>
                <span className="font-medium text-gray-900">{activeAgent.agencyName}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Email Address</span>
                <span className="font-medium text-gray-900">{activeAgent.email}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Direct Phone</span>
                <span className="font-medium text-gray-900">{activeAgent.phone}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Country</span>
                <span className="font-medium text-gray-900">{activeAgent.country}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Contract Commission</span>
                <span className="font-medium text-gray-900">{activeAgent.commissionPct} % applied on quotes</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: REQUESTS */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Requests Logged by {activeAgent.name}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 font-semibold">REQUEST</th>
                    <th className="py-2.5 font-semibold">ROUTE</th>
                    <th className="py-2.5 font-semibold">FLIGHT</th>
                    <th className="py-2.5 font-semibold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agentRequests
                    .filter((r) => r.agentName.toLowerCase().includes(activeAgent.lastName.toLowerCase()))
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/50">
                        <td className="py-3 font-mono font-medium text-gray-900">{r.id}</td>
                        <td className="py-3 font-mono text-gray-900">{r.route}</td>
                        <td className="py-3 text-gray-700">{r.flightDate}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-gray-100 font-medium">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: TRIPS */}
        {activeTab === "trips" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Confirmed Charter Flights</h2>
            <div className="text-xs text-gray-500 py-3">
              {activeAgent.bookedCount} verified charter bookings completed through {activeAgent.agencyName}.
            </div>
          </div>
        )}

        {/* Tab 5: PAYOUTS */}
        {activeTab === "payouts" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Commission Payout Pipeline</h2>
            <div className="text-xs text-gray-700 space-y-2">
              <div>Open Commission: <span className="font-bold text-gray-900">€ {activeAgent.commissionOpen}</span></div>
              <div>Scheduled Payout Date: <span className="font-medium text-gray-900">{activeAgent.nextPayout} 2026</span></div>
              <div className="text-gray-400 text-[11px] pt-2">Payouts are settled directly via SEPA / UK Faster Payments.</div>
            </div>
          </div>
        )}

        {/* Tab 6: CLIENTS */}
        {activeTab === "clients" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Accounts Managed by {activeAgent.name}</h2>
            <div className="divide-y divide-gray-100 text-xs">
              {accounts.slice(0, 3).map((acc) => (
                <div key={acc.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{acc.name}</div>
                    <div className="text-gray-500 font-mono text-[11px]">{acc.accountNumber} · {acc.country}</div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveNav("accounts");
                      router.push(`/accounts/${acc.accountNumber || acc.id}`);
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: LIST SCREEN (SCREEN 2 STYLE)
  // ==========================================
  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Agents</h1>

      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input + Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search agent, agency, country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 w-64 focus:outline-none focus:border-gray-400 shadow-sm transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterPill("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "all"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              All {agentsList.length}
            </button>
            <button
              onClick={() => setFilterPill("active")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "active"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterPill("brokers")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "brokers"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Brokers
            </button>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">AGENT</th>
                <th className="py-3 px-4 font-semibold">AGENCY</th>
                <th className="py-3 px-4 font-semibold">COUNTRY</th>
                <th className="py-3 px-4 text-center font-semibold">TOKENS</th>
                <th className="py-3 px-4 text-center font-semibold">REQUESTS (30D)</th>
                <th className="py-3 px-4 text-center font-semibold">BOOKED</th>
                <th className="py-3 px-4 text-right font-semibold">OPEN COMMISSION</th>
                <th className="py-3 px-4 font-semibold">STATUS</th>
                <th className="py-3 px-4 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAgents.map((ag) => (
                <tr
                  key={ag.id}
                  onClick={() => handleOpenAgent(ag)}
                  className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {ag.name}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">{ag.agencyName}</td>
                  <td className="py-3.5 px-4 text-gray-600">{ag.country}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-900">
                    {ag.tokensLeft}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-gray-700">{ag.requests30d}</td>
                  <td className="py-3.5 px-4 text-center text-gray-700">
                    {ag.bookedCount} <span className="text-gray-400 text-[11px]">({ag.conversionRate}%)</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-gray-900 font-mono">
                    € {ag.commissionOpen}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                      Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAgent(ag);
                      }}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
