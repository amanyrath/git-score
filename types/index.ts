// Repository types
export interface Repository {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  createdAt: Date;
  updatedAt: Date;
}

// Author types
export interface Author {
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
}

// File change types
export interface FileChange {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
}

// Commit types
export interface Commit {
  sha: string;
  message: string;
  body?: string;
  author: Author;
  committer: Author;
  timestamp: Date;
  branch: string;
  parents: string[];
  stats: {
    additions: number;
    deletions: number;
    total: number;
    filesChanged: number;
  };
  files: FileChange[];
}

// Scoring types
export interface CategoryScores {
  messageQuality: number;
  commitSize: number;
  consistency: number;
}

export interface Score {
  total: number;
  breakdown: CategoryScores;
}

// AI Analysis types
export type CommitIntent =
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'docs'
  | 'test'
  | 'style'
  | 'chore'
  | 'performance'
  | 'security';

export interface SemanticAnalysis {
  intent: CommitIntent;
  intentConfidence: number;
  clarity: number;
  completeness: number;
  technicalQuality: number;
  reasoning: string;
}

export interface EnhancedCommitScore {
  sha: string;
  overall: number;
  heuristicScore: number;
  aiScores?: {
    clarity: number;
    completeness: number;
    technicalQuality: number;
  };
  breakdown: {
    heuristic: number; // 30%
    clarity: number; // 25%
    completeness: number; // 20%
    size: number; // 20%
    technical: number; // 5%
  };
}

export interface AntiPatterns {
  giantCommits: string[]; // SHAs of commits >1000 lines
  tinyCommits: string[]; // SHAs of tiny vague commits
  wipCommits: string[]; // SHAs containing WIP
  mergeCommits: string[]; // SHAs of merge commits
}

export interface Insight {
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  severity: 'high' | 'medium' | 'low';
  category: 'strength' | 'improvement' | 'pattern' | 'recommendation';
}

// Contributor analysis types
export interface ContributorScores {
  overall: number;
  messageQuality: number;
  commitSize: number;
  consistency: number;
}

export interface ContributorAnalysis {
  author: Author;
  commits: Commit[];
  totalCommits: number;
  stats: {
    totalAdditions: number;
    totalDeletions: number;
    avgCommitSize: number;
    filesChanged: number;
  };
  scores: ContributorScores;
  patterns: {
    workingHours: number[];
    preferredDays: number[];
    velocity: number;
  };
}

// Recommendation types
export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  actionItems: string[];
}

// Collaboration analysis types
export interface FileOwnership {
  filename: string;
  contributors: string[];
  totalChanges: number;
  primaryOwner: string;
  ownershipPercent: number;
}

export interface KnowledgeSilo {
  contributor: string;
  email: string;
  exclusiveFiles: string[];
  riskLevel: 'high' | 'medium' | 'low';
}

export interface CollaborationMetrics {
  busFactor: number;
  knowledgeSilos: KnowledgeSilo[];
  fileOwnership: FileOwnership[];
  collaborationScore: number;
}

// Analysis result types
export interface AnalysisResult {
  id: string;
  repository: Repository;
  analyzedAt: Date;
  commits: Commit[];
  totalCommits: number;
  dateRange: [Date, Date];
  contributors: ContributorAnalysis[];
  totalContributors: number;
  overallScore: number;
  categoryScores: CategoryScores;
  recommendations: Recommendation[];
  collaboration?: CollaborationMetrics;
  // AI-enhanced fields (optional for backwards compatibility)
  aiAnalysis?: {
    semanticScores: Map<string, SemanticAnalysis> | Record<string, SemanticAnalysis>;
    enhancedScores: EnhancedCommitScore[];
    insights: Insight[];
    antiPatterns: AntiPatterns;
    tokenUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

// API types
export interface AnalyzeRequest {
  url: string;
  token?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

// GitHub URL parsing
export interface ParsedGitHubURL {
  owner: string;
  repo: string;
}
