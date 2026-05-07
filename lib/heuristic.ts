import { AnalyzeRepoResponse, RepoAnalysisContext } from "./types";

function firstMeaningfulParagraph(markdown: string): string | null {
  const lines = markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim());

  const paragraph: string[] = [];
  for (const line of lines) {
    if (!line) {
      if (paragraph.join(" ").length > 80) break;
      if (paragraph.length) paragraph.length = 0;
      continue;
    }
    if (line.startsWith("#")) continue;
    if (line.startsWith(">")) continue;
    if (line.startsWith("```")) continue;
    paragraph.push(line);
    if (paragraph.join(" ").length > 220) break;
  }

  const text = paragraph.join(" ").trim();
  return text.length >= 60 ? text : null;
}

function tryParsePackageJson(snippet: string): { deps: string[]; devDeps: string[] } | null {
  try {
    const parsed = JSON.parse(snippet) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return {
      deps: Object.keys(parsed.dependencies ?? {}),
      devDeps: Object.keys(parsed.devDependencies ?? {})
    };
  } catch {
    return null;
  }
}

function inferTechStack(context: RepoAnalysisContext): string[] {
  const stack = new Set<string>();

  if (context.metadata.primaryLanguage && context.metadata.primaryLanguage !== "Unknown") {
    stack.add(context.metadata.primaryLanguage);
  }

  const paths = context.treeSummary.keyPaths;
  const all = new Set<string>(paths);

  const pkg = context.fileSnippets.find((f) => f.path.toLowerCase() === "package.json");
  if (pkg) {
    const parsed = tryParsePackageJson(pkg.snippet);
    const allDeps = [...(parsed?.deps ?? []), ...(parsed?.devDeps ?? [])];
    const has = (name: string) => allDeps.includes(name);

    if (has("next")) stack.add("Next.js");
    if (has("react")) stack.add("React");
    if (has("vue") || has("nuxt")) stack.add(has("nuxt") ? "Nuxt" : "Vue");
    if (has("svelte") || has("@sveltejs/kit")) stack.add("SvelteKit");
    if (has("tailwindcss")) stack.add("Tailwind CSS");
    if (has("express")) stack.add("Express");
    if (has("fastify")) stack.add("Fastify");
    if (has("hono")) stack.add("Hono");
    if (has("prisma")) stack.add("Prisma");
    if (has("drizzle-orm")) stack.add("Drizzle ORM");
    if (has("zod")) stack.add("Zod");
    if (has("typescript")) stack.add("TypeScript");
    if (has("vitest")) stack.add("Vitest");
    if (has("jest")) stack.add("Jest");
    if (has("playwright")) stack.add("Playwright");
  }

  if ([...all].some((p) => p.endsWith(".py"))) stack.add("Python");
  if ([...all].some((p) => p.endsWith(".go"))) stack.add("Go");
  if ([...all].some((p) => p.endsWith(".rs"))) stack.add("Rust");
  if ([...all].some((p) => p.endsWith(".java") || p.endsWith(".kt"))) stack.add("JVM");
  if ([...all].some((p) => p.endsWith(".swift"))) stack.add("Swift");
  if ([...all].some((p) => p.endsWith(".tf"))) stack.add("Terraform");
  if ([...all].some((p) => p.includes("dockerfile") || p === "Dockerfile")) stack.add("Docker");

  return Array.from(stack).slice(0, 12);
}

function hasAnyPath(prefix: string, paths: string[]) {
  return paths.some((p) => p.startsWith(prefix));
}

function findTests(paths: string[]) {
  return paths.some(
    (p) =>
      p.includes("__tests__") ||
      p.includes("/test/") ||
      p.includes("/tests/") ||
      p.endsWith(".spec.ts") ||
      p.endsWith(".spec.tsx") ||
      p.endsWith(".test.ts") ||
      p.endsWith(".test.tsx") ||
      p.endsWith(".spec.js") ||
      p.endsWith(".test.js")
  );
}

export function generateHeuristicAnalysis(context: RepoAnalysisContext): AnalyzeRepoResponse {
  const keyPaths = context.treeSummary.keyPaths;
  const techStack = inferTechStack(context);
  const readme = context.fileSnippets.find((f) => /^readme\.md$/i.test(f.path));
  const readmeSummary = readme ? firstMeaningfulParagraph(readme.snippet) : null;

  const hasApp = hasAnyPath("app/", keyPaths) || hasAnyPath("pages/", keyPaths);
  const hasComponents = hasAnyPath("components/", keyPaths) || hasAnyPath("src/components/", keyPaths);
  const hasApi = hasAnyPath("api/", keyPaths) || hasAnyPath("server/", keyPaths) || hasAnyPath("routes/", keyPaths);
  const hasLib = hasAnyPath("lib/", keyPaths) || hasAnyPath("src/lib/", keyPaths) || hasAnyPath("src/utils/", keyPaths);
  const hasTests = findTests(keyPaths);
  const envExampleExists = keyPaths.some((p) => p.toLowerCase() === ".env.example");

  let score = 70;
  if (hasTests) score += 8;
  if (readme) score += 6;
  if (hasLib) score += 4;
  if (!readme) score -= 10;
  if (!hasTests) score -= 8;
  score = Math.max(35, Math.min(96, score));

  const whatItDoes =
    readmeSummary ??
    (context.metadata.description && context.metadata.description !== "No description provided."
      ? context.metadata.description
      : `This repository appears to be a ${techStack.join(", ") || "software"} codebase with ${context.treeSummary.totalFiles} files and a focus around ${context.treeSummary.topLevelFolders.slice(0, 4).join(", ") || "core modules"}.`);

  const architectureBreakdown: string[] = [];
  if (hasApp) architectureBreakdown.push("App routing present (likely a web app with structured routes/pages).");
  if (hasComponents) architectureBreakdown.push("Reusable UI/component layer detected (components folder).");
  if (hasApi) architectureBreakdown.push("Backend/API surface detected (api/server/routes).");
  if (hasLib) architectureBreakdown.push("Shared library/utilities present (lib/utils), suggesting separation of concerns.");
  if (hasTests) architectureBreakdown.push("Tests detected, indicating some validation and safer iteration.");

  const codeFlow: string[] = [];
  if (hasApp) codeFlow.push("User hits a route/page, then UI modules assemble the view from reusable components.");
  if (hasApi) codeFlow.push("UI triggers API/server logic for data or operations; responses feed back into the UI.");
  if (hasLib) codeFlow.push("Shared utilities/lib modules centralize core logic and reduce duplication.");
  if (!codeFlow.length) codeFlow.push("Modules appear organized by feature/folder; core logic is composed by importing shared files.");

  const suggestedImprovements: string[] = [];
  if (!readme) suggestedImprovements.push("Add a README with purpose, setup steps, and key architecture notes.");
  if (!hasTests) suggestedImprovements.push("Add a small test suite (unit + a couple integration tests) for core paths.");
  if (!envExampleExists) suggestedImprovements.push("Add a `.env.example` with required environment variables and examples.");
  suggestedImprovements.push("Add a quick-start script and a short architecture diagram for faster onboarding.");

  const impressiveParts: string[] = [];
  if (hasLib) impressiveParts.push("Clear separation between UI, shared logic, and supporting modules.");
  if (hasComponents) impressiveParts.push("Componentized structure that scales as features grow.");
  if (hasApi) impressiveParts.push("Full-stack surface area (API/server) suggests a real product path, not just a demo.");
  if (hasTests) impressiveParts.push("Testing footprint improves maintainability and confidence during iteration.");
  if (!impressiveParts.length) impressiveParts.push("Folder structure suggests deliberate organization rather than a single-file prototype.");

  const repoPersonality =
    hasTests && hasLib
      ? "Pragmatic Builder"
      : hasComponents
        ? "Product-Minded Maker"
        : "Focused Prototype";

  const repoName = context.repoFullName;

  const tagline = `A ${techStack.join(" + ") || "modern"} repo with a clear structure, ${context.metadata.stars} stars, and an emphasis on ${hasApp ? "shipping a usable product" : "core logic and iteration speed"}.`;

  const eli5Story = hasApp
    ? "Imagine a themed amusement park. The routes are the entrances, components are the rides you reuse in different areas, and the API/server is the control room that keeps everything running."
    : "Imagine a recipe book. Each folder is a chapter (desserts, dinner, snacks), and each file is a recipe that can be reused to make a bigger meal.";

  const startupResumePitch = `Built a ${techStack.join(" + ") || "modern"} codebase with clear modular boundaries, a predictable flow, and an architecture that can scale from demo to product. This repo is structured for fast onboarding and confident iteration.`;

  const stackSet = new Set(techStack.map((t) => t.toLowerCase()));
  const isNext = stackSet.has("next.js");
  const isReact = stackSet.has("react");
  const isTs = stackSet.has("typescript");
  const hasPrisma = stackSet.has("prisma");
  const hasDrizzle = stackSet.has("drizzle orm");

  const interviewTalkingPoints: string[] = [];
  interviewTalkingPoints.push(
    isNext
      ? "Explain how Next.js routing (app/pages) shapes server/client boundaries and why you structured modules the way you did."
      : hasApp
        ? "Explain how routing/pages are organized and how you keep UI composition maintainable as features grow."
        : "Explain the module layout and how you prevent core logic from becoming a tangled dependency graph."
  );

  interviewTalkingPoints.push(
    isTs
      ? "Discuss how TypeScript types reduce integration bugs at boundaries (API ↔ UI, shared libs) and where you intentionally kept types flexible."
      : "Discuss how you enforce correctness at boundaries (validation, contracts) and what you’d harden first."
  );

  if (hasApi) {
    interviewTalkingPoints.push(
      hasPrisma || hasDrizzle
        ? "Describe the tradeoffs of your data layer (ORM vs SQL control), and how you’d scale query patterns and migrations safely."
        : "Describe how you’d scale the API layer: caching, rate limiting, background jobs, and boundary ownership."
    );
  }

  if (isReact || hasComponents) {
    interviewTalkingPoints.push(
      "Explain component boundaries: what’s reusable vs feature-specific, and how you avoid prop-drilling or state spaghetti."
    );
  }

  interviewTalkingPoints.push(
    hasTests
      ? "Walk through your testing strategy: what’s unit-tested vs integration-tested, and how CI prevents regressions."
      : "Explain what you’d test first (critical flows + parsing/validation) and why that order improves iteration speed."
  );

  interviewTalkingPoints.push(
    "Call out a likely scaling bottleneck in this codebase (build times, API hotspots, data fetching, shared state) and how you’d address it."
  );

  return {
    repoName,
    tagline,
    architectureScore: score,
    repoPersonality,
    eli5Story,
    whatItDoes,
    architectureBreakdown: architectureBreakdown.length ? architectureBreakdown : ["Repository structure suggests modular organization."],
    codeFlow,
    impressiveParts,
    suggestedImprovements,
    startupResumePitch,
    interviewTalkingPoints,
    techStack: techStack.length ? techStack : [context.metadata.primaryLanguage].filter(Boolean),
    sourceFilesUsed: context.treeSummary.keyPaths
  };
}

