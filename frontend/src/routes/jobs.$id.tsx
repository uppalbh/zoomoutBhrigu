import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Wordmark } from "@/components/site/Nav";
import { getJob, QuantroApiError, type Job } from "@/lib/api";

export const Route = createFileRoute("/jobs/$id")({
  head: () => ({
    meta: [
      { title: "Analysis in progress — Zoomout" },
      { name: "description", content: "Tracing your excerpt back to the original recording." },
      { property: "og:title", content: "Analysis in progress — Zoomout" },
      { property: "og:description", content: "Tracing your excerpt back to the original recording." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobPage,
});

const STAGES = [
  ["retrieving", "Retrieving media"],
  ["transcribing", "Transcribing audio"],
  ["searching", "Searching for source"],
  ["aligning", "Aligning passages"],
  ["fact_checking", "Fact-checking claims"],
  ["finding_parallels", "Finding historical parallels"],
  ["checking_manipulation", "Checking for manipulation"],
  ["building_report", "Building report"],
  ["notifying", "Notifying"],
] as const;

function JobPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [err, setErr] = useState<QuantroApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      try {
        const j = await getJob(id);
        if (cancelled) return;
        setJob(j);
        if (j.status === "done" && j.report_id) {
          navigate({ to: "/reports/$id", params: { id: j.report_id } });
          return;
        }
        if (j.status === "failed") return;
        timer = setTimeout(tick, 2000);
      } catch (e) {
        if (cancelled) return;
        setErr(e instanceof QuantroApiError ? e : new QuantroApiError(0, "unknown", "unknown", "Unknown error"));
      }
    };
    tick();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [id, navigate]);

  const view = err ? { status: "failed", stage: null, progress: 0, error: { message: err.message, stage: err.stage, code: err.code } } : job;
  return <JobView id={id} job={view} />;
}

type JobViewData = { status: string; stage?: string | null; progress?: number; error?: { message?: string; stage?: string; code?: string } | null };

function JobView({ id, job }: { id: string; job: JobViewData | null }) {
  const failed = job?.status === "failed";
  const activeIdx = Math.max(0, STAGES.findIndex(([k]) => k === (job?.stage ?? job?.status)));
  const pct = Math.round(job?.progress ?? (job ? (activeIdx / STAGES.length) * 100 : 0));

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[640px] px-6 py-6"><Wordmark small /></div>
      <main className="mx-auto flex max-w-[640px] flex-col justify-center px-6 py-12">
        <span className="red-bar mb-4" />
        <div className="eyebrow">Analysis in progress</div>
        <h1 className="mt-3 font-display text-[clamp(40px,6vw,56px)] leading-none tracking-tight">Tracing your excerpt.</h1>
        <div className="mt-4 font-mono text-xs text-ink-faint">JOB · {id}</div>

        {failed ? (
          <div className="mt-10 rounded-md border border-line bg-elevated p-6">
            <div className="eyebrow text-chip-low-fg">Analysis failed</div>
            <h2 className="mt-3 font-display text-3xl">{job?.error?.message ?? "Something went wrong."}</h2>
            <div className="mt-3 font-mono text-xs text-ink-muted">
              STAGE · {job?.error?.stage ?? "unknown"} · CODE · {job?.error?.code ?? "unknown"}
            </div>
            <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-md bg-ink px-5 text-sm text-background">Try again</Link>
          </div>
        ) : (
          <>
            <ul className="mt-10 divide-y divide-line border-y border-line">
              {STAGES.map(([key, label], i) => {
                const state = !job ? "pending" : job.status === "done" || i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
                return (
                  <li key={key} className="grid grid-cols-[20px_1fr_auto] items-center gap-4 py-3.5">
                    <span className="grid h-5 w-5 place-items-center">
                      {state === "pending" && <span className="h-2.5 w-2.5 rounded-full border border-ink-faint" />}
                      {state === "active" && <span className="pulse-red h-2.5 w-2.5 bg-accent-red" />}
                      {state === "done" && <Check className="h-4 w-4" />}
                    </span>
                    <span className={state === "pending" ? "text-ink-faint" : "text-ink"}>{label}</span>
                    <span className={`font-mono text-[11px] tracking-[0.1em] ${state === "active" ? "text-accent-red" : "text-ink-muted"}`}>
                      {state === "active" ? "IN PROGRESS" : state === "done" ? "DONE" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8">
              <div className="mb-2 text-right font-mono text-xs">{pct}%</div>
              <div className="h-[2px] w-full bg-line">
                <div className="h-full bg-ink transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

