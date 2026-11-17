"use client";

import React from "react";
import Link from "next/link";
import StatusPill, { PillVariant } from "./StatusPill";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface RecordHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  badge?: string;
  rootId?: string;
  versionBadge?: string;
  statusLabel?: string;
  statusVariant?: PillVariant;
  actions?: React.ReactNode;
  metadata?: Array<{ label: string; value: React.ReactNode }>;
}

export default function RecordHeader({
  breadcrumbs,
  title,
  subtitle,
  badge,
  rootId,
  versionBadge,
  statusLabel,
  statusVariant = "grey",
  actions,
  metadata = []
}: RecordHeaderProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 mb-5 shadow-sm">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-xs font-mono text-[var(--muted)] mb-2.5">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="opacity-40">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-[var(--accent)] hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[var(--ink)] font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-display text-[var(--ink)] tracking-tight m-0">
              {title}
            </h1>
            {badge && (
              <span className="pill grey font-mono text-[10px] uppercase font-bold">
                {badge}
              </span>
            )}
            {rootId && (
              <span className="font-mono text-base font-semibold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)] border border-[var(--line)]">
                {rootId}
              </span>
            )}
            {versionBadge && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] font-semibold border border-[var(--accent)]/30">
                {versionBadge}
              </span>
            )}
            {statusLabel && (
              <StatusPill label={statusLabel} variant={statusVariant} />
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[var(--muted)] mt-1 mb-0 font-sans">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {/* Metadata strip */}
      {metadata.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-3 text-xs">
          {metadata.map((item, idx) => (
            <div key={idx} className="bg-[var(--paper)] rounded-lg p-2 border border-[var(--line)]/50">
              <span className="block font-display text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">
                {item.label}
              </span>
              <span className="font-mono text-[13px] font-semibold text-[var(--ink)] truncate block mt-0.5">
                {item.value || "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
