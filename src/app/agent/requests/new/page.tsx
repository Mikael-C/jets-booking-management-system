"use client";
import React from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentNewRequestWizard from "@/components/agent/AgentNewRequestWizard";

export default function NewAgentRequestPage() {
  return (
    <AgentShell>
      <AgentNewRequestWizard />
    </AgentShell>
  );
}
