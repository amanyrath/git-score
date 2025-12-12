'use client';

import { useState } from 'react';
import { AIEnhancedContributor, CommitIntent } from '@/types';

export interface FilterState {
  dateRange: { start: string; end: string };
  contributors: string[];
  scoreRange: { min: number; max: number };
  commitTypes: CommitIntent[];
  hideAntiPatterns: boolean;
}

interface FilterPanelProps {
  contributors: AIEnhancedContributor[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  totalCommits: number;
  filteredCount: number;
}

const ALL_INTENTS: CommitIntent[] = [
  'feature',
  'bugfix',
  'refactor',
  'docs',
  'test',
  'style',
  'chore',
  'performance',
  'security',
];

export function FilterPanel({
  contributors,
  filters,
  onFilterChange,
  totalCommits,
  filteredCount,
}: FilterPanelProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleReset = (): void => {
    onFilterChange({
      dateRange: { start: '', end: '' },
      contributors: [],
      scoreRange: { min: 0, max: 100 },
      commitTypes: [],
      hideAntiPatterns: false,
    });
  };

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ): void => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleContributor = (email: string): void => {
    const current = filters.contributors;
    if (current.includes(email)) {
      updateFilter(
        'contributors',
        current.filter((e) => e !== email)
      );
    } else {
      updateFilter('contributors', [...current, email]);
    }
  };

  const toggleCommitType = (type: CommitIntent): void => {
    const current = filters.commitTypes;
    if (current.includes(type)) {
      updateFilter(
        'commitTypes',
        current.filter((t) => t !== type)
      );
    } else {
      updateFilter('commitTypes', [...current, type]);
    }
  };

  const hasActiveFilters =
    filters.dateRange.start !== '' ||
    filters.dateRange.end !== '' ||
    filters.contributors.length > 0 ||
    filters.scoreRange.min > 0 ||
    filters.scoreRange.max < 100 ||
    filters.commitTypes.length > 0 ||
    filters.hideAntiPatterns;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <span className="text-sm text-gray-500">
            Showing {filteredCount} of {totalCommits} commits
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Filters Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) =>
                  updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })
                }
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) =>
                  updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })
                }
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Score Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Score Range: {filters.scoreRange.min} - {filters.scoreRange.max}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.scoreRange.min}
                onChange={(e) =>
                  updateFilter('scoreRange', {
                    ...filters.scoreRange,
                    min: Math.min(parseInt(e.target.value), filters.scoreRange.max),
                  })
                }
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.scoreRange.max}
                onChange={(e) =>
                  updateFilter('scoreRange', {
                    ...filters.scoreRange,
                    max: Math.max(parseInt(e.target.value), filters.scoreRange.min),
                  })
                }
                className="flex-1"
              />
            </div>
          </div>

          {/* Contributors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contributors
            </label>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {contributors.slice(0, 8).map((c) => (
                <button
                  key={c.email}
                  onClick={() => toggleContributor(c.email)}
                  className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                    filters.contributors.includes(c.email)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c.name.length > 10 ? c.name.slice(0, 10) + '...' : c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Commit Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commit Types
            </label>
            <div className="flex flex-wrap gap-1">
              {ALL_INTENTS.slice(0, 6).map((type) => (
                <button
                  key={type}
                  onClick={() => toggleCommitType(type)}
                  className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                    filters.commitTypes.includes(type)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Anti-patterns toggle */}
          <div className="flex items-center gap-2 col-span-full">
            <input
              type="checkbox"
              id="hideAntiPatterns"
              checked={filters.hideAntiPatterns}
              onChange={(e) => updateFilter('hideAntiPatterns', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="hideAntiPatterns" className="text-sm text-gray-700">
              Hide commits with anti-patterns (WIP, giant commits, etc.)
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export function createDefaultFilters(): FilterState {
  return {
    dateRange: { start: '', end: '' },
    contributors: [],
    scoreRange: { min: 0, max: 100 },
    commitTypes: [],
    hideAntiPatterns: false,
  };
}
