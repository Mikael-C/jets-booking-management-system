"use client";
import React from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentRequestDetailView from "@/components/agent/AgentRequestDetailView";

export default function AgentRequestDetailPage({ params }: { params: { requestId: string } }) {
  return (
    <AgentShell>
      <AgentRequestDetailView requestId={params.requestId} />
    </AgentShell>
  );
}
