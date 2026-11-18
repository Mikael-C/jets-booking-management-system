"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import AuditLogView from "@/components/admin/AuditLogView";

export default function ActivitiesPage() {
  return (
    <AppShell navKey="activities">
      <AuditLogView />
    </AppShell>
  );
}
