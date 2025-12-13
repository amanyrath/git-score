'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AntiPatternSummary } from '@/types';

interface AntiPatternCardProps {
  antiPatterns: AntiPatternSummary;
}

const ANTI_PATTERN_LABELS = {
  giant_commit: { label: 'Giant Commits', color: 'bg-red-100 text-red-800' },
  tiny_commit: { label: 'Tiny Commits', color: 'bg-yellow-100 text-yellow-800' },
  wip_commit: { label: 'WIP Commits', color: 'bg-orange-100 text-orange-800' },
  merge_commit: { label: 'Merge Commits', color: 'bg-blue-100 text-blue-800' },
};

export function AntiPatternCard({ antiPatterns }: AntiPatternCardProps) {
  if (antiPatterns.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Anti-Patterns
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              None detected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">
            No anti-patterns detected in your commits. Great job maintaining clean commit history!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Anti-Patterns
          <Badge variant="destructive">{antiPatterns.total} detected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {antiPatterns.giantCommits > 0 && (
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{antiPatterns.giantCommits}</div>
              <div className="text-xs text-red-800">Giant Commits</div>
            </div>
          )}
          {antiPatterns.tinyCommits > 0 && (
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{antiPatterns.tinyCommits}</div>
              <div className="text-xs text-yellow-800">Tiny Commits</div>
            </div>
          )}
          {antiPatterns.wipCommits > 0 && (
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{antiPatterns.wipCommits}</div>
              <div className="text-xs text-orange-800">WIP Commits</div>
            </div>
          )}
          {antiPatterns.mergeCommits > 0 && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{antiPatterns.mergeCommits}</div>
              <div className="text-xs text-blue-800">Merge Commits</div>
            </div>
          )}
        </div>

        {/* Details (show first 5) */}
        {antiPatterns.patterns.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Examples:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {antiPatterns.patterns.slice(0, 5).map((pattern, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm"
                >
                  <Badge
                    variant="secondary"
                    className={ANTI_PATTERN_LABELS[pattern.type].color}
                  >
                    {ANTI_PATTERN_LABELS[pattern.type].label}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-gray-500 truncate">
                      {pattern.commit.sha.substring(0, 7)}
                    </div>
                    <div className="text-gray-700 truncate">{pattern.commit.message}</div>
                    <div className="text-xs text-gray-500">{pattern.reason}</div>
                  </div>
                </div>
              ))}
            </div>
            {antiPatterns.patterns.length > 5 && (
              <p className="text-xs text-gray-500 text-center">
                And {antiPatterns.patterns.length - 5} more...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
