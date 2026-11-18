"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import FleetView from "@/components/admin/FleetView";

export default function AircraftTypesPage() {
  return (
    <AppShell navKey="aircraft_types">
      <FleetView />
    </AppShell>
  );
}
