'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ContributorAnalysis, ContributorCategory } from '@/types';
import { getScoreColor } from '@/lib/analysis';

interface UserCardProps {
  contributor: ContributorAnalysis;
}

function getCategoryBadgeVariant(category: ContributorCategory): 'default' | 'secondary' | 'destructive' {
  switch (category) {
    case 'Excellent':
      return 'default';
    case 'Good':
      return 'secondary';
    case 'Needs Improvement':
      return 'destructive';
  }
}

function getCategoryColor(category: ContributorCategory): string {
  switch (category) {
    case 'Excellent':
      return '#10b981'; // green
    case 'Good':
      return '#3b82f6'; // blue
    case 'Needs Improvement':
      return '#f97316'; // orange
  }
}

export function UserCard({ contributor }: UserCardProps) {
  const { author, totalCommits, stats, scoring } = contributor;

  // Use new scoring if available, fallback to legacy scores
  const score = scoring?.averageScore ?? contributor.scores.overall;
  const category = scoring?.category ?? 'Good';
  const color = getScoreColor(score);

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
              {score}
            </div>
            <div className="text-xs text-gray-500">score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            style={{ backgroundColor: getCategoryColor(category), color: 'white' }}
          >
            {category}
          </Badge>
          <Badge variant="secondary">{totalCommits} commits</Badge>
          <Badge variant="outline">+{stats.totalAdditions.toLocaleString()}</Badge>
          <Badge variant="outline">-{stats.totalDeletions.toLocaleString()}</Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Message Quality</span>
            <span className="font-medium">{contributor.scores.messageQuality}/40</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Commit Size</span>
            <span className="font-medium">{contributor.scores.commitSize}/35</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Consistency</span>
            <span className="font-medium">{contributor.scores.consistency}/25</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-gray-500">
            Avg commit size: {stats.avgCommitSize} lines · {stats.filesChanged} files touched
          </div>
          {scoring && (
            <div className="text-xs text-gray-500 mt-1">
              Score consistency: {scoring.consistency.toFixed(1)} std dev
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
