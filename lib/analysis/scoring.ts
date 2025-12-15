import type {
  Commit,
  CategoryScores,
  Score,
  ContributorScores,
  MessageQualityScore,
  CommitSizeScore,
  CommitScore,
  ContributorScore,
  ContributorCategory,
  AntiPatterns,
  RepositoryInsights,
} from '@/types';

// Conventional commit prefixes (Checkpoint 2.1)
const CONVENTIONAL_PREFIXES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'test',
  'chore',
];

// Imperative mood verbs (Checkpoint 2.1)
const IMPERATIVE_VERBS = [
  'add',
  'fix',
  'update',
  'remove',
  'create',
  'implement',
  'change',
  'delete',
  'move',
  'rename',
  'improve',
  'refactor',
  'optimize',
  'clean',
  'merge',
  'revert',
  'bump',
  'release',
  'upgrade',
  'downgrade',
  'enable',
  'disable',
  'configure',
  'set',
  'use',
  'allow',
  'prevent',
  'handle',
  'support',
  'introduce',
  'apply',
  'correct',
  'resolve',
  'ensure',
  'make',
  'convert',
  'replace',
  'extract',
  'simplify',
  'deprecate',
];

/**
 * Checkpoint 2.1: Analyze message quality for a single commit
 * Returns MessageQualityScore with breakdown
 */
export function analyzeMessageQuality(commit: Commit): MessageQualityScore {
  const message = commit.message;

  // Convention Score (0-40): Check for conventional commit format
  let conventionScore = 0;
  const prefixPattern = new RegExp(
    `^(${CONVENTIONAL_PREFIXES.join('|')})(\\([^)]+\\))?:\\s*`,
    'i'
  );
  if (prefixPattern.test(message)) {
    conventionScore = 40;
  }

  // Length Score (0-30): Check message length
  let lengthScore = 0;
  const length = message.length;
  if (length >= 20 && length <= 72) {
    lengthScore = 30; // Optimal length
  } else if ((length >= 10 && length < 20) || (length > 72 && length <= 100)) {
    lengthScore = 15; // Partial points
  }
  // <10 or >100 = 0 points

  // Imperative Mood Score (0-30): Check if starts with imperative verb
  let imperativeScore = 0;
  // Remove conventional prefix if present to get the actual message content
  const messageContent = message.replace(prefixPattern, '').trim();
  const firstWord = messageContent.split(/\s+/)[0]?.toLowerCase() || '';
  if (IMPERATIVE_VERBS.some((verb) => firstWord === verb || firstWord.startsWith(verb))) {
    imperativeScore = 30;
  }

  return {
    total: conventionScore + lengthScore + imperativeScore,
    breakdown: {
      conventionScore,
      lengthScore,
      imperativeScore,
    },
  };
}

/**
 * Checkpoint 2.2: Analyze commit size for a single commit
 * Returns CommitSizeScore with breakdown
 */
export function analyzeCommitSize(commit: Commit): CommitSizeScore {
  const linesChanged = commit.stats.total;
  const filesChanged = commit.stats.filesChanged;

  // Lines Changed Score (0-50)
  let linesScore = 0;
  if (linesChanged >= 10 && linesChanged <= 200) {
    linesScore = 50; // Optimal
  } else if (linesChanged > 200 && linesChanged <= 500) {
    linesScore = 30; // Acceptable
  } else if (linesChanged > 500 && linesChanged <= 1000) {
    linesScore = 15; // Large
  }
  // >1000 = 0 points (Too large)
  // <10 could be a tiny commit but we don't penalize here

  // Files Changed Score (0-50)
  let filesScore = 0;
  if (filesChanged >= 1 && filesChanged <= 5) {
    filesScore = 50; // Optimal
  } else if (filesChanged >= 6 && filesChanged <= 10) {
    filesScore = 30; // Acceptable
  } else if (filesChanged >= 11 && filesChanged <= 20) {
    filesScore = 15; // Many
  }
  // >20 = 0 points (Too many)

  return {
    total: linesScore + filesScore,
    breakdown: {
      linesScore,
      filesScore,
    },
    metrics: {
      linesChanged,
      filesChanged,
    },
  };
}

/**
 * Checkpoint 2.3: Calculate overall commit score
 * Formula: (Message Quality × 0.6) + (Size × 0.4)
 */
export function scoreCommit(commit: Commit): CommitScore {
  const messageQuality = analyzeMessageQuality(commit);
  const sizeScore = analyzeCommitSize(commit);

  const overall = Math.round(
    messageQuality.total * 0.6 + sizeScore.total * 0.4
  );

  return {
    sha: commit.sha,
    overall,
    messageQuality,
    sizeScore,
  };
}

/**
 * Score all commits in a repository
 */
export function scoreAllCommits(commits: Commit[]): CommitScore[] {
  return commits.map(scoreCommit);
}

/**
 * Calculate standard deviation of scores
 */
function calculateStandardDeviation(scores: number[]): number {
  if (scores.length === 0) return 0;
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const squaredDiffs = scores.map((s) => Math.pow(s - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Checkpoint 2.4: Calculate contributor score
 * - Average score across commits
 * - Consistency (standard deviation)
 * - Category based on average
 */
export function calculateContributorScore(commits: Commit[]): ContributorScore {
  const commitScores = scoreAllCommits(commits);
  const overallScores = commitScores.map((cs) => cs.overall);

  const averageScore =
    overallScores.length > 0
      ? Math.round(overallScores.reduce((sum, s) => sum + s, 0) / overallScores.length)
      : 0;

  const consistency = Math.round(calculateStandardDeviation(overallScores) * 100) / 100;

  // Categorize based on average score
  let category: ContributorCategory;
  if (averageScore >= 80) {
    category = 'Excellent';
  } else if (averageScore >= 60) {
    category = 'Good';
  } else {
    category = 'Needs Improvement';
  }

  return {
    averageScore,
    consistency,
    category,
    commitScores,
  };
}

/**
 * Check if a commit message is vague
 */
function isVagueMessage(message: string): boolean {
  const vaguePatterns = [
    /^fix$/i,
    /^update$/i,
    /^change$/i,
    /^modified$/i,
    /^edit$/i,
    /^stuff$/i,
    /^things$/i,
    /^misc$/i,
    /^updates?$/i,
    /^changes?$/i,
    /^fixes?$/i,
    /^\.+$/,
    /^-+$/,
    /^\s*$/,
  ];
  return vaguePatterns.some((p) => p.test(message.trim()));
}

/**
 * Checkpoint 2.5: Detect anti-patterns in commits
 */
export function detectAntiPatterns(commits: Commit[]): AntiPatterns {
  const giantCommits: string[] = [];
  const tinyCommits: string[] = [];
  const mergeCommits: string[] = [];
  const wipCommits: string[] = [];

  for (const commit of commits) {
    // Giant commits: >1000 lines changed
    if (commit.stats.total > 1000) {
      giantCommits.push(commit.sha);
    }

    // Tiny commits: <5 lines with vague message
    if (commit.stats.total < 5 && isVagueMessage(commit.message)) {
      tinyCommits.push(commit.sha);
    }

    // Merge commits: Multiple parents
    if (commit.parents.length > 1) {
      mergeCommits.push(commit.sha);
    }

    // WIP commits: Message contains WIP indicators
    const wipPatterns = [/\bwip\b/i, /work in progress/i];
    if (wipPatterns.some((p) => p.test(commit.message))) {
      wipCommits.push(commit.sha);
    }
  }

  return {
    giantCommits,
    tinyCommits,
    mergeCommits,
    wipCommits,
  };
}

/**
 * Checkpoint 2.5: Generate repository insights
 */
export function generateRepositoryInsights(commits: Commit[]): RepositoryInsights {
  const commitScores = scoreAllCommits(commits);
  const averageScore =
    commitScores.length > 0
      ? Math.round(
          commitScores.reduce((sum, cs) => sum + cs.overall, 0) / commitScores.length
        )
      : 0;

  return {
    totalCommits: commits.length,
    averageScore,
    antiPatterns: detectAntiPatterns(commits),
  };
}

// ============================================
// Legacy functions (backward compatibility)
// ============================================

/**
 * Calculate message quality score for multiple commits (legacy)
 */
export function calculateMessageQuality(commits: Commit[]): number {
  if (commits.length === 0) return 0;
  const scores = commits.map((c) => analyzeMessageQuality(c).total);
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length * 0.4);
}

/**
 * Calculate commit size score for multiple commits (legacy)
 */
export function calculateCommitSize(commits: Commit[]): number {
  if (commits.length === 0) return 0;
  const scores = commits.map((c) => analyzeCommitSize(c).total);
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length * 0.35);
}

/**
 * Calculate consistency score (legacy)
 */
export function calculateConsistency(commits: Commit[]): number {
  if (commits.length === 0) return 0;

  const commitDays = new Set(
    commits.map((c) => c.timestamp.toISOString().split('T')[0])
  );

  const daysWithCommits = commitDays.size;
  const totalDays = commits.length > 0
    ? Math.max(1, Math.ceil(
        (commits[0].timestamp.getTime() - commits[commits.length - 1].timestamp.getTime()) /
        (1000 * 60 * 60 * 24)
      ))
    : 1;

  const distributionRatio = daysWithCommits / Math.max(daysWithCommits, Math.min(totalDays, commits.length));

  let regularityScore = 0;
  if (distributionRatio > 0.5) {
    regularityScore = 15;
  } else if (distributionRatio > 0.3) {
    regularityScore = 10;
  } else if (distributionRatio > 0.1) {
    regularityScore = 5;
  }

  const branches = new Set(commits.map((c) => c.branch));
  const goodBranchNames = Array.from(branches).filter((b) => {
    const goodPatterns = [
      /^main$/,
      /^master$/,
      /^develop$/,
      /^feature\/.+/,
      /^fix\/.+/,
      /^hotfix\/.+/,
      /^release\/.+/,
    ];
    return goodPatterns.some((p) => p.test(b));
  });

  const branchScore = branches.size > 0
    ? Math.round((goodBranchNames.length / branches.size) * 10)
    : 10;

  return regularityScore + branchScore;
}

/**
 * Calculate overall score (legacy - 100 points max)
 */
export function calculateScore(commits: Commit[]): Score {
  const messageQuality = calculateMessageQuality(commits);
  const commitSize = calculateCommitSize(commits);
  const consistency = calculateConsistency(commits);

  return {
    total: messageQuality + commitSize + consistency,
    breakdown: {
      messageQuality,
      commitSize,
      consistency,
    },
  };
}

/**
 * Calculate contributor-specific scores (legacy)
 */
export function calculateContributorScores(commits: Commit[]): ContributorScores {
  const score = calculateScore(commits);

  return {
    overall: score.total,
    messageQuality: score.breakdown.messageQuality,
    commitSize: score.breakdown.commitSize,
    consistency: score.breakdown.consistency,
  };
}

/**
 * Get score description based on total score
 */
export function getScoreDescription(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Get score color based on total score (Checkpoint 4 colors)
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981'; // Green - Excellent
  if (score >= 60) return '#3b82f6'; // Blue - Good
  if (score >= 40) return '#f97316'; // Orange - Needs Work
  return '#ef4444'; // Red - Poor
}
