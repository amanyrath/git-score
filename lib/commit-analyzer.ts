import {
  Commit,
  Contributor,
  AnalysisResult,
  MessageQualityScore,
  CommitSizeScore,
  CommitScore,
  ContributorScore,
  ContributorCategory,
  AntiPattern,
  AntiPatternType,
  RepositoryInsights,
  ScoredCommit,
  ScoredContributor,
  ScoredAnalysisResult,
} from '@/types';

// Conventional commit types
const CONVENTIONAL_COMMIT_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];

// Common imperative mood verbs
const IMPERATIVE_VERBS = [
  'add',
  'fix',
  'update',
  'remove',
  'delete',
  'change',
  'create',
  'implement',
  'refactor',
  'improve',
  'move',
  'rename',
  'merge',
  'revert',
  'bump',
  'release',
  'deploy',
  'configure',
  'enable',
  'disable',
  'set',
  'use',
  'apply',
  'clean',
  'optimize',
  'simplify',
  'extract',
  'convert',
  'replace',
  'handle',
  'support',
  'allow',
  'prevent',
  'ensure',
  'make',
  'init',
  'initialize',
  'introduce',
  'drop',
  'upgrade',
  'downgrade',
  'migrate',
  'integrate',
  'separate',
  'split',
  'combine',
  'consolidate',
];

// WIP indicators in commit messages
const WIP_INDICATORS = [
  'wip',
  'work in progress',
  'todo',
  'fixme',
  'temp',
  'temporary',
  'hack',
  'xxx',
  'debug',
  'testing',
  'test commit',
  'checkpoint',
  'save',
  'saving',
  'backup',
];

/**
 * Analyze message quality and return a score
 */
export function analyzeMessageQuality(message: string): MessageQualityScore {
  const firstLine = message.split('\n')[0].trim();
  const lowerFirstLine = firstLine.toLowerCase();

  // 1. Conventional Commits detection (40 points)
  let conventionalCommitScore = 0;
  let isConventionalCommit = false;
  let commitType: string | undefined;

  const conventionalMatch = firstLine.match(/^(\w+)(\(.+\))?!?:\s*.+/);
  if (conventionalMatch) {
    const type = conventionalMatch[1].toLowerCase();
    if (CONVENTIONAL_COMMIT_TYPES.includes(type)) {
      isConventionalCommit = true;
      commitType = type;
      conventionalCommitScore = 40;
    } else {
      // Has the format but unknown type - partial credit
      conventionalCommitScore = 20;
    }
  }

  // 2. Message length scoring (30 points)
  let messageLengthScore = 0;
  const length = firstLine.length;

  if (length >= 10 && length <= 72) {
    // Ideal length
    messageLengthScore = 30;
  } else if (length > 72 && length <= 100) {
    // Slightly too long
    messageLengthScore = 20;
  } else if (length > 100) {
    // Way too long
    messageLengthScore = 10;
  } else if (length >= 5 && length < 10) {
    // Too short
    messageLengthScore = 15;
  } else {
    // Very short (< 5 chars)
    messageLengthScore = 5;
  }

  // 3. Imperative mood detection (30 points)
  let imperativeMoodScore = 0;

  // Get the first word (after conventional commit prefix if present)
  let firstWord = firstLine;
  if (isConventionalCommit) {
    const colonIndex = firstLine.indexOf(':');
    if (colonIndex !== -1) {
      firstWord = firstLine.slice(colonIndex + 1).trim();
    }
  }
  firstWord = firstWord.split(/\s+/)[0].toLowerCase();

  // Check if starts with imperative verb
  if (IMPERATIVE_VERBS.includes(firstWord)) {
    imperativeMoodScore = 30;
  } else if (firstWord.endsWith('s') && IMPERATIVE_VERBS.includes(firstWord.slice(0, -1))) {
    // Third person singular (e.g., "adds" instead of "add") - partial credit
    imperativeMoodScore = 15;
  } else if (firstWord.endsWith('ed') || firstWord.endsWith('ing')) {
    // Past tense or gerund - minimal credit
    imperativeMoodScore = 10;
  } else {
    // Check if it at least starts with a capital letter and looks like a sentence
    if (/^[A-Z]/.test(firstLine) && firstLine.length > 10) {
      imperativeMoodScore = 15;
    } else {
      imperativeMoodScore = 5;
    }
  }

  const total = conventionalCommitScore + messageLengthScore + imperativeMoodScore;

  return {
    conventionalCommit: conventionalCommitScore,
    messageLength: messageLengthScore,
    imperativeMood: imperativeMoodScore,
    total,
    isConventionalCommit,
    commitType,
  };
}

/**
 * Analyze commit size and return a score
 */
export function analyzeCommitSize(
  linesChanged: number,
  filesChanged: number
): CommitSizeScore {
  const isGiantCommit = linesChanged > 1000;
  const isTinyCommit = linesChanged < 5;

  // 1. Lines changed scoring (50 points)
  // Ideal: 1-300 lines, acceptable: 300-500, large: 500-1000, giant: >1000
  let linesScore = 0;

  if (linesChanged === 0) {
    linesScore = 25; // Empty commit, neutral
  } else if (linesChanged >= 1 && linesChanged <= 300) {
    // Ideal range - full points
    linesScore = 50;
  } else if (linesChanged > 300 && linesChanged <= 500) {
    // Acceptable but getting large
    linesScore = 40;
  } else if (linesChanged > 500 && linesChanged <= 1000) {
    // Large commit
    linesScore = 25;
  } else {
    // Giant commit (>1000 lines)
    linesScore = 10;
  }

  // 2. Files changed scoring (50 points)
  // Ideal: 1-10 files, acceptable: 10-20, many: 20-50, too many: >50
  let filesScore = 0;

  if (filesChanged === 0) {
    filesScore = 25; // No files, neutral
  } else if (filesChanged >= 1 && filesChanged <= 10) {
    // Ideal range
    filesScore = 50;
  } else if (filesChanged > 10 && filesChanged <= 20) {
    // Acceptable
    filesScore = 40;
  } else if (filesChanged > 20 && filesChanged <= 50) {
    // Many files
    filesScore = 25;
  } else {
    // Too many files
    filesScore = 10;
  }

  const total = linesScore + filesScore;

  return {
    linesChanged: linesScore,
    filesChanged: filesScore,
    total,
    isGiantCommit,
    isTinyCommit,
  };
}

/**
 * Calculate overall commit score
 */
export function calculateCommitScore(commit: Commit): CommitScore {
  const messageQuality = analyzeMessageQuality(commit.message);
  const sizeScore = analyzeCommitSize(commit.stats.total, commit.stats.filesChanged);

  // Weighted score: 60% message quality, 40% size
  const overallScore = Math.round(messageQuality.total * 0.6 + sizeScore.total * 0.4);

  return {
    sha: commit.sha,
    messageQuality,
    sizeScore,
    overallScore,
  };
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Determine contributor category based on average score
 */
function determineCategory(averageScore: number): ContributorCategory {
  if (averageScore >= 80) {
    return 'Excellent';
  } else if (averageScore >= 60) {
    return 'Good';
  } else {
    return 'Needs Improvement';
  }
}

/**
 * Calculate contributor score from their commits
 */
export function calculateContributorScore(
  contributor: Contributor,
  commitScores: Map<string, CommitScore>
): ContributorScore {
  const scores: CommitScore[] = [];

  for (const commit of contributor.commits) {
    const score = commitScores.get(commit.sha);
    if (score) {
      scores.push(score);
    }
  }

  const overallScores = scores.map((s) => s.overallScore);
  const averageScore =
    overallScores.length > 0
      ? Math.round(overallScores.reduce((sum, s) => sum + s, 0) / overallScores.length)
      : 0;

  // Consistency score: 100 - stdDev (capped between 0 and 100)
  const stdDev = standardDeviation(overallScores);
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - stdDev)));

  const category = determineCategory(averageScore);

  return {
    email: contributor.email,
    averageScore,
    consistencyScore,
    category,
    commitScores: scores,
  };
}

/**
 * Detect anti-patterns in commits
 */
export function detectAntiPatterns(commits: Commit[]): RepositoryInsights {
  const antiPatterns: AntiPattern[] = [];
  let giantCommitCount = 0;
  let tinyCommitCount = 0;
  let wipCommitCount = 0;
  let mergeCommitCount = 0;

  for (const commit of commits) {
    const firstLine = commit.message.split('\n')[0].trim();
    const lowerMessage = commit.message.toLowerCase();

    // Giant commit detection
    if (commit.stats.total > 1000) {
      giantCommitCount++;
      antiPatterns.push({
        type: 'giant_commit',
        sha: commit.sha,
        message: firstLine,
        description: `This commit changes ${commit.stats.total.toLocaleString()} lines across ${commit.stats.filesChanged} files. Consider breaking large changes into smaller, focused commits.`,
      });
    }

    // Tiny commit with vague message detection
    if (commit.stats.total < 5 && firstLine.length < 20) {
      tinyCommitCount++;
      antiPatterns.push({
        type: 'tiny_commit',
        sha: commit.sha,
        message: firstLine,
        description: `This commit has only ${commit.stats.total} lines changed with a brief message. Consider combining related small changes.`,
      });
    }

    // WIP commit detection
    const isWip = WIP_INDICATORS.some(
      (indicator) =>
        lowerMessage.includes(indicator) ||
        firstLine.toLowerCase().startsWith(indicator)
    );
    if (isWip) {
      wipCommitCount++;
      antiPatterns.push({
        type: 'wip_commit',
        sha: commit.sha,
        message: firstLine,
        description: 'Work-in-progress commits should be squashed or amended before merging to main branch.',
      });
    }

    // Merge commit detection
    if (commit.isMergeCommit) {
      mergeCommitCount++;
      antiPatterns.push({
        type: 'merge_commit',
        sha: commit.sha,
        message: firstLine,
        description: 'Merge commits add noise to history. Consider using rebase workflow for cleaner history.',
      });
    }
  }

  return {
    antiPatterns,
    giantCommitCount,
    tinyCommitCount,
    wipCommitCount,
    mergeCommitCount,
  };
}

/**
 * Analyze an entire repository and return scored results
 */
export function analyzeRepository(analysisResult: AnalysisResult): ScoredAnalysisResult {
  // Score all commits
  const commitScoreMap = new Map<string, CommitScore>();
  const scoredCommits: ScoredCommit[] = [];

  for (const commit of analysisResult.commits) {
    const score = calculateCommitScore(commit);
    commitScoreMap.set(commit.sha, score);
    scoredCommits.push({
      ...commit,
      score,
    });
  }

  // Score all contributors
  const scoredContributors: ScoredContributor[] = analysisResult.contributors.map(
    (contributor) => {
      const score = calculateContributorScore(contributor, commitScoreMap);
      return {
        ...contributor,
        score,
      };
    }
  );

  // Sort contributors by average score (descending)
  scoredContributors.sort((a, b) => b.score.averageScore - a.score.averageScore);

  // Calculate repository-wide score
  const allScores = scoredCommits.map((c) => c.score.overallScore);
  const repositoryScore =
    allScores.length > 0
      ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
      : 0;

  // Detect anti-patterns
  const insights = detectAntiPatterns(analysisResult.commits);

  return {
    ...analysisResult,
    commits: scoredCommits,
    contributors: scoredContributors,
    repositoryScore,
    insights,
  };
}
