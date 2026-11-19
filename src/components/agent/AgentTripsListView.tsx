"use client";
import React from "react";
import Link from "next/link";
import { useAviation } from "@/lib/aviationContext";

export default function AgentTripsListView() {
  const { bookings } = useAviation();

  const myTrips = bookings.filter(
    (b) =>
      ["confirmed", "dispatched", "in_flight", "completed", "contract_sent", "paid"].includes(
        b.status
      ) && b.isBooked
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">My trips</h1>
      <p className="text-sm text-gray-400 mb-6">
        Confirmed and active flights for your clients.
      </p>

      <div className="bg-[#141C2E] rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Trip
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Client
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Route
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Date
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Status
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {myTrips.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-10">
                  No confirmed trips yet.
                </td>
              </tr>
            ) : (
              myTrips.map((b) => {
                const leg = b.legs?.[0];
                const route =
                  b.legs
                    ?.map(
                      (l) =>
                        `${l.origin?.icao || "?"} → ${l.destination?.icao || "?"}`
                    )
                    .join(", ") || "—";
                const dateStr = leg?.flightDate
                  ? new Date(leg.flightDate).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })
                  : "—";
                return (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-[#C9A052] font-semibold">
                      {b.tripNumber || b.id}
                    </td>
                    <td className="px-4 py-3 text-gray-200">
                      {(b.client as any)?.companyName || b.client?.fullName || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-300">{route}</td>
                    <td className="px-4 py-3 text-gray-300">{dateStr}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-[#1E6B3C] text-green-200 font-medium">
                        {b.isContractSigned
                          ? "Contract signed"
                          : b.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/agent/trips/${b.id}`}
                        className="text-[#C9A052] hover:underline text-sm"
                      >
                        Open trip
                      </Link>
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
