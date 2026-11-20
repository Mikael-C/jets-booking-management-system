"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { formatRequestId, formatQuoteId, formatTripId } from "@/lib/idGenerator";

type FilterKey = "all" | "waiting" | "quoted" | "confirmed" | "expired";

interface RequestRow {
  id: string;
  reference: string;
  client: string;
  route: string;
  flight: string;
  status: "waiting" | "quoted" | "confirmed" | "expired";
  statusLabel: string;
  clientPrice: string | null;
  expires: string | null;
  actionLabel: string | null;
  actionHref: string | null;
  quoteId?: string;
  tripId?: string;
  rawReqId?: string;
}

export default function AgentRequestsListView() {
  const { agentRequests, bookings, refreshAgentRequests, currentUser, addMessage } = useAviation();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [messagingRequestId, setMessagingRequestId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    void refreshAgentRequests();
  }, []);

  const rows: RequestRow[] = [];

  // From agentRequests
  agentRequests.forEach((req, index) => {
    const fallbackIdx = index + 1;
    const reqCleanId = formatRequestId(req.requestNumber || req.id, fallbackIdx);
    const linkedBooking = bookings.find(
      (b) => b.id === req.bookingId || b.id === (req as any).generatedBookingId
    );

    let status: RequestRow["status"] = "waiting";
    let statusLabel = "Waiting for quote";
    let clientPrice: string | null = null;
    let expires: string | null = null;
    let actionLabel: string | null = "Message desk";
    let actionHref: string | null = `/agent/requests`;
    let reference = reqCleanId;

    if (req.status === "declined") {
      status = "expired";
      statusLabel = "Declined";
      actionLabel = null;
      actionHref = null;
    } else if (linkedBooking) {
      const bStatus = linkedBooking.status;

      if (
        ["confirmed", "dispatched", "in_flight", "completed", "contract_sent"].includes(bStatus) ||
        linkedBooking.isContractSigned
      ) {
        status = "confirmed";
        statusLabel = "Booked";
        clientPrice = `€ ${linkedBooking.pricing.totalFlightPrice.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`;
        expires = "—";
        actionLabel = "Open trip";
        actionHref = `/agent/trips/${linkedBooking.id}`;
        reference = formatTripId(linkedBooking.tripNumber || linkedBooking.tripId || req.tripId || reqCleanId, fallbackIdx);
      } else if (
        ["quote_sent", "client_review", "draft"].includes(bStatus) ||
        req.status === "completed"
      ) {
        status = "quoted";
        const expDate = (linkedBooking as any).quoteExpirationDate;
        let expiresText = "—";
        if (expDate) {
          try {
            const exp = new Date(expDate.split(".").reverse().join("-"));
            const now = new Date();
            const diffMs = exp.getTime() - now.getTime();
            if (diffMs < 0) {
              expiresText = "Expired";
              status = "expired";
              statusLabel = "Expired";
            } else {
              const diffH = Math.floor(diffMs / 3600000);
              const diffM = Math.floor((diffMs % 3600000) / 60000);
              if (diffH < 24) {
                expiresText = diffH > 0 ? `${diffH} h` : `${diffM} min`;
                statusLabel = `Quoted · expires ${expiresText}`;
              } else {
                expiresText = `${Math.floor(diffH / 24)}d`;
                statusLabel = `Quoted · expires ${expiresText}`;
              }
            }
          } catch {
            expiresText = expDate;
          }
        } else {
          statusLabel = `Quoted`;
          expiresText = "—";
        }
        expires = expiresText;
        clientPrice = `€ ${linkedBooking.pricing.totalFlightPrice.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`;
        actionLabel = "View quote";
        actionHref = `/agent/quotes/${linkedBooking.id}`;
        reference = formatQuoteId(
          (linkedBooking as any).quoteReference || linkedBooking.quoteId || req.quoteGroupId || reqCleanId,
          fallbackIdx,
          linkedBooking.quoteVersion || 1
        );
      }
    } else if (req.status === "completed") {
      status = "waiting";
      statusLabel = "Waiting for quote";
    }

    // Route display
    let route =
      (req as any).route ||
      `${(req as any).originIcao || "—"} → ${(req as any).destIcao || "—"}`;
    if (route.includes("⇄")) route = route.replace("⇄", "→");
    const routeDisplay =
      route.length > 15
        ? `${(req as any).originIcao || "?"} → ${(req as any).destIcao || "?"}`
        : route;

    // Flight date display
    const dateStr = (req as any).flightDate || "";
    let flightDisplay = dateStr;
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        flightDisplay = d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        });
      } catch {}
    }

    rows.push({
      id: `req-${req.id}`,
      reference,
      client: req.clientName || (req as any).companyName || "—",
      route: routeDisplay,
      flight: flightDisplay,
      status,
      statusLabel,
      clientPrice,
      expires,
      actionLabel,
      actionHref,
      rawReqId: req.id,
    });
  });

  // Also include booked bookings not in agentRequests
  bookings.forEach((b) => {
    if (
      (b as any).agentEmail &&
      currentUser?.email &&
      (b as any).agentEmail.toLowerCase() !== currentUser.email.toLowerCase()
    )
      return;
    const alreadyIncluded = rows.some(
      (r) =>
        r.actionHref?.includes(b.id) ||
        r.reference === b.tripNumber ||
        r.reference === ((b as any).quoteReference || "")
    );
    if (alreadyIncluded) return;

    if (
      ["confirmed", "dispatched", "in_flight", "completed"].includes(b.status) &&
      b.isBooked
    ) {
      const route =
        b.legs
          ?.map(
            (l) =>
              `${l.origin?.icao || "?"} → ${l.destination?.icao || "?"}`
          )
          .join(", ") || "—";
      const dateStr = b.legs?.[0]?.flightDate || "";
      let flightDisplay = dateStr;
      if (dateStr) {
        try {
          const d = new Date(dateStr);
          flightDisplay = d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          });
        } catch {}
      }
      const tripCleanId = formatTripId(b.tripNumber || b.tripId || b.id, agentRequests.length + rows.length + 1);
      rows.push({
        id: `bk-${b.id}`,
        reference: tripCleanId,
        client: b.client?.fullName || (b.client as any)?.companyName || "—",
        route,
        flight: flightDisplay,
        status: "confirmed",
        statusLabel: "Booked",
        clientPrice: `€ ${b.pricing.totalFlightPrice.toLocaleString("en-US", {
          minimumFractionDigits: 0,
        })}`,
        expires: "—",
        actionLabel: "Open trip",
        actionHref: `/agent/trips/${b.id}`,
        tripId: b.id,
      });
    }
  });

  // Filter counts
  const counts = {
    all: rows.length,
    waiting: rows.filter((r) => r.status === "waiting").length,
    quoted: rows.filter((r) => r.status === "quoted").length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    expired: rows.filter((r) => r.status === "expired").length,
  };

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: "all", label: `All ${counts.all}` },
    {
      key: "waiting",
      label: `Waiting for quote${counts.waiting > 0 ? " " + counts.waiting : ""}`,
    },
    { key: "quoted", label: `Quoted${counts.quoted > 0 ? " " + counts.quoted : ""}` },
    {
      key: "confirmed",
      label: `Client confirmed${counts.confirmed > 0 ? " " + counts.confirmed : ""}`,
    },
    { key: "expired", label: "Expired" },
  ];

  const getStatusBadge = (row: RequestRow) => {
    if (row.statusLabel.includes("Booked")) {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#134E2E] text-[#4ADE80]">
          Booked
        </span>
      );
    }
    if (row.statusLabel.includes("Quoted · expires") || (row.status === "quoted" && !row.statusLabel.includes("→"))) {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#5C3800] text-[#FFB84D]">
          {row.statusLabel}
        </span>
      );
    }
    if (row.statusLabel.includes("Quoted →")) {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-[#1E293B] text-[#94A3B8]">
          {row.statusLabel}
        </span>
      );
    }
    if (row.statusLabel.includes("Waiting for quote") || row.status === "waiting") {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-[#1E293B] text-[#94A3B8]">
          Waiting for quote
        </span>
      );
    }
    if (row.status === "expired") {
      return <span className="text-xs text-gray-400">{row.statusLabel}</span>;
    }
    return <span className="text-xs text-gray-400">{row.statusLabel}</span>;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">My requests and quotes</h1>
      <p className="text-sm text-gray-400 mb-6">
        Newest first. A quote shows here as soon as the desk completes it.
      </p>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-[#C9A052] text-[#0F1420] font-bold"
                : "bg-[#1A2338] text-gray-300 hover:bg-[#243050]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#141C2E] rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Reference
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Client
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Route
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Flight
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Status
              </th>
              <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">
                Client price
              </th>
              <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">
                Expires
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-500 py-10 text-sm">
                  No requests found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-sm text-white font-semibold">
                    {row.reference}
                  </td>
                  <td className="px-4 py-3 text-gray-200">{row.client}</td>
                  <td className="px-4 py-3 font-mono text-gray-300">{row.route}</td>
                  <td className="px-4 py-3 text-gray-300">{row.flight}</td>
                  <td className="px-4 py-3">{getStatusBadge(row)}</td>
                  <td className="px-4 py-3 text-right text-gray-200 font-mono">
                    {row.clientPrice || "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    {row.expires || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.actionLabel === "Message desk" ? (
                      <button
                        onClick={() => {
                          setMessagingRequestId(row.reference);
                          setMessageText("");
                          setMessageSent(false);
                        }}
                        className="text-[#C9A052] hover:underline text-sm font-medium"
                      >
                        Message desk
                      </button>
                    ) : row.actionLabel && row.actionHref ? (
                      <Link
                        href={row.actionHref}
                        className="text-[#C9A052] hover:underline text-sm font-medium"
                      >
                        {row.actionLabel}
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Agents only ever see their own clients, requests and trips.
      </p>

      {/* Message Desk Modal */}
      {messagingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#141C2E] border border-white/20 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">
                Message Flight Operations Desk · {messagingRequestId}
              </h3>
              <button
                onClick={() => setMessagingRequestId(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {messageSent ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-center space-y-1">
                <p className="text-sm font-bold text-emerald-400">Message dispatched to desk!</p>
                <p className="text-xs text-gray-400">Flight operations will reply shortly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">
                  Send a priority inquiry to the 24/7 broker operations desk regarding this request.
                </p>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="e.g. Please expedite pricing for Adeyemi Holdings, client is waiting..."
                  className="w-full bg-[#0F1420] border border-white/20 rounded p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A052] h-28 resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setMessagingRequestId(null)}
                    className="px-4 py-2 bg-[#1A2338] border border-white/20 text-xs font-bold text-white rounded hover:bg-[#243050]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!messageText.trim()) return;
                      addMessage(messagingRequestId, {
                        senderName: currentUser?.name || "Marcus Vance",
                        senderRole: "agent",
                        content: `[${messagingRequestId}] ${messageText.trim()}`,
                        isFromAdmin: false,
                      });
                      setMessageSent(true);
                      setTimeout(() => setMessagingRequestId(null), 1800);
                    }}
                    className="px-4 py-2 bg-[#C9A052] text-[#0F1420] text-xs font-bold rounded hover:bg-[#B88F42]"
                  >
                    Send to Desk
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
