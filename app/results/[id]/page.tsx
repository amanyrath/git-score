'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import type { AnalysisResult } from '@/types';

export default function ResultsPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load analysis from sessionStorage
    const stored = sessionStorage.getItem('analysis');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Convert date strings back to Date objects
        data.analyzedAt = new Date(data.analyzedAt);
        data.dateRange = data.dateRange.map((d: string) => new Date(d));
        data.repository.createdAt = new Date(data.repository.createdAt);
        data.repository.updatedAt = new Date(data.repository.updatedAt);
        data.commits = data.commits.map((c: any) => ({
          ...c,
          timestamp: new Date(c.timestamp),
        }));
        data.contributors = data.contributors.map((contributor: any) => ({
          ...contributor,
          stats: {
            ...contributor.stats,
            firstCommitDate: new Date(contributor.stats.firstCommitDate),
            lastCommitDate: new Date(contributor.stats.lastCommitDate),
          },
          commits: contributor.commits.map((c: any) => ({
            ...c,
            timestamp: new Date(c.timestamp),
          })),
        }));
        setAnalysis(data);
      } catch (e) {
        console.error('Failed to parse analysis data:', e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-gray-500" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-500">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Analysis Not Found</h1>
          <p className="text-gray-600">
            The analysis data could not be found. Please try analyzing a repository again.
          </p>
          <Button onClick={() => router.push('/')}>
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-xl font-bold text-gray-900 hover:text-gray-700"
          >
            GitScore Pro
          </button>
          <Button variant="outline" onClick={() => router.push('/')}>
            Analyze Another
          </Button>
        </div>
      </nav>

      {/* Dashboard */}
      <Dashboard analysis={analysis} />
    </div>
  );
}
