import type { ReactNode } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

const faint = (t = "Unavailable") => <span className="text-ink-faint">{t}</span>;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** m:ss.s, no leading zero on minutes */
export function ts(v: unknown): ReactNode {
  if (!isNum(v)) return faint("Not assessed");
  const m = Math.floor(v / 60);
  const s = v - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}
const range = (a: unknown, b: unknown) => (isNum(a) && isNum(b) ? <>{ts(a)}–{ts(b)}</> : faint("Not assessed"));
const secs = (v: unknown) => (isNum(v) ? `${v}s` : faint());
const ymd = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 10) : faint());

const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint ${className}`}>{children}</div>
);

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <ul className="space-y-2 font-mono text-[12px]">
      {rows.map(([k, v]) => (
        <li key={k} className="flex flex-wrap items-baseline gap-x-2">
          <span className="h-1 w-1 shrink-0 translate-y-[-2px] bg-accent-red" />
          <span className="uppercase tracking-[0.08em] text-ink-muted">{k}</span>
          <span className="text-ink-faint">·</span>
          <span className="min-w-0 break-all text-ink">{v}</span>
        </li>
      ))}
    </ul>
  );
}

const Box = ({ children, className = "", p = "p-5" }: { children: ReactNode; className?: string; p?: string }) => (
  <div className={`rounded-md border border-line bg-elevated ${p} transition-colors hover:border-ink ${className}`}>{children}</div>
);

const Divider = () => <div className="my-10 h-px bg-line" />;

const EmptyMono = ({ children }: { children: ReactNode }) => (
  <div className="rounded-md border border-line px-6 py-10 text-center font-mono text-[12px] text-ink-muted">{children}</div>
);

const ghost = "inline-flex h-9 items-center rounded-md border border-line px-4 text-sm text-ink transition-colors hover:border-ink";

/* ---------- ConfidenceChip ---------- */

const NA: [string, string] = ["bg-chip-na-bg text-chip-na-fg", "Not assessed"];
const TONES: Record<string, [string, string]> = {
  high: ["bg-chip-high-bg text-chip-high-fg", "High"],
  moderate: ["bg-chip-med-bg text-chip-med-fg", "Moderate"],
  low: ["bg-chip-low-bg text-chip-low-fg", "Low"],
  not_assessed: ["bg-chip-na-bg text-chip-na-fg", "Not assessed"],
};

const Pill = ({ tone, children }: { tone: string; children: ReactNode }) => (
  <span className={`inline-block rounded-[4px] px-2.5 py-1 font-mono text-[11px] uppercase leading-none tracking-[0.08em] ${tone}`}>{children}</span>
);

function Bullets({ items, faintText }: { items: string[]; faintText?: boolean }) {
  return (
    <ul className={`mt-2 space-y-1 text-[14px] leading-[1.6] ${faintText ? "text-ink-faint" : "text-ink-muted"}`}>
      {items.map((t, i) => (
        <li key={i} className="flex gap-3"><span className="text-ink-faint">—</span><span>{t}</span></li>
      ))}
    </ul>
  );
}

export function ConfidenceChip({ level, basis, limitations, label = "Confidence" }: { level?: string; basis?: string[]; limitations?: string[]; label?: string }) {
  const [tone, text] = TONES[level ?? ""] ?? NA;
  return (
    <div>
      <div className="flex items-center gap-3">
        <Eyebrow>{label}</Eyebrow>
        <Pill tone={tone}>{text}</Pill>
      </div>
      {basis && basis.length > 0 && (<div className="mt-4"><Eyebrow>Basis</Eyebrow><Bullets items={basis} /></div>)}
      {limitations && limitations.length > 0 && (<div className="mt-4"><Eyebrow>Limitations</Eyebrow><Bullets items={limitations} faintText /></div>)}
    </div>
  );
}

/* ---------- SourceMatchCard ---------- */

function MiniExcerpt() {
  return (
    <div className="hatch rounded-sm">
      <div className="flex items-center justify-center bg-panel py-8">
        <div className="relative h-28 w-20 rounded-sm border border-line bg-gradient-to-b from-elevated to-line/60">
          <span className="absolute inset-x-0 top-1/3 h-[2px] bg-accent-red" />
        </div>
      </div>
    </div>
  );
}

export function SourceMatchCard({ data }: { data: Any }) {
  if (!data) return <EmptyMono>Source match was not assessed.</EmptyMono>;
  const clip = data.submitted_clip ?? {};
  const src = data.source_video;
  const matches: Any[] = Array.isArray(data.matches) ? data.matches : [];
  return (
    <div>
      {/* A */}
      <Eyebrow>The excerpt</Eyebrow>
      <div className="mt-5 grid gap-6 md:grid-cols-[3fr_2fr] md:items-center">
        <Rows rows={[["Clip", clip.url ? <a href={clip.url} target="_blank" rel="noreferrer" className="hover:underline">{clip.url}</a> : faint()], ["Title", clip.title ?? faint()], ["Duration", secs(clip.duration_seconds)]]} />
        <MiniExcerpt />
      </div>
      <p className="mt-6 font-mono text-[13px] text-ink">
        COVERAGE · {isNum(data.coverage_ratio) ? `${Math.round(data.coverage_ratio * 100)}% of clip aligned` : faint("Not assessed")}
      </p>

      <Divider />

      {/* B */}
      <Eyebrow>Source</Eyebrow>
      {src ? (
        <div className="mt-4">
          <h3 className="font-display text-[24px] font-medium leading-snug tracking-[-0.02em]">{src.title ?? "Untitled recording"}</h3>
          <div className="mt-5"><Rows rows={[["Publisher", src.publisher ?? faint()], ["Published", ymd(src.published_at)], ["Duration", secs(src.duration_seconds)]]} /></div>
          {src.url && <a href={src.url} target="_blank" rel="noreferrer" className={`${ghost} mt-6`}>Open original ↗</a>}
        </div>
      ) : (
        <div className="hatch mt-4 rounded-sm">
          <div className="bg-panel px-6 py-12 text-center">
            <Eyebrow>No source found</Eyebrow>
            <p className="mt-3 text-ink-muted">We could not locate a public recording of this excerpt.</p>
          </div>
        </div>
      )}

      <Divider />

      {/* C */}
      <Eyebrow>Matched passages · <span className="text-ink">{matches.length}</span></Eyebrow>
      <div className="mt-5 space-y-3">
        {matches.length === 0 ? (
          <Box p="p-4"><p className="text-ink-muted">No passages matched.</p></Box>
        ) : matches.map((m, i) => (
          <Box key={m.match_id ?? i} p="p-4" className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <div className="space-y-1 font-mono text-[12px]">
              <div><span className="text-ink-muted">CLIP · </span>{range(m.clip_start_seconds, m.clip_end_seconds)}</div>
              <div><span className="text-ink-muted">SOURCE · </span>{range(m.source_start_seconds, m.source_end_seconds)}</div>
            </div>
            <div>
              <p className="text-[15px] italic text-ink">“{m.quote}”</p>
              {m.evidence?.[0]?.description && <p className="mt-2 font-mono text-[11px] text-ink-muted">EVIDENCE · {m.evidence[0].description}</p>}
            </div>
          </Box>
        ))}
      </div>

      <div className="mt-10 border-t border-line pt-8">
        <ConfidenceChip {...(data.match_confidence ?? {})} label="Match confidence" />
      </div>
    </div>
  );
}

/* ---------- FactCheckCard ---------- */

const VERDICT: Record<string, [string, string]> = {
  supported: ["bg-chip-high-bg text-chip-high-fg", "Supported"],
  contradicted: ["bg-chip-low-bg text-chip-low-fg", "Contradicted"],
  unclear: ["bg-chip-med-bg text-chip-med-fg", "Unclear"],
};

export function FactCheckCard({ data }: { data: Any }) {
  if (!data) return <EmptyMono>Fact check was not assessed.</EmptyMono>;
  const claims: Any[] = Array.isArray(data.claims) ? data.claims : [];
  return (
    <div>
      <div className="flex items-center gap-4">
        <Rows rows={[["Claims checked", claims.length]]} />
        {data.overall_assessment === "mixed" && <span className="rounded-[4px] border border-line px-2 py-0.5 font-mono text-[11px] tracking-[0.08em] text-ink-muted">MIXED</span>}
      </div>
      <div className="mt-6 space-y-4">
        {claims.length === 0 ? <EmptyMono>No checkable claims were identified.</EmptyMono> : claims.map((c, i) => {
          const [tone, text] = VERDICT[c.verdict] ?? NA;
          const sources: Any[] = Array.isArray(c.sources) ? c.sources : [];
          return (
            <Box key={c.claim_id ?? i}>
              <p className="text-[16px] font-medium text-ink">{c.claim}</p>
              <div className="mt-3"><Pill tone={tone}>{text}</Pill></div>
              {c.explanation && <p className="mt-3 text-[14px] leading-[1.6] text-ink-muted">{c.explanation}</p>}
              <div className="mt-4">
                <Eyebrow>Sources</Eyebrow>
                {sources.length === 0 ? <p className="mt-2 font-mono text-[12px] text-ink-faint">No sources cited.</p> : (
                  <ul className="mt-2 space-y-1">
                    {sources.map((s, j) => (
                      <li key={j}><a href={s.url} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-ink hover:underline">{s.title ?? s.url} ↗</a></li>
                    ))}
                  </ul>
                )}
              </div>
            </Box>
          );
        })}
      </div>
      <div className="mt-10 border-t border-line pt-8"><ConfidenceChip {...(data.confidence ?? {})} /></div>
    </div>
  );
}

/* ---------- ParallelsCard ---------- */

export function ParallelsCard({ data }: { data: Any }) {
  if (!data) return <EmptyMono>Historical parallels were not assessed.</EmptyMono>;
  const list: Any[] = Array.isArray(data.parallels) ? data.parallels : [];
  return (
    <div>
      <p className="text-[14px] italic text-ink-muted">Historical parallels describe rhetorical similarity only. They do not establish intent, coordination, or plagiarism.</p>
      <div className="mt-6 space-y-4">
        {list.length === 0 ? <EmptyMono>No historical parallels were identified.</EmptyMono> : list.map((p, i) => {
          const h = p.historical_match ?? {};
          return (
            <Box key={p.parallel_id ?? i}>
              <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                <Eyebrow className="pt-1">Statement</Eyebrow>
                <p className="italic text-ink">“{p.statement}”</p>
              </div>
              <div className="my-5 h-px bg-line" />
              <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                <Eyebrow className="pt-1">Echoes · {h.figure ?? "Unknown"} · {h.year ?? "—"}</Eyebrow>
                <div>
                  <p className="italic text-ink">“{h.quote}”</p>
                  {h.context && <p className="mt-2 font-mono text-[12px] text-ink-muted">{h.context}</p>}
                  {h.source_url && <a href={h.source_url} target="_blank" rel="noreferrer" className={`${ghost} mt-4 h-8 px-3`}>Read original ↗</a>}
                </div>
              </div>
              {p.explanation && <p className="mt-5 text-[14px] leading-[1.6] text-ink-muted">{p.explanation}</p>}
              <div className="mt-5"><ConfidenceChip {...(p.confidence ?? {})} /></div>
            </Box>
          );
        })}
      </div>
      <div className="mt-10 border-t border-line pt-8"><ConfidenceChip {...(data.confidence ?? {})} label="Overall confidence" /></div>
    </div>
  );
}

/* ---------- ManipulationCard ---------- */

export function ManipulationCard({ data }: { data: Any }) {
  if (!data) return <EmptyMono>Manipulation check was not assessed.</EmptyMono>;
  const signals: Any[] = Array.isArray(data.signals) ? data.signals : [];
  const df = data.deepfake_assessment;
  return (
    <div className="space-y-8">
      <div className="rounded-md border border-line border-l-[3px] border-l-accent-red bg-elevated p-5">
        <Eyebrow>Overall</Eyebrow>
        <p className="mt-3 text-[16px] text-ink">{data.overall_explanation ?? faint()}</p>
        <div className="mt-5"><ConfidenceChip {...(data.confidence ?? {})} /></div>
      </div>

      <div>
        <Eyebrow>Signals · <span className="text-ink">{signals.length}</span></Eyebrow>
        <div className="mt-5 space-y-3">
          {signals.length === 0 ? <EmptyMono>No manipulation signals were detected.</EmptyMono> : signals.map((s, i) => (
            <Box key={s.signal_id ?? i} p="p-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink">{String(s.type ?? "signal").replace(/_/g, " ")}</span>
                <span className="font-mono text-[12px] text-ink-muted">{ts(s.at_seconds)}</span>
              </div>
              {s.explanation && <p className="mt-2 text-[14px] leading-[1.6] text-ink-muted">{s.explanation}</p>}
              <div className="mt-4"><ConfidenceChip {...(s.confidence ?? {})} /></div>
            </Box>
          ))}
        </div>
      </div>

      {df?.status === "not_assessed" && (
        <div className="rounded-md bg-chip-na-bg p-5">
          <Eyebrow className="text-ink-muted">Deepfake assessment</Eyebrow>
          <p className="mt-3 italic text-ink-muted">{df.reason}</p>
        </div>
      )}
    </div>
  );
}
