"use client";
import React, { Suspense } from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentNewRequestWizard from "@/components/agent/AgentNewRequestWizard";

export default function NewAgentRequestPage() {
  return (
    <AgentShell>
      <Suspense fallback={null}>
        <AgentNewRequestWizard />
      </Suspense>
    </AgentShell>
  );
}
