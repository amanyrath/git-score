'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, token: token || undefined }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Store analysis in sessionStorage and navigate to results
      sessionStorage.setItem('analysis', JSON.stringify(result.data));
      router.push(`/results/${result.data.id}`);
    } catch (err) {
      setError('Failed to analyze repository. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            GitScore Pro
          </h1>
          <p className="text-lg text-gray-600">
            AI-Powered Git Practice Analysis
          </p>
        </div>

        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>Analyze a Repository</CardTitle>
            <CardDescription>
              Enter a GitHub repository URL to analyze commit practices and get actionable insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">GitHub Repository URL</Label>
                <Input
                  id="url"
                  type="text"
                  placeholder="https://github.com/owner/repo"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">
                  Personal Access Token{' '}
                  <span className="text-gray-500 font-normal">(optional)</span>
                </Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Required for private repos. Increases rate limit from 60 to 5000 requests/hour.
                </p>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Repository'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium">100+ Commits</div>
            <div className="text-xs text-gray-500">Analyzed per repo</div>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm font-medium">Per-User</div>
            <div className="text-xs text-gray-500">Detailed breakdown</div>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">💡</div>
            <div className="text-sm font-medium">Quick Wins</div>
            <div className="text-xs text-gray-500">Actionable insights</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Works with public repositories · Private repos require a token</p>
        </div>
      </div>
    </div>
  );
}
