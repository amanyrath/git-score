import {
  AIEnhancedCommit,
  AIEnhancedContributor,
  CollaborationMetrics,
  FileOwnership,
  BusFactorAnalysis,
  CollaborationPattern,
  KnowledgeSilo,
  ReviewPattern,
} from '@/types';

/**
 * Analyze code collaboration metrics
 * Note: This provides estimates based on commit data since we don't have file-level change info
 */
export function analyzeCollaboration(
  commits: AIEnhancedCommit[],
  contributors: AIEnhancedContributor[]
): CollaborationMetrics {
  const fileOwnership = analyzeFileOwnership(commits);
  const busFactor = calculateBusFactor(contributors, fileOwnership);
  const collaborationPattern = detectCollaborationPattern(contributors, commits);
  const knowledgeSilos = detectKnowledgeSilos(contributors, fileOwnership);
  const reviewPatterns = analyzeReviewPatterns(commits);

  return {
    fileOwnership,
    busFactor,
    collaborationPattern,
    knowledgeSilos,
    reviewPatterns,
  };
}

/**
 * Analyze file ownership based on commit patterns
 * Since we don't have file-level data, we estimate based on commit frequency
 */
function analyzeFileOwnership(commits: AIEnhancedCommit[]): FileOwnership[] {
  // Group commits by apparent file type based on commit messages
  const filePatterns = extractFilePatterns(commits);

  // Track contributor activity per pattern
  const patternOwnership = new Map<string, Map<string, number>>();
  const patternLastModified = new Map<string, string>();

  for (const commit of commits) {
    const patterns = getCommitPatterns(commit.message);
    const email = commit.author.email.toLowerCase();

    for (const pattern of patterns) {
      if (!patternOwnership.has(pattern)) {
        patternOwnership.set(pattern, new Map());
      }

      const owners = patternOwnership.get(pattern)!;
      owners.set(email, (owners.get(email) || 0) + 1);

      // Track last modified
      const existing = patternLastModified.get(pattern);
      if (!existing || new Date(commit.timestamp) > new Date(existing)) {
        patternLastModified.set(pattern, commit.timestamp);
      }
    }
  }

  // Convert to FileOwnership format
  const ownership: FileOwnership[] = [];

  for (const [pattern, owners] of patternOwnership) {
    const totalCommits = Array.from(owners.values()).reduce((a, b) => a + b, 0);
    const sortedOwners = Array.from(owners.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sortedOwners.length > 0) {
      ownership.push({
        filePath: pattern,
        primaryOwner: sortedOwners[0][0],
        ownershipPercentage: Math.round((sortedOwners[0][1] / totalCommits) * 100),
        contributors: sortedOwners.map(([email, count]) => ({
          email,
          percentage: Math.round((count / totalCommits) * 100),
        })),
        lastModified: patternLastModified.get(pattern) || '',
      });
    }
  }

  return ownership.sort((a, b) => b.ownershipPercentage - a.ownershipPercentage);
}

/**
 * Extract file/area patterns from commits
 */
function extractFilePatterns(commits: AIEnhancedCommit[]): Set<string> {
  const patterns = new Set<string>();

  for (const commit of commits) {
    const extracted = getCommitPatterns(commit.message);
    extracted.forEach((p) => patterns.add(p));
  }

  return patterns;
}

/**
 * Get patterns from commit message (area/component inference)
 */
function getCommitPatterns(message: string): string[] {
  const patterns: string[] = [];
  const lower = message.toLowerCase();

  // Look for conventional commit scopes
  const scopeMatch = message.match(/^\w+\(([^)]+)\)/);
  if (scopeMatch) {
    patterns.push(scopeMatch[1]);
  }

  // Infer from keywords
  const keywords = [
    'api', 'auth', 'ui', 'frontend', 'backend', 'database', 'db',
    'test', 'config', 'build', 'ci', 'docs', 'readme', 'security',
    'component', 'service', 'util', 'helper', 'model', 'controller',
    'view', 'route', 'middleware', 'hook', 'context', 'store',
  ];

  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      patterns.push(keyword);
    }
  }

  // Default to 'general' if no patterns found
  if (patterns.length === 0) {
    patterns.push('general');
  }

  return [...new Set(patterns)]; // Remove duplicates
}

/**
 * Calculate bus factor
 */
function calculateBusFactor(
  contributors: AIEnhancedContributor[],
  ownership: FileOwnership[]
): BusFactorAnalysis {
  if (contributors.length === 0) {
    return {
      overallBusFactor: 0,
      criticalFiles: [],
      riskLevel: 'high',
      recommendation: 'No contributors found.',
    };
  }

  // Find areas with single owner (>80% ownership)
  const criticalFiles = ownership
    .filter((f) => f.ownershipPercentage > 80 && f.contributors.length === 1)
    .map((f) => f.filePath);

  // Calculate bus factor based on contributor distribution
  const totalCommits = contributors.reduce((sum, c) => sum + c.stats.totalCommits, 0);
  const sortedContributors = [...contributors]
    .sort((a, b) => b.stats.totalCommits - a.stats.totalCommits);

  // Bus factor = minimum number of contributors who cover 50% of commits
  let cumulativeCommits = 0;
  let busFactor = 0;
  for (const contrib of sortedContributors) {
    cumulativeCommits += contrib.stats.totalCommits;
    busFactor++;
    if (cumulativeCommits >= totalCommits * 0.5) break;
  }

  // Determine risk level
  let riskLevel: 'high' | 'medium' | 'low';
  let recommendation: string;

  if (busFactor === 1) {
    riskLevel = 'high';
    recommendation = 'Critical risk: One person controls most of the codebase. Encourage knowledge sharing and pair programming.';
  } else if (busFactor <= 2) {
    riskLevel = 'medium';
    recommendation = 'Moderate risk: Consider cross-training team members on critical areas.';
  } else {
    riskLevel = 'low';
    recommendation = 'Good knowledge distribution across the team.';
  }

  if (criticalFiles.length > 0) {
    recommendation += ` ${criticalFiles.length} area(s) have single owners.`;
  }

  return {
    overallBusFactor: busFactor,
    criticalFiles,
    riskLevel,
    recommendation,
  };
}

/**
 * Detect overall collaboration pattern
 */
function detectCollaborationPattern(
  contributors: AIEnhancedContributor[],
  commits: AIEnhancedCommit[]
): CollaborationPattern {
  if (contributors.length <= 1) {
    return {
      type: 'siloed',
      description: 'Single contributor project.',
      collaborationScore: 0,
    };
  }

  // Calculate how evenly distributed commits are
  const totalCommits = commits.length;
  const idealPerContributor = totalCommits / contributors.length;

  const deviations = contributors.map((c) =>
    Math.abs(c.stats.totalCommits - idealPerContributor) / idealPerContributor
  );
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;

  // Check for merge commits as indicator of collaboration
  const mergeRatio = commits.filter((c) => c.isMergeCommit).length / totalCommits;

  // Calculate collaboration score
  const distributionScore = Math.max(0, 100 - avgDeviation * 100);
  const mergeScore = Math.min(mergeRatio * 200, 50); // Cap at 50
  const collaborationScore = Math.round((distributionScore * 0.7 + mergeScore * 0.3));

  let type: 'siloed' | 'collaborative' | 'mixed';
  let description: string;

  if (collaborationScore >= 70) {
    type = 'collaborative';
    description = 'Team shows good collaboration with balanced contributions and regular code reviews.';
  } else if (collaborationScore >= 40) {
    type = 'mixed';
    description = 'Some collaboration exists but contributions are unevenly distributed.';
  } else {
    type = 'siloed';
    description = 'Work is heavily siloed with little overlap between contributors.';
  }

  return {
    type,
    description,
    collaborationScore,
  };
}

/**
 * Detect knowledge silos
 */
function detectKnowledgeSilos(
  contributors: AIEnhancedContributor[],
  ownership: FileOwnership[]
): KnowledgeSilo[] {
  const silos: KnowledgeSilo[] = [];

  // Group exclusive areas by contributor
  const contributorExclusiveAreas = new Map<string, string[]>();

  for (const area of ownership) {
    if (area.ownershipPercentage >= 90 && area.contributors.length === 1) {
      const owner = area.primaryOwner;
      if (!contributorExclusiveAreas.has(owner)) {
        contributorExclusiveAreas.set(owner, []);
      }
      contributorExclusiveAreas.get(owner)!.push(area.filePath);
    }
  }

  for (const [email, exclusiveFiles] of contributorExclusiveAreas) {
    if (exclusiveFiles.length === 0) continue;

    const contributor = contributors.find(
      (c) => c.email.toLowerCase() === email
    );
    const name = contributor?.name || email;

    let siloRisk: 'high' | 'medium' | 'low';
    let recommendation: string;

    if (exclusiveFiles.length >= 3) {
      siloRisk = 'high';
      recommendation = `${name} is the sole contributor to ${exclusiveFiles.length} areas. Consider pair programming or documentation.`;
    } else if (exclusiveFiles.length >= 2) {
      siloRisk = 'medium';
      recommendation = `${name} has exclusive knowledge of ${exclusiveFiles.length} areas. Plan for knowledge transfer.`;
    } else {
      siloRisk = 'low';
      recommendation = `Minor silo detected for ${name}. Monitor for growth.`;
    }

    silos.push({
      contributor: name,
      exclusiveFiles,
      siloRisk,
      recommendation,
    });
  }

  return silos.sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    return riskOrder[a.siloRisk] - riskOrder[b.siloRisk];
  });
}

/**
 * Analyze review patterns from merge commits
 */
function analyzeReviewPatterns(commits: AIEnhancedCommit[]): ReviewPattern {
  const mergeCommits = commits.filter((c) => c.isMergeCommit);
  const hasMergeCommits = mergeCommits.length > 0;
  const mergeCommitRatio = commits.length > 0 ? mergeCommits.length / commits.length : 0;

  // Calculate average time between merges
  let averageTimeBetweenMerges = 0;
  if (mergeCommits.length >= 2) {
    const sortedMerges = mergeCommits
      .map((c) => new Date(c.timestamp).getTime())
      .sort((a, b) => a - b);

    let totalTime = 0;
    for (let i = 1; i < sortedMerges.length; i++) {
      totalTime += sortedMerges[i] - sortedMerges[i - 1];
    }
    averageTimeBetweenMerges = totalTime / (sortedMerges.length - 1) / (1000 * 60 * 60); // Convert to hours
  }

  // Count merges by author
  const mergerCounts = new Map<string, number>();
  for (const commit of mergeCommits) {
    const name = commit.author.name;
    mergerCounts.set(name, (mergerCounts.get(name) || 0) + 1);
  }

  const topMergers = Array.from(mergerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    hasMergeCommits,
    mergeCommitRatio: Math.round(mergeCommitRatio * 100) / 100,
    averageTimeBetweenMerges: Math.round(averageTimeBetweenMerges),
    topMergers,
  };
}

/**
 * Generate collaboration insights
 */
export function generateCollaborationInsights(metrics: CollaborationMetrics): string[] {
  const insights: string[] = [];

  // Bus factor insight
  if (metrics.busFactor.riskLevel === 'high') {
    insights.push(`High bus factor risk: ${metrics.busFactor.recommendation}`);
  }

  // Collaboration pattern insight
  if (metrics.collaborationPattern.type === 'siloed') {
    insights.push(`Siloed development detected: ${metrics.collaborationPattern.description}`);
  }

  // Knowledge silo insights
  const highRiskSilos = metrics.knowledgeSilos.filter((s) => s.siloRisk === 'high');
  if (highRiskSilos.length > 0) {
    insights.push(
      `${highRiskSilos.length} contributor(s) have exclusive knowledge of critical areas.`
    );
  }

  // Review pattern insights
  if (!metrics.reviewPatterns.hasMergeCommits) {
    insights.push(
      'No merge commits detected. Consider implementing a code review process with pull requests.'
    );
  } else if (metrics.reviewPatterns.mergeCommitRatio < 0.1) {
    insights.push(
      'Low merge commit ratio. Most commits are direct to branch without review.'
    );
  }

  return insights;
}
