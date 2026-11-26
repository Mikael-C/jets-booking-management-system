"use client";
import React from "react";
import AgentShell from "@/components/agent/AgentShell";
import AgentMessagesView from "@/components/agent/AgentMessagesView";

export default function AgentMessagesPage() {
  return (
    <AgentShell>
      <AgentMessagesView />
    </AgentShell>
  );
}
