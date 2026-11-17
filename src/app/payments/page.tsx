"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import PaymentsView from "@/components/admin/PaymentsView";

export default function PaymentsPage() {
  return (
    <AppShell navKey="payments">
      <PaymentsView />
    </AppShell>
  );
}
