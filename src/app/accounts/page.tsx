"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import AccountsView from "@/components/admin/AccountsView";

export default function AccountsPage() {
  return (
    <AppShell navKey="accounts">
      <AccountsView />
    </AppShell>
  );
}
