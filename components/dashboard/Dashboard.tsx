'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AnalysisResult } from '@/types';
import { ScoreDisplay } from './ScoreDisplay';
import { CategoryBar } from './CategoryBar';
import { UserCard } from './UserCard';
import { RecommendationList } from './RecommendationList';
import { AntiPatternCard } from './AntiPatternCard';
import { formatDistanceToNow } from 'date-fns';

interface DashboardProps {
  analysis: AnalysisResult;
}

export function Dashboard({ analysis }: DashboardProps) {
  const {
    repository,
    analyzedAt,
    totalCommits,
    dateRange,
    contributors,
    overallScore,
    categoryScores,
    antiPatterns,
    recommendations,
  } = analysis;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <header className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-bold">{repository.fullName}</h1>
          {repository.language && (
            <Badge variant="secondary">{repository.language}</Badge>
          )}
        </div>
        <p className="text-gray-600">
          {totalCommits} commits analyzed · {contributors.length} contributors
        </p>
        <p className="text-sm text-gray-500">
          From {dateRange[0].toLocaleDateString()} to {dateRange[1].toLocaleDateString()}
        </p>
      </header>

      {/* Main Score */}
      <section className="flex flex-col items-center py-8 bg-gradient-to-b from-gray-50 to-white rounded-xl">
        <ScoreDisplay score={overallScore} maxScore={100} size="lg" />
        <p className="mt-4 text-gray-600 text-center max-w-md">
          Based on commit message quality, commit size, and consistency patterns
        </p>
      </section>

      {/* Category Breakdown */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CategoryBar
              label="Message Quality"
              value={categoryScores.messageQuality}
              max={100}
              weight={40}
            />
            <CategoryBar
              label="Commit Size"
              value={categoryScores.commitSize}
              max={100}
              weight={35}
            />
            <CategoryBar
              label="Consistency"
              value={categoryScores.consistency}
              max={100}
              weight={25}
            />
          </CardContent>
        </Card>
      </section>

      {/* Anti-Patterns */}
      <section>
        <AntiPatternCard antiPatterns={antiPatterns} />
      </section>

      {/* Contributors Grid */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Contributors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contributors.map((contributor) => (
            <UserCard key={contributor.author.email} contributor={contributor} />
          ))}
        </div>
      </section>

      {/* Recommendations */}
      <section>
        <RecommendationList recommendations={recommendations} />
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 pt-8 border-t">
        <p>
          Analysis completed {formatDistanceToNow(analyzedAt, { addSuffix: true })}
        </p>
        <p className="mt-1">
          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View on GitHub →
          </a>
        </p>
      </footer>
    </div>
  );
}
