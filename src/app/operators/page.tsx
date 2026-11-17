"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import OperatorsView from "@/components/admin/OperatorsView";

export default function OperatorsPage() {
  return (
    <AppShell navKey="operators">
      <OperatorsView />
    </AppShell>
  );
}
