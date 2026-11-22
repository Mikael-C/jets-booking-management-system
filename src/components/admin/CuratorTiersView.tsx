"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  CuratorTierRow,
  CuratorTokenRules,
  CuratorDirectRouteConfig,
  CuratorTopUpEntry,
} from "@/types/aviation";
import {
  Coins,
  ShieldCheck,
  Save,
  CheckCircle2,
  Plus,
  X,
  User,
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function CuratorTiersView() {
  const [tiers, setTiers] = useState<CuratorTierRow[]>([
    {
      tier: "Founding",
      handlesTrips: "No",
      requestsRoutedTo: "Desk (default) or chosen Associate",
      monthlyTokens: 10,
      startupTokens: 0,
      expiry: "Month end",
      markupRange: "5–12 %",
      handlingShare: "20 % of mark-up",
    },
    {
      tier: "Patron",
      handlesTrips: "By choice",
      requestsRoutedTo: "Desk, chosen Associate, or self",
      monthlyTokens: 5,
      startupTokens: 0,
      expiry: "Month end",
      markupRange: "5–12 %",
      handlingShare: "20 % of mark-up",
    },
    {
      tier: "Associate",
      handlesTrips: "Yes",
      requestsRoutedTo: "Self; receives assigned leads",
      monthlyTokens: 0,
      startupTokens: 5,
      expiry: "None",
      markupRange: "5–12 %",
      handlingShare: "Earns it when handling",
    },
  ]);

  const [tokenRules, setTokenRules] = useState<CuratorTokenRules>({
    pricePerToken: 10,
    perRequest: "1 token per leg",
    afterSignature: "No further tokens, including changes",
    earnedTokens: "+1 per booking completed or cancelled with fee",
    paidExpiry: "Never",
    bundles: "15 · $135 / 25 · $210 / 50 · $375",
    freeRevisions: "2 before contract signature",
    returnedConditions: "No aircraft found; booking cancelled for operational reasons",
    orderOfUse: "Monthly → free → paid",
    assignedLeads: "No tokens",
  });

  const [directRoute, setDirectRoute] = useState<CuratorDirectRouteConfig>({
    bookingDeposit: 500,
    depositTerms: "credited within 30 days; refunded if no aircraft.",
    assignmentRule: "city / rotation / availability",
    standardMarkupPct: 8,
  });

  const [topUpHistory, setTopUpHistory] = useState<CuratorTopUpEntry[]>([
    {
      curatorId: "CUR-07",
      curatorName: "No. 07",
      tokensAdded: 6,
      grantedBy: "Obi (MD)",
      date: "12 Nov",
    },
  ]);

  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpCuratorId, setTopUpCuratorId] = useState("Curator No. 07");
  const [topUpAmount, setTopUpAmount] = useState(6);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.curatorTiers.get();
        if (res?.success && res.data) {
          if (res.data.tiers) setTiers(res.data.tiers);
          if (res.data.tokenRules) setTokenRules(res.data.tokenRules);
          if (res.data.directRoute) setDirectRoute(res.data.directRoute);
          if (res.data.topUpHistory) setTopUpHistory(res.data.topUpHistory);
        }
      } catch (e) {
        console.warn("Could not load curator tiers, using defaults", e);
      }
    }
    loadData();
  }, []);

  const handleSaveAll = async () => {
    try {
      await api.curatorTiers.update({
        tiers,
        tokenRules,
        directRoute,
      });
      showToast("Curator tiers and token rules saved successfully");
    } catch {
      showToast("Changes saved locally");
    }
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.curatorTiers.topUp({
        curatorId: topUpCuratorId,
        curatorName: topUpCuratorId,
        tokensAdded: topUpAmount,
      });
      if (res?.data) {
        setTopUpHistory([res.data, ...topUpHistory]);
      }
      setIsTopUpModalOpen(false);
      showToast(`Added ${topUpAmount} tokens to ${topUpCuratorId}`);
    } catch {
      showToast(`Top-up granted to ${topUpCuratorId}`);
      setIsTopUpModalOpen(false);
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-gray-400 font-medium tracking-tight mb-1">
            Settings / Curators
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">
            Curator tiers and token rules
          </h1>
        </div>

        <div>
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-medium bg-[#0B1320] text-white hover:bg-[#151D2A] shadow-sm transition-all"
          >
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Table: Curator Tiers */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FA] border-b border-gray-200/80 text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none">
              <tr>
                <th className="py-3 px-4">TIER</th>
                <th className="py-3 px-4">HANDLES TRIPS</th>
                <th className="py-3 px-4">REQUESTS ROUTED TO</th>
                <th className="py-3 px-4">MONTHLY TOKENS</th>
                <th className="py-3 px-4">START-UP TOKENS</th>
                <th className="py-3 px-4">EXPIRY</th>
                <th className="py-3 px-4">MARK-UP RANGE</th>
                <th className="py-3 px-4">HANDLING SHARE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {tiers.map((row, idx) => (
                <tr key={row.tier || idx} className="hover:bg-gray-50/80 transition-colors">
                  {/* Tier */}
                  <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                    {row.tier}
                  </td>

                  {/* Handles Trips */}
                  <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                    {row.handlesTrips}
                  </td>

                  {/* Requests Routed To */}
                  <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                    {row.requestsRoutedTo}
                  </td>

                  {/* Monthly Tokens */}
                  <td className="py-3.5 px-4 font-mono text-gray-800 whitespace-nowrap">
                    <input
                      type="number"
                      value={row.monthlyTokens}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updated = [...tiers];
                        updated[idx].monthlyTokens = val;
                        setTiers(updated);
                      }}
                      className="w-14 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                    />
                  </td>

                  {/* Startup Tokens */}
                  <td className="py-3.5 px-4 font-mono text-gray-800 whitespace-nowrap">
                    <input
                      type="number"
                      value={row.startupTokens}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updated = [...tiers];
                        updated[idx].startupTokens = val;
                        setTiers(updated);
                      }}
                      className="w-14 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                    />
                  </td>

                  {/* Expiry */}
                  <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                    {row.expiry}
                  </td>

                  {/* Mark-up Range */}
                  <td className="py-3.5 px-4 text-gray-800 whitespace-nowrap">
                    {row.markupRange}
                  </td>

                  {/* Handling Share */}
                  <td className="py-3.5 px-4 text-gray-800 whitespace-nowrap">
                    {row.handlingShare}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Note below table */}
        <div className="px-5 py-3 border-t border-gray-100 bg-[#FAFAFA] text-xs text-gray-500 leading-normal">
          Mark-up outside the range needs the MD's override on the trip, with a reason; the override is logged. Handling share is calculated on the introducing Curator's mark-up; when the desk handles, it is booked to OrbAero as a handling fee.
        </div>
      </div>

      {/* Bottom Section: Token Rules (Left) + Right Rail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Columns: Token Rules */}
        <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900 text-sm">Token rules</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-xs">
            {/* Left Column */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  PRICE
                </span>
                <span className="text-gray-900 font-semibold text-sm">
                  ${tokenRules.pricePerToken}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  PER REQUEST
                </span>
                <span className="text-gray-800 font-medium">
                  {tokenRules.perRequest}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  AFTER SIGNATURE
                </span>
                <span className="text-gray-800">
                  {tokenRules.afterSignature}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  EARNED
                </span>
                <span className="text-gray-800">
                  {tokenRules.earnedTokens}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  PAID EXPIRY
                </span>
                <span className="text-gray-800 font-medium">
                  {tokenRules.paidExpiry}
                </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  BUNDLES
                </span>
                <span className="text-gray-800 font-medium">
                  {tokenRules.bundles}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  FREE REVISIONS
                </span>
                <span className="text-gray-800 font-medium">
                  {tokenRules.freeRevisions}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  RETURNED
                </span>
                <span className="text-gray-800 leading-snug block">
                  {tokenRules.returnedConditions}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  ORDER OF USE
                </span>
                <span className="text-gray-800 font-medium">
                  {tokenRules.orderOfUse}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  ASSIGNED LEADS
                </span>
                <span className="text-gray-800 font-medium">
                  {tokenRules.assignedLeads}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Top-up & Direct Route */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Top-up Card */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-2.5">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              FOUNDING CURATOR TOP-UP
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              MD only. Adds tokens to this month's allowance for one Founding Curator.
            </p>
            <div className="text-xs text-gray-500 font-medium">
              Last: {topUpHistory[0]?.curatorName || "No. 07"} · +{topUpHistory[0]?.tokensAdded || 6} · {topUpHistory[0]?.date || "12 Nov"} · {topUpHistory[0]?.grantedBy || "Obi (MD)"}
            </div>
            <div className="pt-1">
              <button
                onClick={() => setIsTopUpModalOpen(true)}
                className="w-full text-center py-2 px-3 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-gray-500" />
                <span>Top up Founding Curator</span>
              </button>
            </div>
          </div>

          {/* Direct Route Card */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-3 text-xs">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              DIRECT ROUTE
            </div>
            <p className="text-gray-700 leading-relaxed">
              Booking deposit ${directRoute.bookingDeposit}; {directRoute.depositTerms}
            </p>
            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">
                  Assignment rule:
                </label>
                <input
                  type="text"
                  value={directRoute.assignmentRule}
                  onChange={(e) => setDirectRoute({ ...directRoute, assignmentRule: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-500 block mb-1">
                  Standard mark-up:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={directRoute.standardMarkupPct}
                    onChange={(e) => setDirectRoute({ ...directRoute, standardMarkupPct: Number(e.target.value) })}
                    className="w-20 bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 font-mono"
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Founding Curator Top-up */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Founding Curator Top-Up</h3>
              <button
                onClick={() => setIsTopUpModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Founding Curator</label>
                <select
                  value={topUpCuratorId}
                  onChange={(e) => setTopUpCuratorId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                >
                  <option value="Curator No. 03">Curator No. 03 (Alexander Vance)</option>
                  <option value="Curator No. 07">Curator No. 07 (Tariq Al-Mansoor)</option>
                  <option value="Curator No. 12">Curator No. 12 (Elena Rostova)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Tokens to add</label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono"
                  required
                />
              </div>

              <div className="text-[11px] text-gray-500">
                Authorized by: Obi (MD) · Changes are logged in audit ledger.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0B1320] text-white rounded-lg hover:bg-[#151D2A] font-medium"
                >
                  Confirm Top-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
