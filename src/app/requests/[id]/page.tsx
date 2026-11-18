"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import AgentRequestsQueueView from "@/components/admin/AgentRequestsQueueView";

interface RequestPageProps {
  params: {
    id: string;
  };
}

export default function RequestDetailPage({ params }: RequestPageProps) {
  return (
    <AppShell navKey="agent_requests">
      <AgentRequestsQueueView selectedRequestId={params.id} />
    </AppShell>
  );
}
