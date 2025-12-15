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
    firstCommitDate: Date;
    lastCommitDate: Date;
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
