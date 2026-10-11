import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Footer, Nav } from "@/components/site/Nav";
import { DetailList } from "@/components/site/Detail";
import { PHOTON_NUMBER, runAnalysis, QuantroApiError } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zoomout — The full exchange" },
      { name: "description", content: "Find the original recording of a political excerpt and review what came before and after." },
      { property: "og:title", content: "Zoomout — The full exchange" },
      { property: "og:description", content: "Find the original recording of a political excerpt and review what came before and after." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <How />
      <Algorithm />
      <TryIt />
      <Footer />
    </div>
  );
}

const W = "mx-auto max-w-[1480px] px-6 md:px-9";

function Hero() {
  return (
    <section className={`${W} grid items-center gap-10 py-16 min-[900px]:grid-cols-[1fr_1.05fr] min-[900px]:py-24`}>
      <div className="order-2 fade-up min-[900px]:order-1">
        <h1 className="font-display text-[clamp(56px,9vw,128px)] font-medium leading-[0.92] tracking-[-0.055em]">
          The full exchange<span className="text-accent-red">.</span>
        </h1>
        <p className="mt-10 max-w-[640px] text-[clamp(18px,1.6vw,24px)] leading-[1.6] text-ink-muted">
          Zoomout helps you examine excerpts from <strong className="font-semibold text-accent-red">political debates and speeches</strong>. Find the original recording, map the excerpt to it, and review what came before and after.
        </p>
        <div className="mt-10 flex gap-4">
          <a href="#try" className="inline-flex h-[66px] items-center rounded-md bg-ink px-7 text-lg font-semibold text-background">Try now</a>
          <a href="#how" className="inline-flex h-[66px] items-center rounded-md border border-line px-7 text-lg font-semibold hover:border-ink">How it works</a>
        </div>
        <p className="mt-10 max-w-[600px] text-ink-muted">Text a public debate or speech video link to our verification number to review its context.</p>
        {PHOTON_NUMBER && (
          <a href={`sms:${PHOTON_NUMBER}`} className="mt-2 inline-block font-mono text-sm text-ink-muted hover:text-ink">
            or text us at {PHOTON_NUMBER} <span className="text-accent-red">→</span>
          </a>
        )}
      </div>
      <div className="order-1 min-[900px]:order-2"><HeroArt /></div>
    </section>
  );
}

const GLYPHS = "x%*+@#·";
function HeroArt() {
  const n = 120;
  const ring = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 46 + ((i * 7) % 5);
    return { x: 50 + Math.cos(a) * r * 0.62, y: 48 + Math.sin(a) * r, g: GLYPHS[(i * 5) % GLYPHS.length], red: i % 3 === 0 };
  });
  const cards = [
    { label: "Excerpt 0:15–0:43", left: "2%", top: "34%", rot: -8 },
    { label: "Full recording 1:07–1:35", left: "22%", top: "30%", rot: -8 },
    { label: "Excerpt 0:15–0:43", left: "42%", top: "22%", rot: -8 },
    { label: "Full recording 1:07–1:35", left: "62%", top: "18%", rot: -8 },
  ];
  return (
    <div className="relative mx-auto aspect-[1.25] w-full max-w-[720px]">
      <div className="absolute inset-0 font-mono text-[11px]">
        {ring.map((p, i) => (
          <span key={i} className={`absolute ${p.red ? "text-accent-red" : "text-ink"} opacity-80`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>{p.g}</span>
        ))}
      </div>
      {cards.map((c, i) => (
        <div key={i} className="absolute w-[24%]" style={{ left: c.left, top: c.top, transform: `rotate(${c.rot}deg)` }}>
          <div className="mb-2 whitespace-nowrap text-[12px] text-ink-muted">• {c.label}</div>
          <div className="card-stripe aspect-[9/14] rounded-md border border-line shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--ink)_25%,transparent)]" />
        </div>
      ))}
    </div>
  );
}

function SectionHead({ title, under, sub }: { title: string; under: string; sub: string }) {
  return (
    <>
      <h2 className="font-display text-[clamp(40px,5vw,76px)] font-medium leading-[1] tracking-[-0.05em]">
        {title} <span className="red-under">{under}</span>.
      </h2>
      <p className="mt-6 max-w-[860px] text-[clamp(17px,1.4vw,21px)] text-ink-muted">{sub}</p>
    </>
  );
}

function How() {
  return (
    <section id="how" className={`${W} py-24`}>
      <SectionHead title="Putting an excerpt in" under="context" sub="A short excerpt can leave out the surrounding exchange. Compare it with the full debate or speech and review the context." />
      <div className="mt-14 grid gap-8 md:grid-cols-3">
        <Step n="01" title="Share an excerpt." body="We transcribe the submitted excerpt and identify keyframes that can help locate the full recording.">
          <div className="flex items-center gap-8">
            <div className="relative h-44 w-[88px] shrink-0 rounded-sm border border-line bg-gradient-to-b from-background to-panel">
              <span className="absolute inset-x-0 top-[30%] h-[2px] bg-accent-red" />
            </div>
            <DetailList rows={[["Excerpt", "0:58"], ["Transcript", "7 sentences"], ["Keyframes", "4 detected"], ["Resolution", "1080×1920"]]} />
          </div>
        </Step>
        <Step n="02" title="Find the recording." body="We search for the original debate or speech recording, then check candidate matches against the excerpt.">
          <div className="flex items-center gap-8">
            <div className="grid h-36 w-36 shrink-0 place-items-center rounded-full bg-chip-low-bg/60">
              <div className="grid h-[110px] w-[110px] place-items-center rounded-full border border-accent-red/40 bg-background">
                <Search className="h-7 w-7 text-accent-red" strokeWidth={1.75} />
              </div>
            </div>
            <DetailList rows={[["Candidate", "matched source"], ["Confidence", "High"], ["Basis", "transcript alignment"]]} />
          </div>
        </Step>
        <Step n="03" title="Review the full exchange." body="We map the excerpt to the full recording and show nearby speech, approximate timestamps, and the limits of the match.">
          <div className="w-full">
            <div className="grid grid-cols-[64px_1fr] items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.12em] text-ink-muted">EXCERPT</span>
              <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => <div key={i} className="h-7 rounded-sm bg-ink" />)}</div>
              <span className="mt-8 font-mono text-[10px] leading-tight tracking-[0.12em] text-ink-muted">FULL<br />RECORDING</span>
              <div className="mt-8 grid grid-cols-4 gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-7 rounded-sm bg-accent-red" />)}</div>
            </div>
            <div className="mt-6 grid grid-cols-3 border-t border-line pt-4 text-[11px] text-ink-muted">
              <div>Matched passages<div className="font-mono">3</div></div>
              <div>Context gaps<div className="font-mono">2</div></div>
              <div>Context window<div className="font-mono">48 seconds</div></div>
            </div>
          </div>
        </Step>
      </div>
    </section>
  );
}

function Step({ n, title, body, children }: { n: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="hatch rounded-sm">
        <div className="flex min-h-[340px] items-center justify-center bg-panel px-8 py-10">{children}</div>
      </div>
      <div className="mt-9 font-mono text-[13px] tracking-[0.14em] text-ink-muted">STEP {n}</div>
      <h3 className="mt-5 font-display text-[32px] font-medium tracking-[-0.03em]">{title}</h3>
      <p className="mt-5 text-[17px] leading-[1.7] text-ink-muted">{body}</p>
    </div>
  );
}

function Algorithm() {
  const rows = [5, 4, 5, 5];
  return (
    <section id="algorithm" className={`${W} py-24`}>
      <SectionHead title="How Zoomout traces an excerpt to its" under="recording" sub="We align spoken passages to the full recording and show the surrounding exchange for review." />
      <div className="hatch mt-14 rounded-sm">
        <div className="relative flex h-[520px] items-center justify-center bg-panel">
          <span className="absolute left-[32%] top-[42%] h-9 w-9 rounded-md bg-accent-red" />
          <div className="space-y-2.5">
            {rows.map((c, r) => (
              <div key={r} className="flex gap-2.5">{Array.from({ length: c }).map((_, i) => <span key={i} className="h-9 w-9 rounded-md bg-ink" />)}</div>
            ))}
          </div>
          <span className="absolute left-[60%] top-[56%] h-9 w-9 rounded-md bg-accent-red" />
          <span className="absolute bottom-16 right-28 font-mono text-[12px] tracking-[0.08em] text-ink-muted">SOURCE ALIGNMENT · 2/5</span>
        </div>
      </div>
      <p className="mt-10 text-center text-ink-muted">Candidate source found.</p>
    </section>
  );
}

function TryIt() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { job_id } = await runAnalysis(url.trim());
      navigate({ to: "/jobs/$id", params: { id: String(job_id) } });
    } catch (err) {
      setError(err instanceof QuantroApiError ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <section id="try" className="border-t border-line">
      <div className="mx-auto max-w-[720px] px-6 py-24 text-center">
        <div className="eyebrow">Submit a clip</div>
        <h2 className="mt-4 font-display text-[clamp(40px,5vw,64px)] font-medium leading-none tracking-[-0.05em]">Paste an excerpt <span className="red-under">link</span>.</h2>
        <p className="mt-5 text-lg text-ink-muted">We'll find the original recording, map the excerpt to it, and show you what changed.</p>
        <form onSubmit={submit} className="mt-10 text-left">
          {error && <p className="mb-3 text-sm text-chip-low-fg">{error}</p>}
          <div className="flex gap-2">
            <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
              className={`h-14 flex-1 rounded-md border bg-background px-4 outline-none focus:border-ink ${error ? "border-accent-red" : "border-line"}`} />
            <button disabled={loading} className="slash-hover h-14 rounded-md bg-ink px-7 font-semibold text-background disabled:opacity-60">
              {loading ? "Sending…" : "Analyze"}
            </button>
          </div>
          <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">Supported · archive.org · direct mp4 · mp3</div>
        </form>
      </div>
    </section>
  );
}
