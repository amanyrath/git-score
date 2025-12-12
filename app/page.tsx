'use client';

import { useState } from 'react';
import { RepoInput } from '@/components/RepoInput';
import { RepoInfo } from '@/components/RepoInfo';
import { ContributorCard } from '@/components/ContributorCard';
import { ScoreCard } from '@/components/ScoreCard';
import { AntiPatternsList } from '@/components/AntiPatternsList';
import { parseGitHubUrl } from '@/lib/url-parser';
import { ScoredAnalysisResult, GitHubError } from '@/types';

export default function Home(): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScoredAnalysisResult | null>(null);
  const [error, setError] = useState<GitHubError | null>(null);

  const handleAnalyze = async (url: string): Promise<void> => {
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

      setResult(data as ScoredAnalysisResult);
    } catch {
      setError({
        type: 'NETWORK_ERROR',
        message: 'Failed to connect to the server. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GitScore</h1>
          <p className="text-gray-600">Analyze GitHub repositories to evaluate Git commit practices</p>
        </header>

        <div className="flex justify-center mb-8">
          <RepoInput onSubmit={handleAnalyze} isLoading={isLoading} />
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Analyzing repository...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-red-700">{error.message}</p>
          </div>
        )}

        {result && (
          <div className="space-y-8">
            {/* Repository Info with Score */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <RepoInfo repository={result.repository} totalCommits={result.totalCommits} />
                </div>
                <div className="flex justify-center">
                  <ScoreCard score={result.repositoryScore} label="Overall Score" size="large" />
                </div>
              </div>
            </div>

            {/* Contributors Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Contributors ({result.contributors.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.contributors.map((contributor) => (
                  <ContributorCard key={contributor.email} contributor={contributor} />
                ))}
              </div>
            </div>

            {/* Anti-Patterns / Insights Section */}
            <AntiPatternsList insights={result.insights} />
          </div>
        )}
      </div>
    </main>
  );
}
