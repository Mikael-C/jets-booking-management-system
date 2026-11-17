"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import FleetView from "@/components/admin/FleetView";

interface AircraftTypeDetailPageProps {
  params: {
    id: string;
  };
}

export default function AircraftTypeDetailPage({ params }: AircraftTypeDetailPageProps) {
  return (
    <AppShell navKey="fleet">
      <FleetView />
    </AppShell>
  );
}
