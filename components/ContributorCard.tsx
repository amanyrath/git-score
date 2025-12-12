'use client';

import { AIEnhancedContributor, ContributorCategory, CommitIntent } from '@/types';

interface ContributorCardProps {
  contributor: AIEnhancedContributor;
}

function getCategoryColor(category: ContributorCategory): string {
  switch (category) {
    case 'Excellent':
      return 'bg-green-100 text-green-800';
    case 'Good':
      return 'bg-yellow-100 text-yellow-800';
    case 'Needs Improvement':
      return 'bg-red-100 text-red-800';
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100 ring-green-500';
  if (score >= 60) return 'bg-yellow-100 ring-yellow-500';
  return 'bg-red-100 ring-red-500';
}

function getIntentColor(intent: CommitIntent): string {
  const colors: Record<CommitIntent, string> = {
    feature: 'bg-purple-100 text-purple-800',
    bugfix: 'bg-red-100 text-red-800',
    refactor: 'bg-blue-100 text-blue-800',
    docs: 'bg-green-100 text-green-800',
    test: 'bg-yellow-100 text-yellow-800',
    style: 'bg-pink-100 text-pink-800',
    chore: 'bg-gray-100 text-gray-800',
    performance: 'bg-orange-100 text-orange-800',
    security: 'bg-red-100 text-red-800',
  };
  return colors[intent] || 'bg-gray-100 text-gray-800';
}

function formatIntent(intent: CommitIntent): string {
  return intent.charAt(0).toUpperCase() + intent.slice(1);
}

export function ContributorCard({ contributor }: ContributorCardProps): React.ReactElement {
  const { name, email, avatarUrl, stats, score, aiAverageScore, dominantIntent } = contributor;

  // Use AI score if available, otherwise fall back to heuristic score
  const displayScore = aiAverageScore ?? score.averageScore;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-lg font-medium text-gray-500">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-sm text-gray-500 truncate">{email}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(score.category)}`}>
              {score.category}
            </span>
            {dominantIntent && (
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getIntentColor(dominantIntent)}`}>
                {formatIntent(dominantIntent)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <div className={`w-12 h-12 rounded-full ${getScoreBgColor(displayScore)} ring-2 flex items-center justify-center`}>
            <span className={`text-lg font-bold ${getScoreColor(displayScore)}`}>
              {displayScore}
            </span>
          </div>
          <p className="text-xs text-gray-500">{stats.totalCommits} commits</p>
          {aiAverageScore !== undefined && (
            <p className="text-xs text-purple-600">AI Score</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Consistency</p>
          <p className={`font-medium ${getScoreColor(score.consistencyScore)}`}>
            {score.consistencyScore}%
          </p>
        </div>
        <div>
          <p className="text-gray-500">Avg Commit Size</p>
          <p className="font-medium text-gray-900">{stats.averageCommitSize.toLocaleString()} lines</p>
        </div>
        <div>
          <p className="text-gray-500">Lines Added</p>
          <p className="font-medium text-green-600">+{stats.totalAdditions.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Lines Deleted</p>
          <p className="font-medium text-red-600">-{stats.totalDeletions.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        Active: {formatDate(stats.firstCommitDate)} - {formatDate(stats.lastCommitDate)}
      </div>
    </div>
  );
}
