"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import FbosView from "@/components/admin/FbosView";

export default function FbosPage() {
  return (
    <AppShell navKey="fbos">
      <FbosView />
    </AppShell>
  );
}
