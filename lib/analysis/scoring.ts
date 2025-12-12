import type {
  Commit,
  CategoryScores,
  Score,
  ContributorScores,
  AntiPatterns,
  EnhancedCommitScore,
  SemanticAnalysis,
} from '@/types';

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

/**
 * Detect anti-patterns in commits
 */
export function detectAntiPatterns(commits: Commit[]): AntiPatterns {
  const giantCommits: string[] = [];
  const tinyCommits: string[] = [];
  const wipCommits: string[] = [];
  const mergeCommits: string[] = [];

  for (const commit of commits) {
    // Giant commits: >1000 lines changed
    if (commit.stats.total > 1000) {
      giantCommits.push(commit.sha);
    }

    // Tiny/vague commits: <5 lines with short message
    if (commit.stats.total < 5 && commit.message.length < 15) {
      tinyCommits.push(commit.sha);
    }

    // WIP commits
    if (/\bwip\b|work in progress/i.test(commit.message)) {
      wipCommits.push(commit.sha);
    }

    // Merge commits: multiple parents
    if (commit.parents.length > 1) {
      mergeCommits.push(commit.sha);
    }
  }

  return { giantCommits, tinyCommits, wipCommits, mergeCommits };
}

/**
 * Calculate heuristic score for a single commit (0-100)
 */
export function calculateSingleCommitHeuristicScore(commit: Commit): number {
  // Message quality (60%)
  let messageScore = 0;

  // Conventional commit prefix (40 pts)
  const prefixPattern = new RegExp(`^(${CONVENTIONAL_PREFIXES.join('|')})(\\(.+\\))?:`, 'i');
  if (prefixPattern.test(commit.message)) {
    messageScore += 40;
  }

  // Message length (30 pts)
  const msgLen = commit.message.length;
  if (msgLen >= 20 && msgLen <= 72) {
    messageScore += 30;
  } else if (msgLen >= 10 && msgLen <= 100) {
    messageScore += 15;
  }

  // Imperative mood (30 pts)
  const firstWord = commit.message
    .replace(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:\s*/i, '')
    .split(/\s+/)[0]
    .toLowerCase();
  if (IMPERATIVE_VERBS.some((verb) => firstWord.startsWith(verb))) {
    messageScore += 30;
  }

  // Size score (40%)
  let sizeScore = 0;
  const linesChanged = commit.stats.total;
  const filesChanged = commit.stats.filesChanged;

  // Lines changed (50 pts of size)
  if (linesChanged >= 10 && linesChanged <= 200) {
    sizeScore += 50;
  } else if (linesChanged > 200 && linesChanged <= 500) {
    sizeScore += 30;
  } else if (linesChanged > 500 && linesChanged <= 1000) {
    sizeScore += 15;
  }

  // Files changed (50 pts of size)
  if (filesChanged >= 1 && filesChanged <= 5) {
    sizeScore += 50;
  } else if (filesChanged > 5 && filesChanged <= 10) {
    sizeScore += 30;
  } else if (filesChanged > 10 && filesChanged <= 20) {
    sizeScore += 15;
  }

  // Weighted combination: message (60%) + size (40%)
  return Math.round(messageScore * 0.6 + sizeScore * 0.4);
}

/**
 * Calculate enhanced scores combining heuristic and AI analysis
 * Weights: Heuristic 30%, AI Clarity 25%, Completeness 20%, Size 20%, Technical 5%
 */
export function calculateEnhancedScores(
  commits: Commit[],
  semanticAnalysis: Map<string, SemanticAnalysis>
): EnhancedCommitScore[] {
  return commits.map((commit) => {
    const heuristicScore = calculateSingleCommitHeuristicScore(commit);
    const aiAnalysis = semanticAnalysis.get(commit.sha);

    // Size score (same as in heuristic but standalone for breakdown)
    let sizeScore = 0;
    const linesChanged = commit.stats.total;
    const filesChanged = commit.stats.filesChanged;

    if (linesChanged >= 10 && linesChanged <= 200) {
      sizeScore += 50;
    } else if (linesChanged > 200 && linesChanged <= 500) {
      sizeScore += 30;
    } else if (linesChanged > 500 && linesChanged <= 1000) {
      sizeScore += 15;
    }

    if (filesChanged >= 1 && filesChanged <= 5) {
      sizeScore += 50;
    } else if (filesChanged > 5 && filesChanged <= 10) {
      sizeScore += 30;
    } else if (filesChanged > 10 && filesChanged <= 20) {
      sizeScore += 15;
    }

    if (aiAnalysis) {
      // Full enhanced scoring with AI
      const overall = Math.round(
        heuristicScore * 0.3 +
        aiAnalysis.clarity * 0.25 +
        aiAnalysis.completeness * 0.2 +
        sizeScore * 0.2 +
        aiAnalysis.technicalQuality * 0.05
      );

      return {
        sha: commit.sha,
        overall,
        heuristicScore,
        aiScores: {
          clarity: aiAnalysis.clarity,
          completeness: aiAnalysis.completeness,
          technicalQuality: aiAnalysis.technicalQuality,
        },
        breakdown: {
          heuristic: Math.round(heuristicScore * 0.3),
          clarity: Math.round(aiAnalysis.clarity * 0.25),
          completeness: Math.round(aiAnalysis.completeness * 0.2),
          size: Math.round(sizeScore * 0.2),
          technical: Math.round(aiAnalysis.technicalQuality * 0.05),
        },
      };
    } else {
      // Fallback: heuristic only (scale to 100)
      return {
        sha: commit.sha,
        overall: heuristicScore,
        heuristicScore,
        breakdown: {
          heuristic: Math.round(heuristicScore * 0.3),
          clarity: 0,
          completeness: 0,
          size: Math.round(sizeScore * 0.2),
          technical: 0,
        },
      };
    }
  });
}
