"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import AgentOverviewView from "@/components/agent/AgentOverviewView";

export default function AgentOverviewPage() {
  return (
    <AppShell>
      <AgentOverviewView />
    </AppShell>
  );
}
