"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import CuratorTiersView from "@/components/admin/CuratorTiersView";

export default function SettingsCuratorsPage() {
  return (
    <AppShell navKey="curators">
      <CuratorTiersView />
    </AppShell>
  );
}
