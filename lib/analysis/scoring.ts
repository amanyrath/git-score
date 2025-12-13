import type { Commit, CategoryScores, Score, ContributorScores } from '@/types';

// Conventional commit prefixes
const CONVENTIONAL_PREFIXES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'test',
  'chore',
  'perf',
  'ci',
  'build',
  'revert',
];

// Imperative mood verbs
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
  'set',
  'use',
  'make',
  'enable',
  'disable',
  'handle',
  'support',
  'allow',
  'prevent',
  'ensure',
];

/**
 * Calculate message quality score (0-100)
 * - Conventional Commits Format: 40 points
 * - Message Length (>20 chars): 30 points
 * - Imperative Mood: 30 points
 */
export function calculateMessageQuality(commits: Commit[]): number {
  if (commits.length === 0) return 0;

  // Check for conventional commit prefix (40 points)
  const hasPrefix = commits.filter((c) => {
    const prefixPattern = new RegExp(`^(${CONVENTIONAL_PREFIXES.join('|')})(\\(.+\\))?:`, 'i');
    return prefixPattern.test(c.message);
  }).length / commits.length;

  // Check for adequate message length (30 points)
  const adequateLength = commits.filter((c) => c.message.length > 20).length / commits.length;

  // Check for imperative mood (30 points)
  const imperativeMood = commits.filter((c) => {
    const firstWord = c.message
      .replace(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:\s*/i, '')
      .split(/\s+/)[0]
      .toLowerCase();
    return IMPERATIVE_VERBS.some((verb) => firstWord.startsWith(verb));
  }).length / commits.length;

  return Math.round(hasPrefix * 40 + adequateLength * 30 + imperativeMood * 30);
}

/**
 * Calculate commit size score (0-100)
 * - Average lines changed: 40 points (ideal < 200 lines)
 * - Average files changed: 30 points (ideal < 10 files)
 * - No massive commits (>1000 lines): 30 points
 */
export function calculateCommitSize(commits: Commit[]): number {
  if (commits.length === 0) return 0;

  const avgLinesChanged = commits.reduce((sum, c) => sum + c.stats.total, 0) / commits.length;
  const avgFilesChanged = commits.reduce((sum, c) => sum + c.stats.filesChanged, 0) / commits.length;
  const massiveCommitRatio = commits.filter((c) => c.stats.total > 1000).length / commits.length;

  // Score for average lines changed (40 points max)
  let linesScore = 0;
  if (avgLinesChanged < 50) {
    linesScore = 40;
  } else if (avgLinesChanged < 100) {
    linesScore = 35;
  } else if (avgLinesChanged < 200) {
    linesScore = 30;
  } else if (avgLinesChanged < 300) {
    linesScore = 20;
  } else if (avgLinesChanged < 500) {
    linesScore = 10;
  }

  // Score for average files changed (30 points max)
  let filesScore = 0;
  if (avgFilesChanged < 3) {
    filesScore = 30;
  } else if (avgFilesChanged < 5) {
    filesScore = 25;
  } else if (avgFilesChanged < 10) {
    filesScore = 20;
  } else if (avgFilesChanged < 15) {
    filesScore = 10;
  }

  // Score for no massive commits (30 points max)
  const massiveScore = Math.round((1 - massiveCommitRatio) * 30);

  return linesScore + filesScore + massiveScore;
}

/**
 * Calculate consistency score (0-100)
 * - Regular commits (not all clustered): 60 points
 * - Follows branch naming conventions: 40 points
 */
export function calculateConsistency(commits: Commit[]): number {
  if (commits.length === 0) return 0;

  // Check commit distribution across days
  const commitDays = new Set(
    commits.map((c) => c.timestamp.toISOString().split('T')[0])
  );

  const daysWithCommits = commitDays.size;
  const timestamps = commits.map((c) => c.timestamp.getTime());
  const totalDays = commits.length > 0
    ? Math.max(1, Math.ceil(
        (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24)
      ))
    : 1;

  // Distribution ratio (how spread out are commits)
  const distributionRatio = daysWithCommits / Math.max(daysWithCommits, Math.min(totalDays, commits.length));

  let regularityScore = 0;
  if (distributionRatio > 0.6) {
    regularityScore = 60;
  } else if (distributionRatio > 0.4) {
    regularityScore = 45;
  } else if (distributionRatio > 0.2) {
    regularityScore = 30;
  } else if (distributionRatio > 0.1) {
    regularityScore = 15;
  }

  // Check branch naming (simple check for MVP)
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
    ? Math.round((goodBranchNames.length / branches.size) * 40)
    : 40; // Give full points if only main branch

  return regularityScore + branchScore;
}

// Weights for each category
const WEIGHTS = {
  messageQuality: 0.40,
  commitSize: 0.35,
  consistency: 0.25,
};

/**
 * Calculate overall score (0-100)
 * Weighted: Message Quality (40%) + Commit Size (35%) + Consistency (25%)
 */
export function calculateScore(commits: Commit[]): Score {
  const messageQuality = calculateMessageQuality(commits);
  const commitSize = calculateCommitSize(commits);
  const consistency = calculateConsistency(commits);

  const weightedTotal = Math.round(
    messageQuality * WEIGHTS.messageQuality +
    commitSize * WEIGHTS.commitSize +
    consistency * WEIGHTS.consistency
  );

  return {
    total: weightedTotal,
    breakdown: {
      messageQuality,
      commitSize,
      consistency,
    },
  };
}

/**
 * Calculate contributor-specific scores
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
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 40) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Get score color based on total score
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981'; // green
  if (score >= 75) return '#3b82f6'; // blue
  if (score >= 60) return '#f59e0b'; // amber
  if (score >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
}
