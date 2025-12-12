'use client';

import { ScoredContributor, ContributorCategory } from '@/types';

interface ContributorCardProps {
  contributor: ScoredContributor;
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

export function ContributorCard({ contributor }: ContributorCardProps): React.ReactElement {
  const { name, email, avatarUrl, stats, score } = contributor;

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
          <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(score.category)}`}>
            {score.category}
          </span>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <div className={`w-12 h-12 rounded-full ${getScoreBgColor(score.averageScore)} ring-2 flex items-center justify-center`}>
            <span className={`text-lg font-bold ${getScoreColor(score.averageScore)}`}>
              {score.averageScore}
            </span>
          </div>
          <p className="text-xs text-gray-500">{stats.totalCommits} commits</p>
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
