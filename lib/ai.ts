import { AnalyzeRepoResponse, RepoAnalysisContext } from "./types";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

function buildSystemPrompt() {
  return `
You are an expert staff engineer and startup technical storyteller.
Given a real GitHub repository context, generate a specific and evidence-based report.

Rules:
- Explain what the repository ACTUALLY does using evidence from README snippets, dependencies, and file structure.
- Avoid generic praise. If you claim architecture quality, justify with concrete file/folder evidence.
- Create an ELI5 analogy that maps directly to this project.
- Keep tone sharp, impressive, and credible for startup founders and recruiters.
- Include startup/resume pitch language and interview talking points about engineering decisions.
- Never mention that context was limited unless absolutely necessary.
- Return strict JSON with exactly the requested keys and valid types.
`.trim();
}

function buildUserPrompt(context: RepoAnalysisContext) {
  return JSON.stringify(
    {
      task: "Analyze this GitHub repository and produce the required report JSON.",
      schema: {
        repoName: "string",
        tagline: "string",
        architectureScore: "number 0-100",
        repoPersonality: "string",
        eli5Story: "string",
        whatItDoes: "string",
        architectureBreakdown: "string[]",
        codeFlow: "string[]",
        impressiveParts: "string[]",
        suggestedImprovements: "string[]",
        startupResumePitch: "string",
        interviewTalkingPoints: "string[]",
        techStack: "string[]",
        sourceFilesUsed: "string[]"
      },
      repoContext: context
    },
    null,
    2
  );
}

function safeParseResponse(raw: string): AnalyzeRepoResponse {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as AnalyzeRepoResponse;
  return parsed;
}

export async function generateAnalysis(context: RepoAnalysisContext): Promise<AnalyzeRepoResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("AI mode is not configured.");
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(context) }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned an empty response.");
  }

  try {
    return safeParseResponse(content);
  } catch {
    throw new Error("Failed to parse AI response JSON.");
  }
}
