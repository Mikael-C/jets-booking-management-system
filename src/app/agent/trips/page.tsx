"use client";
import React from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentTripsListView from "@/components/agent/AgentTripsListView";

export default function AgentTripsPage() {
  return (
    <AgentShell>
      <AgentTripsListView />
    </AgentShell>
  );
}
