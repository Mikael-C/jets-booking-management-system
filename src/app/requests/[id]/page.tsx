"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import RequestDetailView from "@/components/admin/RequestDetailView";

interface RequestPageProps {
  params: {
    id: string;
  };
}

export default function RequestPage({ params }: RequestPageProps) {
  return (
    <AppShell navKey="agent_requests">
      <RequestDetailView requestId={params.id} />
    </AppShell>
  );
}
