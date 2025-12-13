'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContributorAnalysis } from '@/types';

interface ContributorComparisonProps {
  contributors: ContributorAnalysis[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

export function ContributorComparison({ contributors }: ContributorComparisonProps) {
  // Sort by score descending
  const data = contributors
    .map((c) => ({
      name: c.author.name.split(' ')[0], // First name only for display
      fullName: c.author.name,
      score: c.scores.overall,
      commits: c.totalCommits,
      color: getScoreColor(c.scores.overall),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Top 10 contributors

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contributor Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip
                formatter={(value: number) => [`${value}`, 'Score']}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
