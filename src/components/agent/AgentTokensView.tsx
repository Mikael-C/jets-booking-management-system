"use client";
import React from "react";
import { useAviation } from "@/lib/aviationContext";

const TOKEN_PACKAGES = [
  { tokens: 10, label: "10 tokens", priceLabel: "[price per Q-03]", highlight: false },
  { tokens: 25, label: "25 tokens", priceLabel: "[price per Q-03]", highlight: true },
  { tokens: 50, label: "50 tokens", priceLabel: "[price per Q-03]", highlight: false },
];

export default function AgentTokensView() {
  const {
    tokenBalance,
    tokenTransactions,
    agentRequests,
    bookings,
    openTokenModal,
  } = useAviation();

  // Conversion rate: confirmed/booked out of all submitted requests
  const totalRequests = agentRequests.length;
  const confirmedTrips = bookings.filter((b) =>
    ["confirmed", "dispatched", "in_flight", "completed"].includes(b.status) && b.isBooked
  ).length;
  const conversionPct =
    totalRequests > 0 ? Math.round((confirmedTrips / totalRequests) * 100) : 0;

  // Declined requests (tokens refunded)
  const declinedCount = agentRequests.filter((r) => r.status === "declined").length;

  const handleBuy = (pkg: (typeof TOKEN_PACKAGES)[0]) => {
    openTokenModal(`Purchase ${pkg.tokens} tokens`);
  };

  // Real transaction data from context
  const txns = (tokenTransactions || []).slice(0, 25);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Tokens</h1>
      <p className="text-sm text-gray-400 mb-6">
        One token per request. Drafts and estimates are free.
      </p>

      {/* 3 stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Balance */}
        <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">
            Balance
          </p>
          <p className="text-5xl font-bold text-[#C9A052] font-mono leading-none mb-3">
            {tokenBalance}
          </p>
          <p className="text-xs text-gray-400">5 free tokens earned this month</p>
        </div>

        {/* Conversion */}
        <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">
            Your Conversion
          </p>
          <p className="text-5xl font-bold text-white font-mono leading-none mb-3">
            {conversionPct} %
          </p>
          <p className="text-xs text-gray-400">
            Above 25 %: 5 free tokens each month
          </p>
        </div>

        {/* Declined */}
        <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">
            Declined Requests
          </p>
          <p className="text-5xl font-bold text-white font-mono leading-none mb-3">
            {declinedCount}
          </p>
          <p className="text-xs text-gray-400">
            Refunded automatically when no aircraft is found
          </p>
        </div>
      </div>

      {/* Top up section */}
      <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Top up</h2>
        <div className="grid grid-cols-3 gap-4">
          {TOKEN_PACKAGES.map((pkg) => (
            <div
              key={pkg.tokens}
              className={`rounded-lg p-4 border ${
                pkg.highlight
                  ? "border-[#C9A052]/40 bg-[#1A2338]"
                  : "border-white/10 bg-[#0F1420]"
              }`}
            >
              <p className="text-lg font-bold text-white mb-1">{pkg.label}</p>
              <p className="text-sm text-[#C9A052] font-mono mb-4">
                {pkg.priceLabel}
              </p>
              <button
                onClick={() => handleBuy(pkg)}
                className={`w-full py-2 rounded text-sm font-semibold transition-colors ${
                  pkg.highlight
                    ? "bg-[#C9A052] text-[#0F1420] hover:bg-[#B88F42]"
                    : "bg-[#1A2338] border border-white/20 text-white hover:bg-[#243050]"
                }`}
              >
                Buy
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history table */}
      <div className="bg-[#141C2E] border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Date
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Entry
              </th>
              <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">
                Tokens
              </th>
              <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {txns.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-gray-500 py-10 text-sm"
                >
                  No token transactions yet.
                </td>
              </tr>
            ) : (
              txns.map((tx, i) => {
                const isCredit = tx.type === "credit";
                let dateStr = "—";
                if (tx.createdAt) {
                  try {
                    const d = new Date(tx.createdAt);
                    dateStr = d.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    });
                  } catch {}
                }
                return (
                  <tr
                    key={tx.id || i}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-gray-400">{dateStr}</td>
                    <td className="px-4 py-3 text-gray-200">
                      {tx.action || tx.description || "Transaction"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-semibold ${
                        isCredit ? "text-green-400" : "text-gray-200"
                      }`}
                    >
                      {isCredit ? `+ ${tx.amount}` : `– ${tx.amount}`}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300">
                      {tx.balanceAfter}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
