import { AIEnhancedAnalysisResult, AIEnhancedContributor, AIEnhancedCommit } from '@/types';

/**
 * Export analysis result as JSON file
 */
export function exportAsJSON(result: AIEnhancedAnalysisResult): void {
  const data = JSON.stringify(result, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${result.repository.fullName.replace('/', '-')}-analysis.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export contributor report as CSV file
 */
export function exportContributorsAsCSV(contributors: AIEnhancedContributor[]): void {
  const headers = [
    'Name',
    'Email',
    'Total Commits',
    'Lines Added',
    'Lines Deleted',
    'Average Commit Size',
    'Average Score',
    'AI Score',
    'Consistency Score',
    'Category',
    'Dominant Intent',
    'First Commit',
    'Last Commit',
  ];

  const rows = contributors.map((c) => [
    c.name,
    c.email,
    c.stats.totalCommits,
    c.stats.totalAdditions,
    c.stats.totalDeletions,
    c.stats.averageCommitSize,
    c.score.averageScore,
    c.aiAverageScore ?? '',
    c.score.consistencyScore,
    c.score.category,
    c.dominantIntent ?? '',
    c.stats.firstCommitDate,
    c.stats.lastCommitDate,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const str = String(cell);
        // Escape quotes and wrap in quotes if contains comma
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'contributors-report.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export commits as CSV file
 */
export function exportCommitsAsCSV(commits: AIEnhancedCommit[]): void {
  const headers = [
    'SHA',
    'Message',
    'Author',
    'Email',
    'Date',
    'Additions',
    'Deletions',
    'Files Changed',
    'Overall Score',
    'AI Score',
    'Intent',
    'Clarity Score',
    'Completeness Score',
    'Is Merge',
  ];

  const rows = commits.map((c) => [
    c.sha.slice(0, 7),
    c.message.split('\n')[0].slice(0, 100),
    c.author.name,
    c.author.email,
    c.timestamp,
    c.stats.additions,
    c.stats.deletions,
    c.stats.filesChanged,
    c.score.overallScore,
    c.enhancedScore?.overallScore ?? '',
    c.enhancedScore?.semanticAnalysis.intent ?? '',
    c.enhancedScore?.clarityScore ?? '',
    c.enhancedScore?.completenessScore ?? '',
    c.isMergeCommit ? 'Yes' : 'No',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'commits-report.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate shareable link (stores in localStorage and returns ID)
 */
export function generateShareableLink(result: AIEnhancedAnalysisResult): string {
  const id = `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Store in localStorage with expiration (24 hours)
  const storageData = {
    result,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };

  try {
    localStorage.setItem(id, JSON.stringify(storageData));
  } catch (e) {
    console.error('Failed to store analysis:', e);
  }

  return id;
}

/**
 * Load analysis from localStorage by ID
 */
export function loadSharedAnalysis(id: string): AIEnhancedAnalysisResult | null {
  try {
    const stored = localStorage.getItem(id);
    if (!stored) return null;

    const data = JSON.parse(stored);

    // Check expiration
    if (data.expiresAt && Date.now() > data.expiresAt) {
      localStorage.removeItem(id);
      return null;
    }

    return data.result;
  } catch {
    return null;
  }
}

/**
 * Copy shareable URL to clipboard
 */
export async function copyShareableLink(id: string): Promise<boolean> {
  const url = `${window.location.origin}/shared/${id}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
