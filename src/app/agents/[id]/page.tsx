"use client";

import React from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import AgentsView from "@/components/admin/AgentsView";

export default function AgentDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <AppShell navKey="agents">
      <AgentsView selectedAgentId={id} />
    </AppShell>
  );
}
