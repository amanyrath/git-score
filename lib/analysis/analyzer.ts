import { v4 as uuidv4 } from 'uuid';
import { groupBy, mean } from 'lodash';
import type {
  Commit,
  Repository,
  AnalysisResult,
  ContributorAnalysis,
  Recommendation,
} from '@/types';
import { calculateScore, calculateContributorScores } from './scoring';

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
    patterns: {
      workingHours: [...new Set(workingHours)].sort((a, b) => a - b),
      preferredDays: [...new Set(preferredDays)].sort((a, b) => a - b),
      velocity: Math.round(velocity * 100) / 100,
    },
  };
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  commits: Commit[],
  categoryScores: { messageQuality: number; commitSize: number; consistency: number }
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Message quality recommendations
  if (categoryScores.messageQuality < 30) {
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
  if (categoryScores.commitSize < 25) {
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
  if (categoryScores.consistency < 20) {
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

  return recommendations.slice(0, 3); // Return top 3 recommendations
}

/**
 * Main analysis function
 */
export function analyzeRepository(
  repository: Repository,
  commits: Commit[]
): AnalysisResult {
  // Calculate overall scores
  const score = calculateScore(commits);

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

  // Generate recommendations
  const recommendations = generateRecommendations(commits, score.breakdown);

  return {
    id: uuidv4(),
    repository,
    analyzedAt: new Date(),
    commits,
    totalCommits: commits.length,
    dateRange,
    contributors,
    totalContributors: contributors.length,
    overallScore: score.total,
    categoryScores: score.breakdown,
    recommendations,
  };
}
