import React from "react";

/** Document number as in the designs: small prefix ("INV-"), the trip code, small suffix ("-005-1"). */
export default function DocId({ id, className = "" }: { id?: string | null; className?: string }) {
  if (!id) return <span className={className}>—</span>;
  const m = String(id).match(/^([A-Za-z]+-)([A-Za-z]{2}\d{3,6}|[A-Za-z0-9]+?)((?:-\d{1,3})*)$/);
  if (!m) return <span className={`font-mono ${className}`}>{id}</span>;
  return (
    <span className={`font-mono whitespace-nowrap inline-flex items-baseline ${className}`}>
      <span className="text-[9px] uppercase text-slate-500">{m[1]}</span>
      <span className="text-[12px] font-medium text-slate-900">{m[2]}</span>
      {m[3] && <span className="text-[9px] text-slate-500">{m[3]}</span>}
    </span>
  );
}

/**
 * An ID inside a heading or breadcrumb, as in the designs: the prefix ("TRI-", "QUO-") and the version
 * ("-004") are set small, the trip code bold. Sizes are relative to the surrounding text.
 *  - scale: size of the whole ID against the text around it (1 = same size)
 *  - affix: size of the prefix and version against the trip code
 */
export function HeaderId({
  id,
  scale = 1,
  affix = 0.5,
  className = ""
}: {
  id?: string | null;
  scale?: number;
  affix?: number;
  className?: string;
}) {
  if (!id) return null;
  const m = String(id).match(/^([A-Za-z]+-)([A-Za-z]{2}\d{3,6}|[A-Za-z0-9]+?)((?:-\d{1,3})*)$/);
  if (!m) return <span className={className}>{id}</span>;
  return (
    <span className={`inline-flex items-baseline whitespace-nowrap ${className}`} style={{ fontSize: `${scale}em` }}>
      <span className="font-semibold uppercase tracking-wide" style={{ fontSize: `${affix}em` }}>
        {m[1]}
      </span>
      <span className="font-bold">{m[2]}</span>
      {m[3] && (
        <span className="font-semibold" style={{ fontSize: `${affix}em` }}>
          {m[3]}
        </span>
      )}
    </span>
  );
}
