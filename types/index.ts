// Author information from commit
export interface Author {
  name: string;
  email: string;
  avatarUrl?: string;
}

// Commit statistics
export interface CommitStats {
  additions: number;
  deletions: number;
  total: number;
  filesChanged: number;
}

// Individual commit data
export interface Commit {
  sha: string;
  message: string;
  timestamp: string;
  author: Author;
  stats: CommitStats;
  parentShas: string[];
  isMergeCommit: boolean;
}

// Repository metadata
export interface Repository {
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  starCount: number;
  language: string | null;
  createdAt: string;
  updatedAt: string;
  owner: string;
  url: string;
}

// Contributor statistics
export interface ContributorStats {
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  averageCommitSize: number;
  firstCommitDate: string;
  lastCommitDate: string;
}

// Contributor with their commits
export interface Contributor {
  name: string;
  email: string;
  avatarUrl?: string;
  commits: Commit[];
  stats: ContributorStats;
}

// Analysis result combining repo and contributors
export interface AnalysisResult {
  repository: Repository;
  commits: Commit[];
  contributors: Contributor[];
  totalCommits: number;
  analyzedAt: string;
}

// Error types for different failure scenarios
export type GitHubErrorType =
  | 'NOT_FOUND'
  | 'PRIVATE_REPO'
  | 'RATE_LIMIT'
  | 'NETWORK_ERROR'
  | 'INVALID_TOKEN'
  | 'UNKNOWN';

export interface GitHubError {
  type: GitHubErrorType;
  message: string;
  status?: number;
}

// Parsed repository URL
export interface ParsedRepoUrl {
  owner: string;
  repo: string;
}

// API response state
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: GitHubError | null;
}

// ============================================
// Checkpoint 2: Heuristic-Based Commit Analysis
// ============================================

// Message quality scoring breakdown
export interface MessageQualityScore {
  conventionalCommit: number; // 0-40 points
  messageLength: number; // 0-30 points
  imperativeMood: number; // 0-30 points
  total: number; // 0-100 points
  isConventionalCommit: boolean;
  commitType?: string; // feat, fix, docs, etc.
}

// Commit size scoring breakdown
export interface CommitSizeScore {
  linesChanged: number; // 0-50 points
  filesChanged: number; // 0-50 points
  total: number; // 0-100 points
  isGiantCommit: boolean; // >1000 lines
  isTinyCommit: boolean; // <5 lines
}

// Overall score for a single commit
export interface CommitScore {
  sha: string;
  messageQuality: MessageQualityScore;
  sizeScore: CommitSizeScore;
  overallScore: number; // Weighted: 60% message, 40% size
}

// Contributor category based on average score
export type ContributorCategory = 'Excellent' | 'Good' | 'Needs Improvement';

// Scoring information for a contributor
export interface ContributorScore {
  email: string;
  averageScore: number;
  consistencyScore: number; // Based on standard deviation (higher = more consistent)
  category: ContributorCategory;
  commitScores: CommitScore[];
}

// Anti-pattern types detected in commits
export type AntiPatternType = 'giant_commit' | 'tiny_commit' | 'wip_commit' | 'merge_commit';

// Individual anti-pattern instance
export interface AntiPattern {
  type: AntiPatternType;
  sha: string;
  message: string;
  description: string;
}

// Repository-level insights
export interface RepositoryInsights {
  antiPatterns: AntiPattern[];
  giantCommitCount: number;
  tinyCommitCount: number;
  wipCommitCount: number;
  mergeCommitCount: number;
}

// Extended commit with score
export interface ScoredCommit extends Commit {
  score: CommitScore;
}

// Extended contributor with score
export interface ScoredContributor extends Contributor {
  score: ContributorScore;
}

// Extended analysis result with scoring
export interface ScoredAnalysisResult extends AnalysisResult {
  commits: ScoredCommit[];
  contributors: ScoredContributor[];
  repositoryScore: number; // Average of all commit scores
  insights: RepositoryInsights;
}
