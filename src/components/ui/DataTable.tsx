"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, AlertCircle, Plus } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  filterChips?: FilterChip[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  emptyMessage?: string;
  createButtonLabel?: string;
  onCreateClick?: () => void;
  error?: string | null;
  onRetry?: () => void;
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  filterChips,
  activeFilter,
  onFilterChange,
  onRowClick,
  searchPlaceholder = "Search records...",
  searchKeys = [],
  emptyMessage = "No records found",
  createButtonLabel,
  onCreateClick,
  error,
  onRetry,
  defaultSortKey,
  defaultSortDir = "asc"
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);

  // Search filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      if (searchKeys.length === 0) {
        return Object.values(row).some((val) =>
          String(val || "").toLowerCase().includes(term)
        );
      }
      return searchKeys.some((k) => {
        const val = row[k as keyof T];
        return String(val || "").toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchKeys]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const compare = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortDir === "asc" ? compare : -compare;
    });
  }, [filteredData, sortKey, sortDir]);

  const handleHeaderClick = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Error State
  if (error) {
    return (
      <div className="bg-[var(--card)] border border-[var(--red)]/40 rounded-xl p-8 text-center my-4">
        <AlertCircle className="w-8 h-8 text-[var(--red)] mx-auto mb-2" />
        <h4 className="font-display text-lg font-bold text-[var(--ink)]">
          Could not load data
        </h4>
        <p className="text-sm text-[var(--muted)] mt-1 mb-4">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary">
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search & Filter Chips Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Chips */}
        {filterChips && filterChips.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {filterChips.map((chip) => {
              const isSelected = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => onFilterChange && onFilterChange(chip.id)}
                  className={`text-xs font-mono px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[var(--ink)] text-[var(--card)] border-[var(--ink)] font-semibold"
                      : "bg-[var(--card)] text-[var(--muted)] border-[var(--line)] hover:border-[var(--muted)]"
                  }`}
                >
                  <span>{chip.label}</span>
                  {typeof chip.count === "number" && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected
                          ? "bg-[var(--card)] text-[var(--ink)]"
                          : "bg-[var(--wf)] text-[var(--muted)]"
                      }`}
                    >
                      {chip.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-[var(--card)] border border-[var(--line)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] font-sans"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="tablewrap">
        <table className="dense-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const isCurrentSort = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    onClick={() => handleHeaderClick(col.key, col.sortable)}
                    className={col.sortable ? "cursor-pointer select-none hover:text-[var(--ink)]" : ""}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="opacity-50">
                          {isCurrentSort ? (
                            sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-2.5 h-2.5 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-[var(--muted)]">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="text-sm font-medium">{emptyMessage}</p>
                    {createButtonLabel && onCreateClick && (
                      <button onClick={onCreateClick} className="btn-primary mx-auto">
                        <Plus className="w-3.5 h-3.5" />
                        <span>{createButtonLabel}</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? "clickable-row" : ""}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : String(row[col.key] || "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
