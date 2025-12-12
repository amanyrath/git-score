'use client';

import { Repository } from '@/types';

interface RepoInfoProps {
  repository: Repository;
  totalCommits: number;
}

export function RepoInfo({ repository, totalCommits }: RepoInfoProps): React.ReactElement {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{repository.fullName}</h2>
          {repository.description && (
            <p className="mt-1 text-gray-600">{repository.description}</p>
          )}
        </div>
        <a
          href={repository.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View on GitHub
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Commits Analyzed</p>
          <p className="text-xl font-bold text-gray-900">{totalCommits}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Stars</p>
          <p className="text-xl font-bold text-gray-900">{repository.starCount.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Language</p>
          <p className="text-xl font-bold text-gray-900">{repository.language || 'N/A'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Default Branch</p>
          <p className="text-xl font-bold text-gray-900">{repository.defaultBranch}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-sm text-gray-500">
        <span>Created: {formatDate(repository.createdAt)}</span>
        <span>Updated: {formatDate(repository.updatedAt)}</span>
      </div>
    </div>
  );
}
