"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import CuratorTiersView from "@/components/admin/CuratorTiersView";

export default function CuratorTiersPage() {
  return (
    <AppShell navKey="curators">
      <CuratorTiersView />
    </AppShell>
  );
}
