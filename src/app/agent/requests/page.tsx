"use client";
import React from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentRequestsListView from "@/components/agent/AgentRequestsListView";

export default function AgentRequestsPage() {
  return (
    <AgentShell>
      <AgentRequestsListView />
    </AgentShell>
  );
}
