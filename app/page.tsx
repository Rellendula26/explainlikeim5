"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnalyzeRepoResponse } from "../lib/types";

const loadingSteps = [
  "Connecting to GitHub",
  "Reading README",
  "Mapping architecture",
  "Summarizing code flow",
  "Building ELI5 explanation"
];

const liveUpdates = [
  "Parsing repository structure…",
  "Inspecting dependency graph…",
  "Detecting architectural patterns…",
  "Reading documentation signals…",
  "Building recruiter summary…",
  "Generating ELI5 analogy…"
];

const EXAMPLE_REPOS = [
  "https://github.com/vercel/next.js",
  "https://github.com/facebook/react",
  "https://github.com/tailwindlabs/tailwindcss"
];

function parseRepoInput(input: string) {
  const cleaned = input.trim().replace(/\.git$/, "");
  if (!cleaned) return null;

  const pair = cleaned.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (pair) return { owner: pair[1], repo: pair[2] };

  const normalized = cleaned.startsWith("http") ? cleaned : `https://${cleaned}`;
  try {
    const parsed = new URL(normalized);
    if (!parsed.hostname.includes("github.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeRepoResponse | null>(null);
  const [error, setError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [analysisMode, setAnalysisMode] = useState<"ai" | "heuristic" | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [stream, setStream] = useState<string[]>([]);

  const repoName = useMemo(() => {
    const parsed = parseRepoInput(repoUrl);
    return parsed ? `${parsed.owner}/${parsed.repo}` : "";
  }, [repoUrl]);

  useEffect(() => {
    if (!result) return;
    const start = performance.now();
    const from = 0;
    const to = result.architectureScore;
    const durationMs = 900;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result]);

  useEffect(() => {
    const button = ctaRef.current;
    if (!button) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const handleMove = (event: PointerEvent) => {
      const rect = button.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const x = Math.max(-14, Math.min(14, dx * 0.12));
      const y = Math.max(-10, Math.min(10, dy * 0.12));
      button.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const handleLeave = () => {
      button.style.transform = "translate3d(0,0,0)";
    };

    button.addEventListener("pointermove", handleMove);
    button.addEventListener("pointerleave", handleLeave);
    return () => {
      button.removeEventListener("pointermove", handleMove);
      button.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) return;

    const timer = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 900);

    return () => window.clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) return;
    setStream([]);
    let i = 0;
    const timer = window.setInterval(() => {
      setStream((prev) => {
        const next = [...prev, liveUpdates[i % liveUpdates.length]];
        return next.slice(-7);
      });
      i += 1;
    }, 520);
    return () => window.clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    const selector = "[data-tilt='card']";
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!els.length) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const onMove = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const card = target?.closest<HTMLElement>(selector);
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * -7;
      const ry = (px - 0.5) * 9;
      card.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      card.style.borderColor = "rgba(125, 211, 252, 0.45)";
    };

    const onLeave = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const card = target?.closest<HTMLElement>(selector);
      if (!card) return;
      card.style.transform = "";
      card.style.borderColor = "";
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave, { passive: true, capture: true } as any);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave, true as any);
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult(null);
    setStepIndex(0);
    setAnalysisMode(null);

    const parsed = parseRepoInput(repoUrl);
    if (!parsed) {
      setError("Use a valid public GitHub repo: owner/repo, github.com/owner/repo, or https://github.com/owner/repo");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl })
      });

      const modeHeader = response.headers.get("x-analysis-mode");
      setAnalysisMode(modeHeader === "ai" || modeHeader === "heuristic" ? modeHeader : null);

      const payload = (await response.json()) as AnalyzeRepoResponse | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Failed to analyze repository.");
      }
      setResult(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-slate-100 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-blob-slow absolute -left-24 top-10 h-72 w-72 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="animate-blob absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="animate-blob-delayed absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl">
        <nav className="fade-up mb-10 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 p-[1px]">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950 text-sm font-bold text-cyan-200">
                AI
              </div>
            </div>
            <p className="text-sm font-semibold tracking-wide text-slate-100">Explain My Repo Like I&apos;m Five</p>
          </div>
          <p className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
            Mock AI Demo
          </p>
        </nav>

        <header className="fade-up mb-10 text-center fade-delay-1">
          <p className="animate-float mb-4 inline-flex rounded-full border border-violet-300/35 bg-violet-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-100 backdrop-blur">
            AI Developer Experience
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Ship understanding faster with
            <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
              intelligent repo storytelling
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
            Enter a GitHub repository and get a sleek AI-style breakdown: architecture quality, code flow, and ELI5 story mode.
          </p>
        </header>

        <section className="fade-up rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl fade-delay-2 sm:p-7">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200"
              htmlFor="repo"
            >
              <span className="text-base leading-none">#</span>
              GitHub Repo URL
            </label>
            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                id="repo"
                name="repo"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                placeholder="https://github.com/owner/repo or owner/repo"
                data-cursor="input"
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 px-5 py-3.5 text-sm text-slate-100 shadow-inner shadow-black/20 outline-none transition placeholder:text-slate-400 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-400/40"
              />
              <div className="relative">
                <span className="animate-glow-pulse pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/40 via-violet-500/40 to-fuchsia-500/40 blur-md" />
                <button
                  ref={ctaRef}
                  type="submit"
                  disabled={isLoading}
                  data-cursor="button"
                  className="relative rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-900/40 transition hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Analyzing..." : "Explain this repo"}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {EXAMPLE_REPOS.map((example) => (
              <button
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-300/50 hover:text-cyan-100"
                key={example}
                onClick={() => setRepoUrl(example)}
                type="button"
              >
                {example.replace("https://github.com/", "")}
              </button>
            ))}
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          {!result && !isLoading ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Architecture Score", value: "Evidence-backed", tone: "from-cyan-400/30 to-cyan-700/20" },
                { title: "Repo Personality", value: "Founder-ready framing", tone: "from-violet-400/30 to-violet-700/20" },
                { title: "ELI5 Story Mode", value: "Concrete analogies", tone: "from-fuchsia-400/30 to-fuchsia-700/20" },
                { title: "Code Flow", value: "Real file analysis", tone: "from-emerald-400/30 to-emerald-700/20" }
              ].map((card) => (
                <article
                  data-cursor="card"
                  className={`hover-lift rounded-2xl border border-white/10 bg-gradient-to-br ${card.tone} p-4 backdrop-blur`}
                  key={card.title}
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-300">{card.title}</p>
                  <p className="mt-2 text-base font-semibold text-white">{card.value}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        {isLoading ? (
          <section className="fade-up mt-6 grid gap-4 lg:grid-cols-5 fade-delay-3">
            <div className="rounded-3xl border border-cyan-200/20 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/50 backdrop-blur lg:col-span-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">AI Analysis Stream</p>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
                  thinking
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 font-mono text-xs text-slate-200">
                <div className="space-y-2">
                  {stream.length ? (
                    stream.map((line, idx) => (
                      <div className="flex gap-3" key={`${line}-${idx}`}>
                        <span className="text-slate-500">$</span>
                        <span className="text-slate-200">{line}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400">Booting analysis…</div>
                  )}
                </div>
                <div className="mt-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-violet-300/80" />
                  <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-300/80 [animation-delay:120ms]" />
                  <div className="h-2 w-2 animate-pulse rounded-full bg-fuchsia-300/80 [animation-delay:240ms]" />
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full animate-pulse rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 transition-all duration-700"
                  style={{ width: `${((stepIndex + 1) / loadingSteps.length) * 100}%` }}
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {loadingSteps.map((step, index) => (
                  <div className="flex items-center gap-3" key={step}>
                    <div
                      className={`relative flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
                        index <= stepIndex
                          ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100"
                          : "border-slate-600/60 bg-slate-700/30 text-slate-300"
                      }`}
                    >
                      {index + 1}
                      {index === stepIndex ? (
                        <span className="absolute inset-0 animate-ping rounded-full border border-cyan-300/40" />
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-200">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Report Preview</p>
              <div className="mt-4 space-y-3">
                <div className="h-5 w-2/3 animate-pulse rounded-lg bg-white/10" />
                <div className="h-3 w-full animate-pulse rounded-lg bg-white/10" />
                <div className="h-3 w-5/6 animate-pulse rounded-lg bg-white/10" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
                  <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
                  <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
                  <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {result ? (
          <section className="fade-up mt-6 rounded-3xl border border-white/15 bg-slate-900/75 p-6 shadow-2xl shadow-black/40 backdrop-blur fade-delay-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
                AI Repo Intelligence Report
              </p>
              <p className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Source: {result.repoName || repoName || "unknown"}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  analysisMode === "ai"
                    ? "border-fuchsia-300/30 bg-fuchsia-400/10 text-fuchsia-100"
                    : "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
                }`}
              >
                {analysisMode === "ai" ? "AI Mode" : "Free Heuristic Mode"}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-300">{result.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.techStack.map((tech) => (
                  <span className="rounded-full border border-cyan-200/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100" key={tech}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <article
                data-cursor="card"
                data-tilt="card"
                className="hover-lift rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-5 [transform-style:preserve-3d]"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">Architecture Score</p>
                <p className="mt-2 text-3xl font-bold text-white tabular-nums">{displayScore}</p>
                <p className="mt-2 text-sm text-slate-300">{result.whatItDoes}</p>
              </article>
              <article
                data-cursor="card"
                data-tilt="card"
                className="hover-lift rounded-2xl border border-violet-300/20 bg-violet-500/10 p-5 [transform-style:preserve-3d]"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-violet-200">Repo Personality</p>
                <p className="mt-2 text-xl font-semibold text-white">{result.repoPersonality}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {result.architectureBreakdown.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </article>
              <article
                data-cursor="card"
                data-tilt="card"
                className="hover-lift rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-5 [transform-style:preserve-3d]"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-fuchsia-200">ELI5 Story Mode</p>
                <p className="mt-2 text-sm text-slate-100">{result.eli5Story}</p>
              </article>
              <article
                data-cursor="card"
                data-tilt="card"
                className="hover-lift rounded-2xl border border-blue-300/20 bg-blue-500/10 p-5 [transform-style:preserve-3d]"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-blue-200">Code Flow</p>
                <ul className="mt-3 space-y-2">
                  {result.codeFlow.map((item) => (
                    <li className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200" key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article
                data-cursor="card"
                data-tilt="card"
                className="hover-lift rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-5 [transform-style:preserve-3d]"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-emerald-200">What&apos;s Impressive</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {result.impressiveParts.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article
                data-cursor="card"
                data-tilt="card"
                className="hover-lift rounded-2xl border border-amber-300/20 bg-amber-500/10 p-5 [transform-style:preserve-3d]"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-amber-200">Suggested Improvements</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {result.suggestedImprovements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <p className="font-semibold text-white">Startup / Resume Pitch</p>
                <p className="mt-1">{result.startupResumePitch}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <p className="font-semibold text-white">Interview Talking Points</p>
                <ul className="mt-2 space-y-1">
                  {result.interviewTalkingPoints.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <p className="font-semibold text-white">Source Files Analyzed</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.sourceFilesUsed.map((file) => (
                  <span className="rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1 text-xs text-slate-300" key={file}>
                    {file}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
