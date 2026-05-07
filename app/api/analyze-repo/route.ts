import { NextResponse } from "next/server";
import { generateAnalysis } from "../../../lib/ai";
import { buildRepoContext } from "../../../lib/github";
import { generateHeuristicAnalysis } from "../../../lib/heuristic";
import { AnalyzeRepoError, AnalyzeRepoResponse } from "../../../lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { repoUrl?: string };
    const repoUrl = body?.repoUrl?.trim();
    if (!repoUrl) {
      return NextResponse.json<AnalyzeRepoError>(
        { error: "Missing repo URL. Please provide a public GitHub repository." },
        { status: 400 }
      );
    }

    const context = await buildRepoContext(repoUrl);
    const hasAiKey = Boolean(process.env.OPENAI_API_KEY);
    const analysis = hasAiKey ? await generateAnalysis(context) : generateHeuristicAnalysis(context);

    return NextResponse.json<AnalyzeRepoResponse>(analysis, {
      status: 200,
      headers: {
        "x-analysis-mode": hasAiKey ? "ai" : "heuristic"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    const status =
      message.includes("rate limit") ? 429 : message.includes("not found") || message.includes("private") ? 404 : 500;

    return NextResponse.json<AnalyzeRepoError>({ error: message }, { status });
  }
}
