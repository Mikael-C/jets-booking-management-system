"use client";
import React from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentClientsView from "@/components/agent/AgentClientsView";

export default function AgentClientsPage() {
  return (
    <AgentShell>
      <AgentClientsView />
    </AgentShell>
  );
}
