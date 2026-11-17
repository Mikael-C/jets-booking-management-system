"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import AgentRequestWizard from "@/components/agent/AgentRequestWizard";

export default function NewAgentRequestPage() {
  return (
    <AppShell navKey="request_quote">
      <AgentRequestWizard />
    </AppShell>
  );
}
