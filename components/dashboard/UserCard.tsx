'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ContributorAnalysis } from '@/types';
import { getScoreColor, getScoreDescription } from '@/lib/analysis';

interface UserCardProps {
  contributor: ContributorAnalysis;
  onClick?: () => void;
}

export function UserCard({ contributor, onClick }: UserCardProps) {
  const { author, totalCommits, stats, scores } = contributor;
  const color = getScoreColor(scores.overall);

  return (
    <Card
      className={`hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {author.avatarUrl ? (
            <img
              src={author.avatarUrl}
              alt={author.name}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-lg">
              {author.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{author.name}</h3>
            <p className="text-sm text-gray-500 truncate">
              {author.username ? `@${author.username}` : author.email}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color }}>
              {scores.overall}
            </div>
            <div className="text-xs text-gray-500">score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{totalCommits} commits</Badge>
          <Badge variant="outline">+{stats.totalAdditions.toLocaleString()}</Badge>
          <Badge variant="outline">-{stats.totalDeletions.toLocaleString()}</Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Message Quality</span>
            <span className="font-medium">{scores.messageQuality}/40</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Commit Size</span>
            <span className="font-medium">{scores.commitSize}/35</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Consistency</span>
            <span className="font-medium">{scores.consistency}/25</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-gray-500">
            Avg commit size: {stats.avgCommitSize} lines · {stats.filesChanged} files touched
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
