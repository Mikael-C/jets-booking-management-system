"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import MessagesView from "@/components/messages/MessagesView";

export default function MessagesPage() {
  return (
    <AppShell navKey="messages">
      <MessagesView />
    </AppShell>
  );
}
