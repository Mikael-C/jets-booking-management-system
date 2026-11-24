import React from "react";

/** Document number as in the designs: small prefix ("INV-"), the trip code, small suffix ("-005-1"). */
export default function DocId({ id, className = "" }: { id?: string | null; className?: string }) {
  if (!id) return <span className={className}>—</span>;
  const m = String(id).match(/^([A-Za-z]+-)([A-Za-z]{2}\d{3,6}|[A-Za-z0-9]+?)((?:-\d{1,3})*)$/);
  if (!m) return <span className={`font-mono ${className}`}>{id}</span>;
  return (
    <span className={`font-mono whitespace-nowrap inline-flex items-baseline ${className}`}>
      <span className="text-[10px] uppercase text-slate-500">{m[1]}</span>
      <span className="text-[15px] text-slate-900">{m[2]}</span>
      {m[3] && <span className="text-[10px] text-slate-500">{m[3]}</span>}
    </span>
  );
}
