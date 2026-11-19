"use client";
import React from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentQuoteDetailView from "@/components/agent/AgentQuoteDetailView";

export default function AgentQuoteDetailPage({
  params,
}: {
  params: { quoteId: string };
}) {
  return (
    <AgentShell>
      <AgentQuoteDetailView quoteId={params.quoteId} />
    </AgentShell>
  );
}
