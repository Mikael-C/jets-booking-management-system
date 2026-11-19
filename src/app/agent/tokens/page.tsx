"use client";
import React from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentTokensView from "@/components/agent/AgentTokensView";

export default function AgentTokensPage() {
  return (
    <AgentShell>
      <AgentTokensView />
    </AgentShell>
  );
}
