"use client";
import React from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentTripDetailView from "@/components/agent/AgentTripDetailView";

export default function AgentTripDetailPage({
  params,
}: {
  params: { tripId: string };
}) {
  return (
    <AgentShell>
      <AgentTripDetailView tripId={params.tripId} />
    </AgentShell>
  );
}
