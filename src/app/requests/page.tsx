"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import AgentRequestsQueueView from "@/components/admin/AgentRequestsQueueView";

export default function RequestsPage() {
  return (
    <AppShell navKey="agent_requests">
      <AgentRequestsQueueView />
    </AppShell>
  );
}
