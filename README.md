# Explain My Repo Like I'm Five

A polished AI developer tool MVP that turns a public GitHub repository into a recruiter-ready, founder-friendly explanation.

The app accepts a repo URL, fetches real GitHub metadata and structure, reads key source files, and asks an LLM to generate a specific report with architecture analysis, ELI5 explanation, code flow, and startup/interview framing.

## Tech Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS v4
- GitHub REST API
- OpenAI Chat Completions API

## What The App Does

- Parses repo inputs in multiple formats:
  - `https://github.com/owner/repo`
  - `github.com/owner/repo`
  - `owner/repo`
- Fetches real GitHub repository metadata and recursive file tree
- Prioritizes high-signal files (README, package files, app/src/components/api/server/routes, etc.)
- Avoids huge file downloads via size limits
- Generates a structured AI report with:
  - Hero summary
  - What the repo actually does
  - ELI5 story mode
  - Architecture score
  - Code flow
  - Impressive parts
  - Suggested improvements
  - Startup/resume pitch
  - Interview talking points
  - Source files analyzed

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Add required environment variables:

- `OPENAI_API_KEY` (required)
- `GITHUB_TOKEN` (optional but recommended for higher GitHub API rate limits)

4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Example Repos To Test

- `https://github.com/vercel/next.js`
- `https://github.com/facebook/react`
- `https://github.com/tailwindlabs/tailwindcss`
- `owner/repo` format example: `vercel/next.js`

## API Contract

`POST /api/analyze-repo`

Request body:

```json
{
  "repoUrl": "https://github.com/owner/repo"
}
```

Returns:

```json
{
  "repoName": "string",
  "tagline": "string",
  "architectureScore": 0,
  "repoPersonality": "string",
  "eli5Story": "string",
  "whatItDoes": "string",
  "architectureBreakdown": ["string"],
  "codeFlow": ["string"],
  "impressiveParts": ["string"],
  "suggestedImprovements": ["string"],
  "startupResumePitch": "string",
  "interviewTalkingPoints": ["string"],
  "techStack": ["string"],
  "sourceFilesUsed": ["string"]
}
```

## Future Improvements

- Streaming token-by-token analysis output
- RAG layer over full repository chunks
- Caching analysis by repo+commit SHA
- Better diff-aware architecture graphs
- Multi-model routing for cost/quality optimization
