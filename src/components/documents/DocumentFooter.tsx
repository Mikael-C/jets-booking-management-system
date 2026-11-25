"use client";

import React from "react";

interface DocumentFooterProps {
  leftText: string;
  currentPage: number;
  totalPages: number;
}

export default function DocumentFooter({ leftText, currentPage, totalPages }: DocumentFooterProps) {
  return (
    <div className="mt-auto pt-3 border-t border-[#D1D5DB] text-[11px] text-[#6B7280] flex justify-between items-center select-none">
      <div className="font-mono">{leftText}</div>
      <div>
        Page {currentPage} / {totalPages}
      </div>
    </div>
  );
}
