import { v4 as uuidv4 } from 'uuid';
import { groupBy, mean } from 'lodash';
import type {
  Commit,
  Repository,
  AnalysisResult,
  ContributorAnalysis,
  Recommendation,
  RepositoryInsights,
} from '@/types';
import {
  calculateScore,
  calculateContributorScores,
  calculateContributorScore,
  scoreAllCommits,
  generateRepositoryInsights,
} from './scoring';

/**
 * Group commits by author email
 */
function groupCommitsByAuthor(commits: Commit[]): Record<string, Commit[]> {
  return groupBy(commits, (c) => c.author.email);
}

/**
 * Analyze contributor from their commits
 */
function analyzeContributor(commits: Commit[]): ContributorAnalysis {
  const author = commits[0].author;
  const scores = calculateContributorScores(commits);

  // Checkpoint 2: Enhanced contributor scoring
  const scoring = calculateContributorScore(commits);

  const totalAdditions = commits.reduce((sum, c) => sum + c.stats.additions, 0);
  const totalDeletions = commits.reduce((sum, c) => sum + c.stats.deletions, 0);
  const avgCommitSize = mean(commits.map((c) => c.stats.total));
  const filesChanged = new Set(commits.flatMap((c) => c.files.map((f) => f.filename))).size;

  // Calculate first and last commit dates
  const timestamps = commits.map((c) => c.timestamp.getTime());
  const firstCommitDate = new Date(Math.min(...timestamps));
  const lastCommitDate = new Date(Math.max(...timestamps));

  // Analyze working patterns
  const workingHours = commits.map((c) => c.timestamp.getHours());
  const preferredDays = commits.map((c) => c.timestamp.getDay());

  // Calculate velocity (commits per day)
  const timeSpanDays = Math.max(1, (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24));
  const velocity = commits.length / timeSpanDays;

  return {
    author,
    commits,
    totalCommits: commits.length,
    stats: {
      totalAdditions,
      totalDeletions,
      avgCommitSize: Math.round(avgCommitSize),
      filesChanged,
      firstCommitDate,
      lastCommitDate,
    },
    scores,
    scoring,
    patterns: {
      workingHours: [...new Set(workingHours)].sort((a, b) => a - b),
      preferredDays: [...new Set(preferredDays)].sort((a, b) => a - b),
      velocity: Math.round(velocity * 100) / 100,
    },
  };
}

/**
 * Generate recommendations based on analysis and anti-patterns
 */
function generateRecommendations(
  commits: Commit[],
  categoryScores: { messageQuality: number; commitSize: number; consistency: number },
  insights: RepositoryInsights
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { antiPatterns } = insights;

  // Giant commits anti-pattern
  if (antiPatterns.giantCommits.length > 0) {
    recommendations.push({
      id: uuidv4(),
      priority: 'high',
      category: 'Commit Size',
      title: 'Avoid Giant Commits',
      description: `Found ${antiPatterns.giantCommits.length} commit(s) with over 1000 lines changed. Large commits are hard to review and debug.`,
      actionItems: [
        'Break large changes into smaller, logical commits',
        'Use git add -p to stage partial changes',
        'Consider feature flags for incremental releases',
      ],
    });
  }

  // WIP commits anti-pattern
  if (antiPatterns.wipCommits.length > 0) {
    recommendations.push({
      id: uuidv4(),
      priority: 'medium',
      category: 'Message Quality',
      title: 'Avoid WIP Commits',
      description: `Found ${antiPatterns.wipCommits.length} work-in-progress commit(s). WIP commits should be squashed before merging.`,
      actionItems: [
        'Use git rebase -i to squash WIP commits',
        'Write meaningful commit messages from the start',
        'Use git stash for temporary saves instead',
      ],
    });
  }

  // Tiny commits with vague messages
  if (antiPatterns.tinyCommits.length > 0) {
    recommendations.push({
      id: uuidv4(),
      priority: 'medium',
      category: 'Message Quality',
      title: 'Improve Small Commit Messages',
      description: `Found ${antiPatterns.tinyCommits.length} tiny commit(s) with vague messages. Even small changes deserve clear descriptions.`,
      actionItems: [
        'Describe what the change does, not just "fix" or "update"',
        'Include context about why the change was needed',
        'Consider combining related tiny commits',
      ],
    });
  }

  // Message quality recommendations
  if (categoryScores.messageQuality < 30 && recommendations.length < 3) {
    recommendations.push({
      id: uuidv4(),
      priority: 'high',
      category: 'Message Quality',
      title: 'Adopt Conventional Commits',
      description: 'Your commit messages could benefit from following a standard format like Conventional Commits.',
      actionItems: [
        'Use prefixes like feat:, fix:, docs:, refactor:',
        'Keep the first line under 72 characters',
        'Use imperative mood (e.g., "Add feature" not "Added feature")',
      ],
    });
  }

  // Commit size recommendations
  if (categoryScores.commitSize < 25 && recommendations.length < 3) {
    recommendations.push({
      id: uuidv4(),
      priority: 'high',
      category: 'Commit Size',
      title: 'Make Smaller, Atomic Commits',
      description: 'Your commits tend to be large. Breaking them into smaller, focused changes improves reviewability.',
      actionItems: [
        'Aim for commits under 200 lines of change',
        'Each commit should represent one logical change',
        'Use git add -p to stage partial changes',
      ],
    });
  }

  // Consistency recommendations
  if (categoryScores.consistency < 20 && recommendations.length < 3) {
    recommendations.push({
      id: uuidv4(),
      priority: 'medium',
      category: 'Consistency',
      title: 'Commit More Regularly',
      description: 'Your commits are clustered together. Regular commits create better history and reduce merge conflicts.',
      actionItems: [
        'Commit at least once per work session',
        'Don\'t let work pile up before committing',
        'Use feature branches for isolated work',
      ],
    });
  }

  // If doing well, add encouragement
  if (recommendations.length === 0) {
    recommendations.push({
      id: uuidv4(),
      priority: 'low',
      category: 'General',
      title: 'Keep Up the Good Work!',
      description: 'Your Git practices are solid. Consider these tips to go from good to great.',
      actionItems: [
        'Add detailed commit bodies for complex changes',
        'Consider using git hooks for commit message validation',
        'Document your branching strategy for team alignment',
      ],
    });
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

/**
 * Main analysis function
 */
export function analyzeRepository(
  repository: Repository,
  commits: Commit[]
): AnalysisResult {
  // Calculate overall scores (legacy)
  const score = calculateScore(commits);

  // Checkpoint 2: Score all commits individually
  const commitScores = scoreAllCommits(commits);

  // Checkpoint 2: Generate repository insights with anti-patterns
  const insights = generateRepositoryInsights(commits);

  // Group and analyze contributors
  const commitsByAuthor = groupCommitsByAuthor(commits);
  const contributors = Object.values(commitsByAuthor)
    .map(analyzeContributor)
    .sort((a, b) => b.totalCommits - a.totalCommits);

  // Get date range
  const timestamps = commits.map((c) => c.timestamp);
  const dateRange: [Date, Date] = [
    new Date(Math.min(...timestamps.map((t) => t.getTime()))),
    new Date(Math.max(...timestamps.map((t) => t.getTime()))),
  ];

  // Generate recommendations based on insights
  const recommendations = generateRecommendations(commits, score.breakdown, insights);

  return {
    id: uuidv4(),
    repository,
    analyzedAt: new Date(),
    commits,
    totalCommits: commits.length,
    dateRange,
    contributors,
    totalContributors: contributors.length,
    overallScore: insights.averageScore, // Use new average score
    categoryScores: score.breakdown,
    commitScores,
    insights,
    recommendations,
  };
}
