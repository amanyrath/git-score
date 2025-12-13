'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AnalysisResult, ContributorAnalysis } from '@/types';
import { ScoreDisplay } from './ScoreDisplay';
import { CategoryBar } from './CategoryBar';
import { UserCard } from './UserCard';
import { RecommendationList } from './RecommendationList';
import { InsightCard } from './InsightCard';
import { ContributorModal } from './ContributorModal';
import { ExportPanel } from './ExportPanel';
import {
  ScoreDistribution,
  CommitTimeline,
  ContributorComparison,
  CategoryRadar,
  CommitHeatmap,
} from '@/components/charts';
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
    commits,
    overallScore,
    categoryScores,
    recommendations,
    aiAnalysis,
  } = analysis;

  const hasAI = !!aiAnalysis;

  // Modal state for contributor details
  const [selectedContributor, setSelectedContributor] = useState<ContributorAnalysis | null>(null);

  // Prepare score data for charts
  const commitScores = hasAI && aiAnalysis.enhancedScores
    ? aiAnalysis.enhancedScores
    : contributors.flatMap((c) =>
        c.commits.map(() => c.scores.overall)
      );

  // Calculate average AI scores for radar chart
  const avgAiScores = hasAI && aiAnalysis.enhancedScores && aiAnalysis.enhancedScores.length > 0
    ? {
        clarity: Math.round(
          aiAnalysis.enhancedScores.reduce((sum, s) => sum + (s.aiScores?.clarity || 0), 0) /
            aiAnalysis.enhancedScores.length
        ),
        completeness: Math.round(
          aiAnalysis.enhancedScores.reduce((sum, s) => sum + (s.aiScores?.completeness || 0), 0) /
            aiAnalysis.enhancedScores.length
        ),
        technicalQuality: Math.round(
          aiAnalysis.enhancedScores.reduce((sum, s) => sum + (s.aiScores?.technicalQuality || 0), 0) /
            aiAnalysis.enhancedScores.length
        ),
      }
    : undefined;

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
              max={40}
            />
            <CategoryBar
              label="Commit Size"
              value={categoryScores.commitSize}
              max={35}
            />
            <CategoryBar
              label="Consistency"
              value={categoryScores.consistency}
              max={25}
            />
          </CardContent>
        </Card>
      </section>

      {/* Visualizations */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Visualizations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScoreDistribution scores={commitScores} />
          <CommitTimeline commits={commits} showScoreTrend={hasAI} />
          <ContributorComparison contributors={contributors} />
          <CategoryRadar categoryScores={categoryScores} aiScores={avgAiScores} />
        </div>
        <div className="mt-4">
          <CommitHeatmap commits={commits} />
        </div>
      </section>

      {/* Contributors Grid */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Contributors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contributors.map((contributor) => (
            <UserCard
              key={contributor.author.email}
              contributor={contributor}
              onClick={() => setSelectedContributor(contributor)}
            />
          ))}
        </div>
      </section>

      {/* Contributor Detail Modal */}
      {selectedContributor && (
        <ContributorModal
          contributor={selectedContributor}
          open={!!selectedContributor}
          onClose={() => setSelectedContributor(null)}
        />
      )}

      {/* Recommendations */}
      <section>
        <RecommendationList recommendations={recommendations} />
      </section>

      {/* AI Insights */}
      {hasAI && aiAnalysis.insights && aiAnalysis.insights.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">AI Insights</h2>
            <Badge variant="secondary" className="text-xs">Powered by GPT-4</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiAnalysis.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </section>
      )}

      {/* Anti-Patterns */}
      {hasAI && aiAnalysis.antiPatterns && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Anti-Patterns Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {aiAnalysis.antiPatterns.giantCommits.length}
                  </div>
                  <div className="text-sm text-gray-600">Giant Commits</div>
                  <div className="text-xs text-gray-400">&gt;1000 lines</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {aiAnalysis.antiPatterns.tinyCommits.length}
                  </div>
                  <div className="text-sm text-gray-600">Tiny Commits</div>
                  <div className="text-xs text-gray-400">Vague messages</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {aiAnalysis.antiPatterns.wipCommits.length}
                  </div>
                  <div className="text-sm text-gray-600">WIP Commits</div>
                  <div className="text-xs text-gray-400">Work in progress</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {aiAnalysis.antiPatterns.mergeCommits.length}
                  </div>
                  <div className="text-sm text-gray-600">Merge Commits</div>
                  <div className="text-xs text-gray-400">Multiple parents</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Token Usage (for AI analysis) */}
      {hasAI && aiAnalysis.tokenUsage && (
        <section className="text-center text-xs text-gray-400">
          AI Analysis: {aiAnalysis.tokenUsage.totalTokens.toLocaleString()} tokens used
        </section>
      )}

      {/* Export Panel */}
      <section>
        <ExportPanel analysis={analysis} />
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
