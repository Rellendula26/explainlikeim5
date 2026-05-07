"use client";

import { FormEvent, useMemo, useState } from "react";

type FakeResult = {
  title: string;
  explanation: string;
  bullets: string[];
  toyExample: string;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const loadingSteps = [
  "Scanning repo structure",
  "Finding important files",
  "Translating code into kid language"
];

const getRepoName = (url: string) => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1].replace(".git", "")}`;
    }
  } catch {
    return "";
  }
  return "";
};

const buildFakeResult = (repo: string): FakeResult => ({
  title: `What "${repo || "this repo"}" does`,
  explanation:
    "Imagine a robot helper that follows step-by-step instructions. This repo is the instruction book that tells the robot exactly what to do so a useful app can come to life.",
  bullets: [
    "It has building blocks (files) where each block does one job.",
    "It has rules for how those blocks talk to each other.",
    "It includes setup notes so other people can run it too."
  ],
  toyExample:
    "Like a LEGO city guide: one page for roads, one page for houses, and one page for traffic lights. Put them together and the city works."
});

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FakeResult | null>(null);
  const [error, setError] = useState("");

  const repoName = useMemo(() => getRepoName(repoUrl), [repoUrl]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!repoUrl.trim()) {
      setError("Please paste a GitHub repository URL.");
      return;
    }

    if (!repoUrl.includes("github.com")) {
      setError("That does not look like a GitHub URL.");
      return;
    }

    setIsLoading(true);
    await wait(1800);
    setResult(buildFakeResult(repoName));
    setIsLoading(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-blob-slow absolute -left-24 top-10 h-72 w-72 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="animate-blob absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="animate-blob-delayed absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl">
        <header className="mb-10 text-center">
          <p className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200 backdrop-blur">
            Explain My Repo Like I&apos;m Five
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your AI repo strategist with
            <span className="block bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              kid-friendly storytelling mode
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
            Drop in any GitHub URL and get a premium-style repo breakdown that feels like a modern AI developer dashboard.
          </p>
        </header>

        <section className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7">
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
                placeholder="https://github.com/owner/repo"
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 px-5 py-3.5 text-sm text-slate-100 shadow-inner shadow-black/20 outline-none transition placeholder:text-slate-400 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-400/40"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-900/40 transition hover:scale-[1.02] hover:shadow-fuchsia-700/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Analyzing..." : "Explain this repo"}
              </button>
            </div>
          </form>

          {error ? (
            <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          {!result && !isLoading ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Architecture Score", value: "89 / 100", tone: "from-cyan-400/30 to-cyan-700/20" },
                { title: "Repo Personality", value: "Curious Builder", tone: "from-violet-400/30 to-violet-700/20" },
                { title: "ELI5 Story Mode", value: "Enabled", tone: "from-fuchsia-400/30 to-fuchsia-700/20" },
                { title: "Code Flow", value: "Clean and Linear", tone: "from-emerald-400/30 to-emerald-700/20" }
              ].map((card) => (
                <article
                  className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.tone} p-4 backdrop-blur`}
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
          <section className="mt-6 rounded-3xl border border-cyan-200/20 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/50 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">AI Analysis Pipeline</p>
            <div className="mt-4 space-y-4">
              {loadingSteps.map((step, index) => (
                <div className="flex items-center gap-3" key={step}>
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/50 bg-cyan-400/15 text-xs font-bold text-cyan-100">
                    {index + 1}
                    <span className="absolute inset-0 animate-ping rounded-full border border-cyan-300/40" />
                  </div>
                  <p className="text-sm text-slate-200">{step}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400" />
            </div>
          </section>
        ) : null}

        {result ? (
          <section className="mt-6 rounded-3xl border border-white/15 bg-slate-900/75 p-6 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
                Mock AI Report
              </p>
              <p className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Source: {repoName || "demo repo"}
              </p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4 lg:col-span-2">
                <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">ELI5 Story Mode</p>
                <h2 className="mt-2 text-2xl font-bold text-white">{result.title}</h2>
                <p className="mt-2 text-sm text-slate-200">{result.explanation}</p>
              </article>
              <article className="rounded-2xl border border-violet-300/20 bg-violet-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-violet-200">Repo Personality</p>
                <p className="mt-2 text-lg font-semibold text-white">Patient Architect</p>
                <p className="mt-2 text-sm text-slate-300">
                  Organized modules, clear intent, and steady growth paths.
                </p>
              </article>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Architecture Score", value: "89" },
                { label: "Complexity", value: "Low-Medium" },
                { label: "Readability", value: "High" },
                { label: "Onboarding", value: "Friendly" }
              ].map((metric) => (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4" key={metric.label}>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-300">{metric.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-fuchsia-200">Code Flow</p>
                <ul className="mt-3 space-y-2">
                  {result.bullets.map((item) => (
                    <li
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                      key={item}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-amber-200">Toy Analogy Simulator</p>
                <p className="mt-3 text-sm text-slate-200">{result.toyExample}</p>
                <div className="mt-4 rounded-xl border border-amber-200/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                  No live APIs yet. This is a visual mock dashboard using local fake data.
                </div>
              </article>
            </div>
          </section> 
        ) : null}
      </div>
    </main>
  );
}
