'use client';

import { useState, useMemo } from 'react';
import { RepoInput } from '@/components/RepoInput';
import { RepoInfo } from '@/components/RepoInfo';
import { ContributorCard } from '@/components/ContributorCard';
import { ScoreCard } from '@/components/ScoreCard';
import { AntiPatternsList } from '@/components/AntiPatternsList';
import { AIInsightsList } from '@/components/AIInsightsList';
import { FilterPanel, FilterState, createDefaultFilters } from '@/components/FilterPanel';
import { ExportPanel } from '@/components/ExportPanel';
import { ContributorDetailModal } from '@/components/ContributorDetailModal';
import { CommitDetailModal } from '@/components/CommitDetailModal';
import {
  ScoreDistributionChart,
  CommitTimelineChart,
  ContributorComparisonChart,
  CommitHeatmap,
  VelocityChart,
} from '@/components/charts';
import { TemporalPatternsPanel } from '@/components/TemporalPatternsPanel';
import { CollaborationPanel } from '@/components/CollaborationPanel';
import { SearchPanel } from '@/components/SearchPanel';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { parseGitHubUrl } from '@/lib/url-parser';
import { getCachedAnalysis, setCachedAnalysis } from '@/lib/cache';
import { AIEnhancedAnalysisResult, AIEnhancedContributor, AIEnhancedCommit, GitHubError } from '@/types';

export default function Home(): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIEnhancedAnalysisResult | null>(null);
  const [error, setError] = useState<GitHubError | null>(null);
  const [filters, setFilters] = useState<FilterState>(createDefaultFilters());
  const [selectedContributor, setSelectedContributor] = useState<AIEnhancedContributor | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<AIEnhancedCommit | null>(null);

  const handleAnalyze = async (url: string, skipCache = false): Promise<void> => {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      setError({
        type: 'UNKNOWN',
        message: 'Invalid repository URL',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setFilters(createDefaultFilters());

    // Check cache first (unless skipping)
    if (!skipCache) {
      try {
        const cached = await getCachedAnalysis(parsed.owner, parsed.repo);
        if (cached) {
          setResult(cached);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Cache read failed:', e);
      }
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: parsed.owner,
          repo: parsed.repo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data as GitHubError);
        return;
      }

      const analysisResult = data as AIEnhancedAnalysisResult;
      setResult(analysisResult);

      // Store in cache
      try {
        await setCachedAnalysis(parsed.owner, parsed.repo, analysisResult);
      } catch (e) {
        console.warn('Cache write failed:', e);
      }
    } catch {
      setError({
        type: 'NETWORK_ERROR',
        message: 'Failed to connect to the server. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter commits based on current filters
  const filteredCommits = useMemo(() => {
    if (!result) return [];

    return result.commits.filter((commit) => {
      // Date range filter
      if (filters.dateRange.start) {
        const commitDate = new Date(commit.timestamp);
        const startDate = new Date(filters.dateRange.start);
        if (commitDate < startDate) return false;
      }
      if (filters.dateRange.end) {
        const commitDate = new Date(commit.timestamp);
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (commitDate > endDate) return false;
      }

      // Contributor filter
      if (filters.contributors.length > 0) {
        if (!filters.contributors.includes(commit.author.email.toLowerCase())) {
          return false;
        }
      }

      // Score range filter
      const score = commit.enhancedScore?.overallScore ?? commit.score.overallScore;
      if (score < filters.scoreRange.min || score > filters.scoreRange.max) {
        return false;
      }

      // Commit type filter
      if (filters.commitTypes.length > 0 && commit.enhancedScore) {
        if (!filters.commitTypes.includes(commit.enhancedScore.semanticAnalysis.intent)) {
          return false;
        }
      }

      // Anti-pattern filter
      if (filters.hideAntiPatterns) {
        if (
          commit.score.sizeScore.isGiantCommit ||
          commit.score.sizeScore.isTinyCommit ||
          commit.isMergeCommit ||
          commit.message.toLowerCase().includes('wip')
        ) {
          return false;
        }
      }

      return true;
    });
  }, [result, filters]);

  // Use AI score if available, otherwise fall back to heuristic score
  const displayScore = result?.aiRepositoryScore ?? result?.repositoryScore ?? 0;

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12 relative">
          <div className="absolute right-0 top-0">
            <DarkModeToggle />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">GitScore</h1>
          <p className="text-gray-600 dark:text-gray-300">Analyze GitHub repositories to evaluate Git commit practices</p>
        </header>

        <div className="flex justify-center mb-8">
          <RepoInput onSubmit={handleAnalyze} isLoading={isLoading} />
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Analyzing repository...</p>
            <p className="text-sm text-gray-500 mt-1">This may take a moment with AI analysis enabled</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-red-700">{error.message}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Repository Info with Score */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <RepoInfo repository={result.repository} totalCommits={result.totalCommits} />
                  {result.aiAnalysisEnabled && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        AI Analysis Enabled
                      </span>
                      {result.tokenUsage && (
                        <span className="text-xs text-gray-500">
                          {result.tokenUsage.totalTokens.toLocaleString()} tokens used
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-center flex-col items-center">
                  <ScoreCard score={displayScore} label={result.aiRepositoryScore ? "AI Score" : "Overall Score"} size="large" />
                  {result.aiRepositoryScore && (
                    <p className="text-xs text-gray-500 mt-1">
                      Heuristic: {result.repositoryScore}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Export Panel */}
            <div className="flex flex-wrap gap-4 items-center">
              <ExportPanel result={result} />
              <SearchPanel commits={result.commits} onSelectCommit={setSelectedCommit} />
            </div>

            {/* Filter Panel */}
            <FilterPanel
              contributors={result.contributors}
              filters={filters}
              onFilterChange={setFilters}
              totalCommits={result.totalCommits}
              filteredCount={filteredCommits.length}
            />

            {/* Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScoreDistributionChart commits={filteredCommits} />
              <CommitTimelineChart commits={filteredCommits} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ContributorComparisonChart contributors={result.contributors} />
              {/* AI Insights Section */}
              <AIInsightsList insights={result.aiInsights} aiEnabled={result.aiAnalysisEnabled} />
            </div>

            {/* Temporal Analysis Section */}
            {result.temporalAnalysis && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Temporal Analysis</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CommitHeatmap temporalAnalysis={result.temporalAnalysis} />
                  <VelocityChart velocity={result.temporalAnalysis.velocity} />
                </div>
                <TemporalPatternsPanel temporalAnalysis={result.temporalAnalysis} />
              </div>
            )}

            {/* Collaboration Metrics Section */}
            {result.collaborationMetrics && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Collaboration Metrics</h2>
                <CollaborationPanel metrics={result.collaborationMetrics} />
              </div>
            )}

            {/* Contributors Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Contributors ({result.contributors.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.contributors.map((contributor) => (
                  <div
                    key={contributor.email}
                    onClick={() => setSelectedContributor(contributor)}
                    className="cursor-pointer"
                  >
                    <ContributorCard contributor={contributor} />
                  </div>
                ))}
              </div>
            </div>

            {/* Anti-Patterns / Insights Section */}
            <AntiPatternsList insights={result.insights} />

            {/* Recent Commits */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Recent Commits ({filteredCommits.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCommits.slice(0, 20).map((commit) => {
                  const score = commit.enhancedScore?.overallScore ?? commit.score.overallScore;
                  return (
                    <div
                      key={commit.sha}
                      onClick={() => setSelectedCommit(commit)}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${score >= 80 ? 'bg-green-100 text-green-600' : score >= 60 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                        {score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {commit.message.split('\n')[0]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {commit.sha.slice(0, 7)} by {commit.author.name}
                        </p>
                      </div>
                      {commit.enhancedScore?.semanticAnalysis.intent && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          {commit.enhancedScore.semanticAnalysis.intent}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {selectedContributor && result && (
          <ContributorDetailModal
            contributor={selectedContributor}
            commits={result.commits}
            onClose={() => setSelectedContributor(null)}
          />
        )}

        {selectedCommit && (
          <CommitDetailModal
            commit={selectedCommit}
            onClose={() => setSelectedCommit(null)}
          />
        )}
      </div>
    </main>
  );
}
