"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import AgentsView from "@/components/admin/AgentsView";
import CuratorTiersView from "@/components/admin/CuratorTiersView";

export default function CuratorsPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "tiers">("tiers");

  return (
    <AppShell navKey="curators">
      <div className="space-y-4">
        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 text-xs font-medium pb-2">
          <button
            onClick={() => setActiveTab("tiers")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "tiers"
                ? "bg-[#0B1320] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Tiers & Token rules
          </button>
          <button
            onClick={() => setActiveTab("directory")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "directory"
                ? "bg-[#0B1320] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Curator Directory & Roster
          </button>
        </div>

        {activeTab === "tiers" ? <CuratorTiersView /> : <AgentsView />}
      </div>
    </AppShell>
  );
}
