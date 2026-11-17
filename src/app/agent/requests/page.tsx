"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import AgentRequestsListView from "@/components/agent/AgentRequestsListView";

export default function AgentRequestsPage() {
  return (
    <AppShell navKey="my_requests">
      <AgentRequestsListView />
    </AppShell>
  );
}
