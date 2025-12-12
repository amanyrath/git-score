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
