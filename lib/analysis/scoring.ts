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
];

/**
 * Calculate message quality score (40 points max)
 * - Has conventional commit prefix: 15 pts
 * - Message length > 20 chars: 15 pts
 * - Uses imperative mood: 10 pts
 */
export function calculateMessageQuality(commits: Commit[]): number {
  if (commits.length === 0) return 0;

  // Check for conventional commit prefix
  const hasPrefix = commits.filter((c) => {
    const prefixPattern = new RegExp(`^(${CONVENTIONAL_PREFIXES.join('|')})(\\(.+\\))?:`, 'i');
    return prefixPattern.test(c.message);
  }).length / commits.length;

  // Check for adequate message length
  const adequateLength = commits.filter((c) => c.message.length > 20).length / commits.length;

  // Check for imperative mood (simple heuristic)
  const imperativeMood = commits.filter((c) => {
    const firstWord = c.message.replace(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:\s*/i, '').split(/\s+/)[0].toLowerCase();
    return IMPERATIVE_VERBS.some((verb) => firstWord.startsWith(verb));
  }).length / commits.length;

  return Math.round(hasPrefix * 15 + adequateLength * 15 + imperativeMood * 10);
}

/**
 * Calculate commit size score (35 points max)
 * - Average lines changed < 300: 15 pts
 * - Average files changed < 10: 10 pts
 * - No massive commits (>1000 lines): 10 pts
 */
export function calculateCommitSize(commits: Commit[]): number {
  if (commits.length === 0) return 0;

  const avgLinesChanged = commits.reduce((sum, c) => sum + c.stats.total, 0) / commits.length;
  const avgFilesChanged = commits.reduce((sum, c) => sum + c.stats.filesChanged, 0) / commits.length;
  const hasMassiveCommits = commits.some((c) => c.stats.total > 1000);

  // Score for average lines changed
  let linesScore = 0;
  if (avgLinesChanged < 100) {
    linesScore = 15;
  } else if (avgLinesChanged < 200) {
    linesScore = 12;
  } else if (avgLinesChanged < 300) {
    linesScore = 10;
  } else if (avgLinesChanged < 500) {
    linesScore = 5;
  }

  // Score for average files changed
  let filesScore = 0;
  if (avgFilesChanged < 5) {
    filesScore = 10;
  } else if (avgFilesChanged < 10) {
    filesScore = 7;
  } else if (avgFilesChanged < 15) {
    filesScore = 4;
  }

  // Score for no massive commits
  const massiveScore = hasMassiveCommits ? 0 : 10;

  return linesScore + filesScore + massiveScore;
}

/**
 * Calculate consistency score (25 points max)
 * - Regular commits (not all on one day): 15 pts
 * - Follows branch naming (if multiple branches): 10 pts
 */
export function calculateConsistency(commits: Commit[]): number {
  if (commits.length === 0) return 0;

  // Check commit distribution across days
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

  // Distribution ratio (how spread out are commits)
  const distributionRatio = daysWithCommits / Math.max(daysWithCommits, Math.min(totalDays, commits.length));

  let regularityScore = 0;
  if (distributionRatio > 0.5) {
    regularityScore = 15;
  } else if (distributionRatio > 0.3) {
    regularityScore = 10;
  } else if (distributionRatio > 0.1) {
    regularityScore = 5;
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
    ? Math.round((goodBranchNames.length / branches.size) * 10)
    : 10; // Give full points if only main branch

  return regularityScore + branchScore;
}

/**
 * Calculate overall score (100 points max)
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
