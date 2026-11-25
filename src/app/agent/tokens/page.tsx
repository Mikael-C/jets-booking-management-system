"use client";
import React, { Suspense } from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentTokensView from "@/components/agent/AgentTokensView";

export default function AgentTokensPage() {
  return (
    <AgentShell>
      <Suspense fallback={null}>
        <AgentTokensView />
      </Suspense>
    </AgentShell>
  );
}
