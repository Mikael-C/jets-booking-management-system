"use client";

import React, { useState } from "react";
import { useAviation, formatAuditDetails } from "@/lib/aviationContext";
import {
  Search,
  Lock,
  Download,
  Activity,
  RefreshCw
} from "lucide-react";

export default function AuditLogView() {
  const { auditLog, refreshAuditLog } = useAviation();
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Safe logs array fallback
  const logs = Array.isArray(auditLog) ? auditLog : [];

  // Filter audit log safely
  const filteredLogs = logs.filter((entry) => {
    if (!entry) return false;

    const userName = String(entry.userName || "").toLowerCase();
    const userEmail = String(entry.userEmail || "").toLowerCase();
    const action = String(entry.action || "").toLowerCase();
    const entityId = String(entry.entityId || "").toLowerCase();
    const details = formatAuditDetails(entry.details).toLowerCase();
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      userName.includes(query) ||
      userEmail.includes(query) ||
      action.includes(query) ||
      entityId.includes(query) ||
      details.includes(query);

    const entityType = String(entry.entityType || "").toLowerCase();
    const filterType = entityFilter.toLowerCase();
    const matchesEntity =
      filterType === "all" ||
      entityType === filterType ||
      (filterType === "security" && (entityType === "security" || entityType === "user"));

    return matchesSearch && matchesEntity;
  });

  // Action badge color
  const getActionBadge = (action?: string) => {
    const act = String(action || "ACTIVITY").toUpperCase();
    if (act.includes("PAYMENT")) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          {action || "PAYMENT"}
        </span>
      );
    }
    if (act.includes("OVERRIDE") || act.includes("DISCOUNT") || act.includes("WARNING")) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
          {action || "WARNING"}
        </span>
      );
    }
    if (act.includes("DELETE") || act.includes("REJECT") || act.includes("SUSPEND")) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300">
          {action || "DELETE"}
        </span>
      );
    }
    if (act.includes("LOGIN") || act.includes("AUTH") || act.includes("SECURITY") || act.includes("USER_")) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300">
          {action || "SECURITY"}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
        {action || "ACTIVITY"}
      </span>
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshAuditLog) {
        await refreshAuditLog();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Timestamp", "User Name", "User Email", "Action", "Entity Type", "Entity ID", "Details"];
    const rows = filteredLogs.map((l) => [
      `"${String(l?.timestamp || "").replace(/"/g, '""')}"`,
      `"${String(l?.userName || "").replace(/"/g, '""')}"`,
      `"${String(l?.userEmail || "").replace(/"/g, '""')}"`,
      `"${String(l?.action || "").replace(/"/g, '""')}"`,
      `"${String(l?.entityType || "").replace(/"/g, '""')}"`,
      `"${String(l?.entityId || "").replace(/"/g, '""')}"`,
      `"${formatAuditDetails(l?.details).replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orbelo_activity_log_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* View Header */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              LIVE APPLICATION ACTIVITY FEED
            </span>
            <span className="text-xs text-[#0F1420]/60">ISO 27001 & Aviation Compliance</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Application Activities & Audit Trail
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Real-time chronological timeline of all activities occurring across the web application: bookings, quotes, user provisioning, dispatch checks, payments, and system authentications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] border border-[#E0DAD0] text-xs font-mono font-bold text-[#0F1420] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh activity logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C9A052] ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F1420] hover:bg-[#1a2336] border border-[#0F1420] text-xs font-mono font-bold text-white transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#C9A052]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Immutable Warning Notice */}
      <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-3 text-xs shadow-md border border-slate-800">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-[#C9A052] flex-shrink-0" />
          <span className="font-mono text-[11px] text-gray-300">
            <strong className="text-white">Tamper-Evident Security Log:</strong> Every event is recorded with caller identity, IP address, and timestamp. Records are immutable and synchronized with the backend database.
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded flex items-center gap-1">
          <Activity className="w-3 h-3" />
          LIVE SYNCHRONIZED
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search activities, users, actions, or entity IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0F1420] placeholder-gray-400 focus:outline-none focus:border-[#C9A052]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "All Activities" },
            { id: "Booking", label: "Bookings" },
            { id: "Quote", label: "Quotes" },
            { id: "Payment", label: "Payments" },
            { id: "Operator", label: "Operators" },
            { id: "Checklist", label: "Checklists" },
            { id: "AgentRequest", label: "Requests" },
            { id: "Security", label: "Users & Security" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setEntityFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors whitespace-nowrap cursor-pointer ${
                entityFilter === tab.id
                  ? "bg-[#0F1420] text-[#C9A052]"
                  : "bg-[#F5F2EC] text-[#0F1420]/70 hover:bg-[#EAE6DE]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F5F2EC] border-b border-[#E0DAD0] text-[#0F1420]/80 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">User / Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module / Entity</th>
                <th className="py-3 px-4">Entity Ref</th>
                <th className="py-3 px-4">Activity Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0DAD0]/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-gray-500 font-mono">
                    No application activities match the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry, idx) => {
                  const entryKey = entry?.id || (entry as any)?._id || `log-${idx}`;
                  const detailsText = formatAuditDetails(entry?.details);
                  return (
                    <tr key={entryKey} className="hover:bg-[#FDFCFA] transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-gray-600 whitespace-nowrap text-[11px]">
                        {String(entry?.timestamp || "")}
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F1420]">{entry?.userName || "System"}</div>
                        <p className="text-[10px] font-mono text-gray-500">{entry?.userEmail || "system@orbelo.com"}</p>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4">
                        {getActionBadge(entry?.action)}
                      </td>

                      {/* Entity Type */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-[#0F1420] font-semibold bg-[#F5F2EC] px-2 py-0.5 rounded border border-[#E0DAD0]">
                          {entry?.entityType || "General"}
                        </span>
                      </td>

                      {/* Entity ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#9A7A35] text-[11px]">
                        {entry?.entityId || "—"}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 text-[#0F1420]/80 text-xs leading-relaxed">
                        {detailsText}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
