'use client';

import { Contributor } from '@/types';

interface ContributorCardProps {
  contributor: Contributor;
}

export function ContributorCard({ contributor }: ContributorCardProps): React.ReactElement {
  const { name, email, avatarUrl, stats } = contributor;

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
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{stats.totalCommits}</p>
          <p className="text-xs text-gray-500">commits</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Lines Added</p>
          <p className="font-medium text-green-600">+{stats.totalAdditions.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Lines Deleted</p>
          <p className="font-medium text-red-600">-{stats.totalDeletions.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Avg Commit Size</p>
          <p className="font-medium text-gray-900">{stats.averageCommitSize.toLocaleString()} lines</p>
        </div>
        <div>
          <p className="text-gray-500">Active Period</p>
          <p className="font-medium text-gray-900 text-xs">
            {formatDate(stats.firstCommitDate)} - {formatDate(stats.lastCommitDate)}
          </p>
        </div>
      </div>
    </div>
  );
}
