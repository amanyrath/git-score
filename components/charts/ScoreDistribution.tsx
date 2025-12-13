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
import type { EnhancedCommitScore } from '@/types';

interface ScoreDistributionProps {
  scores: EnhancedCommitScore[] | number[];
}

const SCORE_RANGES = [
  { range: '0-20', min: 0, max: 20, color: '#ef4444' },
  { range: '20-40', min: 20, max: 40, color: '#f97316' },
  { range: '40-60', min: 40, max: 60, color: '#f59e0b' },
  { range: '60-80', min: 60, max: 80, color: '#3b82f6' },
  { range: '80-100', min: 80, max: 100, color: '#10b981' },
];

export function ScoreDistribution({ scores }: ScoreDistributionProps) {
  // Extract numeric scores
  const numericScores = scores.map((s) =>
    typeof s === 'number' ? s : s.overall
  );

  // Count commits in each range
  const data = SCORE_RANGES.map(({ range, min, max, color }) => ({
    range,
    count: numericScores.filter((score) => score >= min && score < max).length,
    color,
  }));

  // Handle edge case for score of exactly 100
  data[4].count += numericScores.filter((score) => score === 100).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Score Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [`${value} commits`, 'Count']}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
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
