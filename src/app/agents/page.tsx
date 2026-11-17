"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import AgentsView from "@/components/admin/AgentsView";

export default function AgentsPage() {
  return (
    <AppShell navKey="agents">
      <AgentsView />
    </AppShell>
  );
}
