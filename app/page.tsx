"use client";

import { FormEvent, useMemo, useState } from "react";

type FakeResult = {
  title: string;
  explanation: string;
  bullets: string[];
  toyExample: string;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 text-center">
          <p className="mb-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 shadow-sm ring-1 ring-indigo-100">
            Explain My Repo Like I&apos;m Five
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Turn complex codebases into simple stories
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Paste any GitHub repo URL and get a playful, kid-friendly explanation.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700" htmlFor="repo">
              GitHub repository URL
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="repo"
                name="repo"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-indigo-200 transition focus:border-indigo-400 focus:ring"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-300/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Analyzing..." : "Explain it"}
              </button>
            </div>
          </form>

          {error ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </section>

        {isLoading ? (
          <section className="mt-6 rounded-2xl border border-indigo-200 bg-white/90 p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-sm font-medium text-indigo-700">
                Our tiny AI teacher is reading your repo...
              </p>
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200" />
            </div>
          </section>
        ) : null}

        {result ? (
          <section className="mt-6 space-y-4 rounded-2xl border border-emerald-200 bg-white/95 p-6 shadow-lg">
            <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Fake AI Explanation
            </p>
            <h2 className="text-2xl font-bold text-slate-900">{result.title}</h2>
            <p className="text-slate-700">{result.explanation}</p>

            <ul className="space-y-2">
              {result.bullets.map((item) => (
                <li
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  key={item}
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Toy example</p>
              <p className="mt-1 text-sm text-indigo-900">{result.toyExample}</p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
