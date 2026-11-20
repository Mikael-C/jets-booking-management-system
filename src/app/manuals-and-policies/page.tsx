"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import ManualsPoliciesView from "@/components/admin/ManualsPoliciesView";

export default function ManualsPoliciesPage() {
  return (
    <AppShell navKey="manuals_policies">
      <ManualsPoliciesView initialView="documents" />
    </AppShell>
  );
}
