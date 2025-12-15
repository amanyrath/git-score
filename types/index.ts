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

// Checkpoint 2: Message Quality Score (0-100)
export interface MessageQualityScore {
  total: number; // 0-100
  breakdown: {
    conventionScore: number; // 0-40: Conventional commit format
    lengthScore: number;     // 0-30: Message length
    imperativeScore: number; // 0-30: Imperative mood
  };
}

// Checkpoint 2: Commit Size Score (0-100)
export interface CommitSizeScore {
  total: number; // 0-100
  breakdown: {
    linesScore: number; // 0-50: Lines changed
    filesScore: number; // 0-50: Files changed
  };
  metrics: {
    linesChanged: number;
    filesChanged: number;
  };
}

// Checkpoint 2: Overall Commit Score
export interface CommitScore {
  sha: string;
  overall: number; // 0-100: Weighted combination
  messageQuality: MessageQualityScore;
  sizeScore: CommitSizeScore;
}

// Checkpoint 2: Contributor Score with category
export type ContributorCategory = 'Excellent' | 'Good' | 'Needs Improvement';

export interface ContributorScore {
  averageScore: number;
  consistency: number; // Standard deviation
  category: ContributorCategory;
  commitScores: CommitScore[];
}

// Checkpoint 2: Anti-pattern types
export interface AntiPatterns {
  giantCommits: string[];    // SHAs of commits >1000 lines
  tinyCommits: string[];     // SHAs of commits <5 lines with vague message
  mergeCommits: string[];    // SHAs of merge commits
  wipCommits: string[];      // SHAs of WIP commits
}

// Checkpoint 2: Repository Insights
export interface RepositoryInsights {
  totalCommits: number;
  averageScore: number;
  antiPatterns: AntiPatterns;
}

// Legacy scoring types (kept for backward compatibility)
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
  // Checkpoint 2: Enhanced scoring
  scoring: ContributorScore;
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
  // Checkpoint 2: Enhanced analysis
  commitScores: CommitScore[];
  insights: RepositoryInsights;
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
