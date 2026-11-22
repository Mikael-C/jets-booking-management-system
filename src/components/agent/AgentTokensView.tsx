"use client";
import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Check, ShoppingCart } from "lucide-react";

interface MovementRow {
  id: string;
  date: string;
  movement: string;
  trip: string;
  tokens: string;
  tokensNum: number;
  type: string;
}

const DEFAULT_MOVEMENTS: MovementRow[] = [
  {
    id: "m1",
    date: "19 Nov",
    movement: "Quote request · 2 legs",
    trip: "RB3310-001",
    tokens: "-2",
    tokensNum: -2,
    type: "Monthly",
  },
  {
    id: "m2",
    date: "18 Nov",
    movement: "Revision 2 of 2 (free)",
    trip: "FE4578-004",
    tokens: "0",
    tokensNum: 0,
    type: "—",
  },
  {
    id: "m3",
    date: "17 Nov",
    movement: "Booking completed",
    trip: "TA2201",
    tokens: "+1",
    tokensNum: 1,
    type: "Free (earned)",
  },
  {
    id: "m4",
    date: "14 Nov",
    movement: "No aircraft found · returned",
    trip: "MX5521-001",
    tokens: "+1",
    tokensNum: 1,
    type: "Paid",
  },
  {
    id: "m5",
    date: "10 Nov",
    movement: "Bundle of 15 bought",
    trip: "—",
    tokens: "+15",
    tokensNum: 15,
    type: "Paid",
  },
  {
    id: "m6",
    date: "1 Nov",
    movement: "Monthly allowance",
    trip: "—",
    tokens: "+5",
    tokensNum: 5,
    type: "Monthly",
  },
];

const PACKAGES = [
  { id: "p1", count: 1, label: "1 token", price: "$10", priceNum: 10 },
  { id: "p15", count: 15, label: "15 tokens · save 10%", price: "$135", priceNum: 135 },
  { id: "p25", count: 25, label: "25 tokens · save 16%", price: "$210", priceNum: 210 },
  { id: "p50", count: 50, label: "50 tokens · save 25%", price: "$375", priceNum: 375 },
];

export default function AgentTokensView() {
  const { tokenBalance, openTokenModal, subscribeOrRefillTokens } = useAviation();
  const [selectedPackageId, setSelectedPackageId] = useState("p15");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const selectedPkg = PACKAGES.find((p) => p.id === selectedPackageId) || PACKAGES[1];

  const monthlyTokens = 3;
  const freeTokens = 2;
  const paidTokens = tokenBalance !== undefined && tokenBalance > 5 ? tokenBalance - 5 : 6;
  const totalBalance = monthlyTokens + freeTokens + paidTokens;

  const handleBuy = async () => {
    setIsPurchasing(true);
    setPurchaseSuccess(null);
    try {
      await subscribeOrRefillTokens("USD", "card");
      setPurchaseSuccess(`${selectedPkg.count} tokens added to your balance!`);
    } catch {
      openTokenModal(`Purchase ${selectedPkg.label} (${selectedPkg.price})`);
    } finally {
      setIsPurchasing(false);
      setTimeout(() => setPurchaseSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Tokens</h1>
        <p className="text-sm text-gray-400 mt-1">
          1 token per leg of a quote request ($10/token). Once the contract is signed, no more tokens for that trip.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Balance */}
        <div className="bg-[#141C2E] border border-white/10 rounded-xl p-5 space-y-3">
          <p className="text-xs text-gray-400 font-medium">Balance</p>
          <p className="text-4xl font-bold text-white font-mono leading-none">
            {totalBalance}
          </p>
          <p className="text-xs text-gray-500">Monthly {monthlyTokens} · free {freeTokens} · paid {paidTokens}</p>
        </div>

        {/* 2. Monthly allowance */}
        <div className="bg-[#141C2E] border border-white/10 rounded-xl p-5 space-y-3">
          <p className="text-xs text-gray-400 font-medium">Monthly allowance</p>
          <p className="text-4xl font-bold text-white font-mono leading-none">5</p>
          <p className="text-xs text-gray-500">Patron tier · 3 left · expire 30 Nov</p>
        </div>

        {/* 3. Earned this year */}
        <div className="bg-[#141C2E] border border-white/10 rounded-xl p-5 space-y-3">
          <p className="text-xs text-gray-400 font-medium">Earned this year</p>
          <p className="text-4xl font-bold text-white font-mono leading-none">4</p>
          <p className="text-xs text-gray-500">+1 per completed booking</p>
        </div>

        {/* 4. Returned */}
        <div className="bg-[#141C2E] border border-white/10 rounded-xl p-5 space-y-3">
          <p className="text-xs text-gray-400 font-medium">Returned</p>
          <p className="text-4xl font-bold text-white font-mono leading-none">2</p>
          <p className="text-xs text-gray-500">no aircraft · operational cancellation</p>
        </div>
      </div>

      {/* Two Columns: Movement History (Left) & Buy tokens (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Movement History Table (8 cols) */}
        <div className="lg:col-span-8 bg-[#141C2E] border border-white/10 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-400 font-medium bg-[#101726]">
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Movement</th>
                <th className="py-3.5 px-5">Trip</th>
                <th className="py-3.5 px-5 text-right">Tokens</th>
                <th className="py-3.5 px-5 text-right">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {DEFAULT_MOVEMENTS.map((row) => {
                const isNegative = row.tokensNum < 0;
                const isZero = row.tokensNum === 0;
                return (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-5 text-gray-400 text-xs whitespace-nowrap">{row.date}</td>
                    <td className="py-3.5 px-5 text-white font-medium text-xs">{row.movement}</td>
                    <td className="py-3.5 px-5 text-gray-300 font-mono text-xs">{row.trip}</td>
                    <td
                      className={`py-3.5 px-5 text-right font-mono font-bold text-xs ${
                        isNegative ? "text-gray-300" : isZero ? "text-gray-500" : "text-emerald-400"
                      }`}
                    >
                      {row.tokens}
                    </td>
                    <td className="py-3.5 px-5 text-right text-gray-400 text-xs">{row.type}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Column: Buy tokens Card (4 cols) */}
        <div className="lg:col-span-4 bg-[#141C2E] border border-white/10 rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-white">Buy tokens</h2>

          {/* Bundle Option List */}
          <div className="space-y-2">
            {PACKAGES.map((pkg) => {
              const isSelected = pkg.id === selectedPackageId;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left text-xs transition-all ${
                    isSelected
                      ? "border-[#C9A052] bg-[#1A2338] text-white"
                      : "border-white/10 bg-[#0F1420] text-gray-300 hover:border-white/20"
                  }`}
                >
                  <span className="font-medium">{pkg.label}</span>
                  <span className="font-mono font-bold text-white">{pkg.price}</span>
                </button>
              );
            })}
          </div>

          {/* Buy Button */}
          <button
            onClick={handleBuy}
            disabled={isPurchasing}
            className="w-full py-3 bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-bold rounded-lg text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isPurchasing ? (
              <span>Processing purchase...</span>
            ) : (
              <span>Buy {selectedPkg.count} tokens</span>
            )}
          </button>

          {purchaseSuccess && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded text-center text-xs text-emerald-300">
              {purchaseSuccess}
            </div>
          )}

          {/* Explanatory Footnote */}
          <p className="text-xs text-gray-400 leading-relaxed pt-1">
            Used in this order: monthly, then free, then paid. Paid tokens never expire. Two revisions per request are free before signing; a third change is a new request.
          </p>
        </div>
      </div>
    </div>
  );
}
