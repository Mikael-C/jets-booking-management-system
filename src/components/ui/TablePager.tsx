"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Pagination for list pages. `resetKey` changes whenever a search, filter or sort changes, so the list goes
 * back to page 1; the page is also kept inside range when rows are added or removed.
 */
export function usePagedRows<T>(rows: T[], perPage: number, resetKey: string) {
  const [page, setPage] = useState(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setPage(1);
  }, [resetKey]);
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const current = Math.min(page, pages);
  const pageRows = useMemo(() => rows.slice((current - 1) * perPage, current * perPage), [rows, current, perPage]);
  return { page: current, pages, pageRows, setPage, total: rows.length, perPage };
}

/** "1–20 of 64 · Prev 1 2 3 … Next". Hidden when everything fits on one page. */
export default function TablePager({
  page,
  pages,
  total,
  perPage,
  setPage,
  label = "rows",
  scrollToId
}: {
  page: number;
  pages: number;
  total: number;
  perPage: number;
  setPage: (p: number) => void;
  label?: string;
  /** Element brought back into view when the page changes (the table's card) */
  scrollToId?: string;
}) {
  if (total <= perPage) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  const go = (p: number) => {
    const next = Math.max(1, Math.min(pages, p));
    if (next === page) return;
    setPage(next);
    if (scrollToId && typeof document !== "undefined") {
      const el = document.getElementById(scrollToId);
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const nums: (number | "gap")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "gap") nums.push("gap");
  }
  const btn =
    "min-w-[32px] h-8 px-2.5 rounded-md border text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-white text-xs text-slate-500">
      <span>
        {from}–{to} of {total} {label}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" className={`${btn} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`} disabled={page <= 1} onClick={() => go(page - 1)}>
          Prev
        </button>
        {nums.map((n, i) =>
          n === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              aria-current={n === page ? "page" : undefined}
              onClick={() => go(n)}
              className={`${btn} ${n === page ? "bg-[#0f172a] border-[#0f172a] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {n}
            </button>
          )
        )}
        <button type="button" className={`${btn} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`} disabled={page >= pages} onClick={() => go(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
