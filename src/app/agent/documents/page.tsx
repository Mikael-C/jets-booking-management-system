"use client";
import React from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentDocumentsView from "@/components/agent/AgentDocumentsView";

export default function AgentDocumentsPage() {
  return (
    <AgentShell>
      <AgentDocumentsView />
    </AgentShell>
  );
}
