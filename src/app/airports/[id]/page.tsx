"use client";

import React from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import AirportsView from "@/components/admin/AirportsView";

export default function AirportDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <AppShell navKey="airports">
      <AirportsView selectedAirportIcao={id} />
    </AppShell>
  );
}
