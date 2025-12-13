import type {
  Commit,
  ContributorAnalysis,
  CollaborationMetrics,
  FileOwnership,
  KnowledgeSilo,
} from '@/types';

/**
 * Analyze file ownership and detect knowledge silos
 */
export function analyzeCollaboration(
  commits: Commit[],
  contributors: ContributorAnalysis[]
): CollaborationMetrics {
  // Track which contributors touched which files
  const fileContributors = new Map<string, Map<string, number>>();

  for (const commit of commits) {
    const email = commit.author.email;

    // Use stats.filesChanged as proxy since we don't have file list in GraphQL
    // For a more accurate analysis, we'd need file-level data
    // For now, group by commit message patterns or use a placeholder approach

    // Create a pseudo-file based on the commit scope/type
    const scopeMatch = commit.message.match(/^(\w+)(?:\(([^)]+)\))?:/);
    const scope = scopeMatch ? scopeMatch[2] || scopeMatch[1] : 'general';
    const pseudoFile = `${scope}/*`;

    if (!fileContributors.has(pseudoFile)) {
      fileContributors.set(pseudoFile, new Map());
    }

    const contributors = fileContributors.get(pseudoFile)!;
    contributors.set(email, (contributors.get(email) || 0) + 1);
  }

  // Calculate file ownership
  const fileOwnership: FileOwnership[] = [];
  for (const [filename, contributorMap] of fileContributors) {
    const contributors = Array.from(contributorMap.keys());
    const totalChanges = Array.from(contributorMap.values()).reduce((a, b) => a + b, 0);

    let primaryOwner = '';
    let maxChanges = 0;
    for (const [email, changes] of contributorMap) {
      if (changes > maxChanges) {
        maxChanges = changes;
        primaryOwner = email;
      }
    }

    fileOwnership.push({
      filename,
      contributors,
      totalChanges,
      primaryOwner,
      ownershipPercent: Math.round((maxChanges / totalChanges) * 100),
    });
  }

  // Detect knowledge silos (files with only one contributor)
  const exclusiveFilesByContributor = new Map<string, string[]>();
  for (const ownership of fileOwnership) {
    if (ownership.contributors.length === 1) {
      const email = ownership.contributors[0];
      if (!exclusiveFilesByContributor.has(email)) {
        exclusiveFilesByContributor.set(email, []);
      }
      exclusiveFilesByContributor.get(email)!.push(ownership.filename);
    }
  }

  const knowledgeSilos: KnowledgeSilo[] = [];
  for (const [email, files] of exclusiveFilesByContributor) {
    const contributor = contributors.find((c) => c.author.email === email);
    const name = contributor?.author.name || email;

    // Risk level based on number of exclusive files
    let riskLevel: 'high' | 'medium' | 'low' = 'low';
    if (files.length >= 5) riskLevel = 'high';
    else if (files.length >= 2) riskLevel = 'medium';

    knowledgeSilos.push({
      contributor: name,
      email,
      exclusiveFiles: files,
      riskLevel,
    });
  }

  // Sort by risk level
  knowledgeSilos.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.riskLevel] - order[b.riskLevel];
  });

  // Calculate bus factor (minimum contributors needed to cover 50% of files)
  const contributorCoverage = new Map<string, Set<string>>();
  for (const ownership of fileOwnership) {
    for (const email of ownership.contributors) {
      if (!contributorCoverage.has(email)) {
        contributorCoverage.set(email, new Set());
      }
      contributorCoverage.get(email)!.add(ownership.filename);
    }
  }

  // Sort contributors by number of files they know
  const sortedContributors = Array.from(contributorCoverage.entries())
    .sort((a, b) => b[1].size - a[1].size);

  const totalFiles = fileOwnership.length;
  const targetCoverage = totalFiles * 0.5;
  let coveredFiles = new Set<string>();
  let busFactor = 0;

  for (const [, files] of sortedContributors) {
    for (const file of files) {
      coveredFiles.add(file);
    }
    busFactor++;
    if (coveredFiles.size >= targetCoverage) break;
  }

  // Calculate collaboration score
  // Higher is better - penalize silos and low bus factor
  const siloCount = knowledgeSilos.filter((s) => s.riskLevel !== 'low').length;
  const avgContributorsPerFile =
    fileOwnership.reduce((sum, f) => sum + f.contributors.length, 0) / fileOwnership.length;

  let collaborationScore = 100;
  collaborationScore -= siloCount * 10; // -10 per high/medium silo
  collaborationScore -= Math.max(0, 3 - busFactor) * 15; // -15 if bus factor < 3
  if (avgContributorsPerFile < 2) collaborationScore -= 20;

  collaborationScore = Math.max(0, Math.min(100, collaborationScore));

  return {
    busFactor: Math.max(1, busFactor),
    knowledgeSilos,
    fileOwnership,
    collaborationScore: Math.round(collaborationScore),
  };
}
