"use client";

import React from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import OperatorsView from "@/components/admin/OperatorsView";

export default function OperatorDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <AppShell navKey="operators">
      <OperatorsView selectedOperatorId={id} />
    </AppShell>
  );
}
