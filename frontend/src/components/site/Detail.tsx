import type { ReactNode } from "react";

/** Red-bullet "Label · value" rows — signature metadata style. */
export function DetailList({ rows, className = "" }: { rows: [string, ReactNode][]; className?: string }) {
  return (
    <ul className={`space-y-3 text-[14px] ${className}`}>
      {rows.map(([k, v]) => (
        <li key={k} className="flex items-baseline gap-3">
          <span className="h-1 w-1 shrink-0 translate-y-[-2px] bg-accent-red" />
          <span className="text-ink-muted">{k}</span>
          <span className="text-ink-faint">·</span>
          <span className="min-w-0 break-words text-ink">{v ?? <span className="text-ink-faint">Unavailable</span>}</span>
        </li>
      ))}
    </ul>
  );
}
