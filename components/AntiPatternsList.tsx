'use client';

import { RepositoryInsights, AntiPattern, AntiPatternType } from '@/types';

interface AntiPatternsListProps {
  insights: RepositoryInsights;
}

function getAntiPatternIcon(type: AntiPatternType): string {
  switch (type) {
    case 'giant_commit':
      return '!!';
    case 'tiny_commit':
      return '..';
    case 'wip_commit':
      return 'WIP';
    case 'merge_commit':
      return 'M';
    default:
      return '?';
  }
}

function getAntiPatternColor(type: AntiPatternType): string {
  switch (type) {
    case 'giant_commit':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'tiny_commit':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'wip_commit':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'merge_commit':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getAntiPatternLabel(type: AntiPatternType): string {
  switch (type) {
    case 'giant_commit':
      return 'Giant Commit';
    case 'tiny_commit':
      return 'Tiny Commit';
    case 'wip_commit':
      return 'WIP Commit';
    case 'merge_commit':
      return 'Merge Commit';
    default:
      return 'Unknown';
  }
}

function AntiPatternItem({ pattern }: { pattern: AntiPattern }): React.ReactElement {
  return (
    <div className={`p-4 rounded-lg border ${getAntiPatternColor(pattern.type)}`}>
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs px-2 py-1 bg-white/50 rounded">
          {getAntiPatternIcon(pattern.type)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{getAntiPatternLabel(pattern.type)}</span>
            <span className="font-mono text-xs opacity-70">{pattern.sha.slice(0, 7)}</span>
          </div>
          <p className="text-sm truncate font-mono opacity-80">{pattern.message}</p>
          <p className="text-xs mt-1 opacity-70">{pattern.description}</p>
        </div>
      </div>
    </div>
  );
}

export function AntiPatternsList({ insights }: AntiPatternsListProps): React.ReactElement {
  const { antiPatterns, giantCommitCount, tinyCommitCount, wipCommitCount, mergeCommitCount } = insights;

  const totalIssues = giantCommitCount + tinyCommitCount + wipCommitCount;
  const hasIssues = totalIssues > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Repository Insights</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{giantCommitCount}</p>
          <p className="text-xs text-red-700">Giant Commits</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{tinyCommitCount}</p>
          <p className="text-xs text-yellow-700">Tiny Commits</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{wipCommitCount}</p>
          <p className="text-xs text-orange-700">WIP Commits</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{mergeCommitCount}</p>
          <p className="text-xs text-blue-700">Merge Commits</p>
        </div>
      </div>

      {/* Anti-patterns list */}
      {hasIssues ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Detected Anti-Patterns ({antiPatterns.filter(p => p.type !== 'merge_commit').length})
          </h3>
          {antiPatterns
            .filter((p) => p.type !== 'merge_commit') // Don't show all merge commits
            .slice(0, 10) // Limit to 10 items
            .map((pattern, index) => (
              <AntiPatternItem key={`${pattern.sha}-${index}`} pattern={pattern} />
            ))}
          {antiPatterns.filter(p => p.type !== 'merge_commit').length > 10 && (
            <p className="text-sm text-gray-500 text-center">
              And {antiPatterns.filter(p => p.type !== 'merge_commit').length - 10} more...
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg font-medium">Great job!</p>
          <p className="text-sm">No major anti-patterns detected in this repository.</p>
        </div>
      )}
    </div>
  );
}
