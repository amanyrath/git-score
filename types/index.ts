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

// ============================================
// Checkpoint 3: AI-Powered Semantic Analysis
// ============================================

// Commit intent types
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

// Semantic analysis from AI
export interface SemanticAnalysis {
  intent: CommitIntent;
  clarityScore: number; // 0-100
  completenessScore: number; // 0-100
  technicalQualityScore: number; // 0-100
  summary: string; // Brief AI-generated summary
}

// Enhanced commit score with AI analysis
export interface EnhancedCommitScore {
  sha: string;
  heuristicScore: number; // From Checkpoint 2 (0-100)
  clarityScore: number; // AI clarity (0-100)
  completenessScore: number; // AI completeness (0-100)
  sizeScore: number; // Size score (0-100)
  technicalScore: number; // AI technical quality (0-100)
  overallScore: number; // Weighted: 30% heuristic, 25% clarity, 20% completeness, 20% size, 5% technical
  semanticAnalysis: SemanticAnalysis;
}

// AI-generated insight
export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface AIInsight {
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  severity: InsightSeverity;
}

// Token usage tracking
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Extended commit with enhanced AI scoring
export interface AIEnhancedCommit extends ScoredCommit {
  enhancedScore?: EnhancedCommitScore;
}

// Extended contributor with enhanced scoring
export interface AIEnhancedContributor extends ScoredContributor {
  aiAverageScore?: number;
  dominantIntent?: CommitIntent;
}

// Final analysis result with AI enhancements
export interface AIEnhancedAnalysisResult extends ScoredAnalysisResult {
  commits: AIEnhancedCommit[];
  contributors: AIEnhancedContributor[];
  aiInsights: AIInsight[];
  aiRepositoryScore?: number; // AI-enhanced overall score
  tokenUsage?: TokenUsage;
  aiAnalysisEnabled: boolean;
  temporalAnalysis?: TemporalAnalysis;
  collaborationMetrics?: CollaborationMetrics;
}

// ============================================
// Checkpoint 5: Advanced Features
// ============================================

// Temporal Pattern Analysis
export interface HourlyDistribution {
  hour: number; // 0-23
  count: number;
  averageScore: number;
}

export interface DailyDistribution {
  day: number; // 0-6 (Sunday-Saturday)
  dayName: string;
  count: number;
  averageScore: number;
}

export interface TemporalPattern {
  isWeekendCommitter: boolean;
  isNightOwl: boolean; // Commits frequently 10pm-6am
  isEarlyBird: boolean; // Commits frequently 5am-9am
  workingHoursRatio: number; // % of commits during 9am-5pm
  mostActiveHour: number;
  mostActiveDay: string;
}

export interface VelocityData {
  week: string; // ISO week string
  commitCount: number;
  linesChanged: number;
  averageScore: number;
}

export interface QualityTimeCorrelation {
  hourlyCorrelation: number; // -1 to 1, correlation between hour and quality
  dayCorrelation: number; // -1 to 1, correlation between day and quality
  bestHours: number[]; // Hours with highest average quality
  worstHours: number[]; // Hours with lowest average quality
}

export interface TemporalAnalysis {
  hourlyDistribution: HourlyDistribution[];
  dailyDistribution: DailyDistribution[];
  patterns: TemporalPattern;
  velocity: VelocityData[];
  qualityTimeCorrelation: QualityTimeCorrelation;
  heatmapData: number[][]; // 7x24 matrix (days x hours)
  contributorPatterns: Map<string, TemporalPattern> | Record<string, TemporalPattern>;
}

// Code Collaboration Metrics
export interface FileOwnership {
  filePath: string;
  primaryOwner: string;
  ownershipPercentage: number;
  contributors: { email: string; percentage: number }[];
  lastModified: string;
}

export interface BusFactorAnalysis {
  overallBusFactor: number; // 1 = dangerous, higher = safer
  criticalFiles: string[]; // Files with single owner
  riskLevel: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface CollaborationPattern {
  type: 'siloed' | 'collaborative' | 'mixed';
  description: string;
  collaborationScore: number; // 0-100
}

export interface KnowledgeSilo {
  contributor: string;
  exclusiveFiles: string[];
  siloRisk: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface ReviewPattern {
  hasMergeCommits: boolean;
  mergeCommitRatio: number;
  averageTimeBetweenMerges: number; // in hours
  topMergers: { name: string; count: number }[];
}

export interface CollaborationMetrics {
  fileOwnership: FileOwnership[];
  busFactor: BusFactorAnalysis;
  collaborationPattern: CollaborationPattern;
  knowledgeSilos: KnowledgeSilo[];
  reviewPatterns: ReviewPattern;
}

// Cache types
export interface CachedAnalysis {
  result: AIEnhancedAnalysisResult;
  cachedAt: number;
  expiresAt: number;
  repoKey: string;
}
