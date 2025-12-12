'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RepoInfo } from '@/components/RepoInfo';
import { ContributorCard } from '@/components/ContributorCard';
import { ScoreCard } from '@/components/ScoreCard';
import { AntiPatternsList } from '@/components/AntiPatternsList';
import { AIInsightsList } from '@/components/AIInsightsList';
import { loadSharedAnalysis } from '@/lib/export';
import { AIEnhancedAnalysisResult } from '@/types';

export default function SharedAnalysisPage(): React.ReactElement {
  const params = useParams();
  const analysisId = params.analysisId as string;

  const [result, setResult] = useState<AIEnhancedAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (analysisId) {
      const loaded = loadSharedAnalysis(analysisId);
      if (loaded) {
        setResult(loaded);
      } else {
        setError('Analysis not found or has expired.');
      }
      setLoading(false);
    }
  }, [analysisId]);

  const displayScore = result?.aiRepositoryScore ?? result?.repositoryScore ?? 0;

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading analysis...</p>
        </div>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">GitScore</h1>
            <p className="text-gray-600">Shared Analysis</p>
          </header>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="font-semibold text-red-800 text-lg mb-2">Analysis Not Found</h3>
            <p className="text-red-700">{error || 'This shared analysis has expired or does not exist.'}</p>
            <a
              href="/"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Analyze a Repository
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GitScore</h1>
          <p className="text-gray-600">Shared Analysis</p>
          <div className="mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              Read-Only View
            </span>
          </div>
        </header>

        <div className="space-y-8">
          {/* Repository Info with Score */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <RepoInfo repository={result.repository} totalCommits={result.totalCommits} />
                {result.aiAnalysisEnabled && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      AI Analysis Enabled
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-center flex-col items-center">
                <ScoreCard score={displayScore} label={result.aiRepositoryScore ? "AI Score" : "Overall Score"} size="large" />
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          <AIInsightsList insights={result.aiInsights} aiEnabled={result.aiAnalysisEnabled} />

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

          {/* Back to Home */}
          <div className="text-center pt-4">
            <a
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Analyze Your Own Repository
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
