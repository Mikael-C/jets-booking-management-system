"use client";

import React from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import MessagesAutomationsView from "@/components/admin/MessagesAutomationsView";

export default function AutomationDetailPage() {
  const params = useParams();
  const code = (params?.code as string) || "PAY-02";

  return (
    <AppShell navKey="messages">
      <MessagesAutomationsView initialCode={code} />
    </AppShell>
  );
}
