"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import AgentQuoteDetailView from "@/components/agent/AgentQuoteDetailView";

export default function AgentQuotePage({ params }: { params: { quoteId: string } }) {
  return (
    <AppShell>
      <AgentQuoteDetailView quoteId={params.quoteId} />
    </AppShell>
  );
}
