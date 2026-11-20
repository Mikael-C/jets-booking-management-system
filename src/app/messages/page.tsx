"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import MessagesAutomationsView from "@/components/admin/MessagesAutomationsView";

export default function MessagesPage() {
  return (
    <AppShell navKey="messages">
      <MessagesAutomationsView />
    </AppShell>
  );
}
