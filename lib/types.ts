export type RepoCoordinates = {
  owner: string;
  repo: string;
};

export type AnalyzeRepoResponse = {
  repoName: string;
  tagline: string;
  architectureScore: number;
  repoPersonality: string;
  eli5Story: string;
  whatItDoes: string;
  architectureBreakdown: string[];
  codeFlow: string[];
  impressiveParts: string[];
  suggestedImprovements: string[];
  startupResumePitch: string;
  interviewTalkingPoints: string[];
  techStack: string[];
  sourceFilesUsed: string[];
};

export type AnalyzeRepoError = {
  error: string;
};

export type RepoAnalysisContext = {
  repoFullName: string;
  metadata: {
    name: string;
    description: string;
    stars: number;
    forks: number;
    primaryLanguage: string;
    topics: string[];
    defaultBranch: string;
    updatedAt: string;
  };
  treeSummary: {
    totalFiles: number;
    topLevelFolders: string[];
    keyPaths: string[];
  };
  fileSnippets: Array<{
    path: string;
    snippet: string;
  }>;
};
