"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import ManualsPoliciesView from "@/components/admin/ManualsPoliciesView";

export default function ManualsPoliciesAccessPage() {
  return (
    <AppShell navKey="manuals_policies">
      <ManualsPoliciesView initialView="access" />
    </AppShell>
  );
}
