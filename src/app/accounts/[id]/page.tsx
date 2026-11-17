"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import AccountsView from "@/components/admin/AccountsView";

interface AccountPageProps {
  params: {
    id: string;
  };
}

export default function AccountDetailPage({ params }: AccountPageProps) {
  return (
    <AppShell navKey="accounts">
      <AccountsView selectedAccountId={params.id} />
    </AppShell>
  );
}
