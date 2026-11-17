"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import AirportsView from "@/components/admin/AirportsView";

export default function AirportsPage() {
  return (
    <AppShell navKey="airports">
      <AirportsView />
    </AppShell>
  );
}
