'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisResult } from '@/types';

interface ExportPanelProps {
  analysis: AnalysisResult;
}

export function ExportPanel({ analysis }: ExportPanelProps) {
  const downloadJSON = () => {
    const dataStr = JSON.stringify(analysis, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysis.repository.name}-analysis.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    // Create CSV for contributors
    const headers = [
      'Name',
      'Email',
      'Username',
      'Total Commits',
      'Lines Added',
      'Lines Deleted',
      'Avg Commit Size',
      'Overall Score',
      'Message Quality',
      'Commit Size Score',
      'Consistency',
    ];

    const rows = analysis.contributors.map((c) => [
      c.author.name,
      c.author.email,
      c.author.username || '',
      c.totalCommits,
      c.stats.totalAdditions,
      c.stats.totalDeletions,
      c.stats.avgCommitSize,
      c.scores.overall,
      c.scores.messageQuality,
      c.scores.commitSize,
      c.scores.consistency,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => {
          const str = String(cell);
          // Escape commas and quotes
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysis.repository.name}-contributors.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyShareLink = () => {
    // For now, just copy the current URL
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Export & Share</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadJSON}>
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCSV}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={copyShareLink}>
            Copy Link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
