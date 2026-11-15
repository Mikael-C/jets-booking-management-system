"use client";

import React from "react";

interface DocumentFooterProps {
  leftText: string;
  currentPage: number;
  totalPages: number;
}

export default function DocumentFooter({ leftText, currentPage, totalPages }: DocumentFooterProps) {
  return (
    <div className="mt-auto pt-4 text-[11px] text-slate-400 flex justify-between items-center font-normal select-none">
      <div>{leftText}</div>
      <div>
        Page {currentPage} / {totalPages}
      </div>
    </div>
  );
}
