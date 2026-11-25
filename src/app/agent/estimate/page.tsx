"use client";
import React, { Suspense } from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentPriceEstimateView from "@/components/agent/AgentPriceEstimateView";

export default function AgentEstimatePage() {
  return (
    <AgentShell>
      <Suspense fallback={null}>
        <AgentPriceEstimateView />
      </Suspense>
    </AgentShell>
  );
}
