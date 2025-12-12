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
import { AIEnhancedCommit } from '@/types';

interface ScoreDistributionChartProps {
  commits: AIEnhancedCommit[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green-500
  if (score >= 60) return '#eab308'; // yellow-500
  return '#ef4444'; // red-500
}

export function ScoreDistributionChart({ commits }: ScoreDistributionChartProps): React.ReactElement {
  // Create histogram buckets (0-10, 10-20, ..., 90-100)
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${i * 10 + 10}`,
    min: i * 10,
    max: i * 10 + 10,
    count: 0,
  }));

  // Count commits in each bucket
  for (const commit of commits) {
    const score = commit.enhancedScore?.overallScore ?? commit.score.overallScore;
    const bucketIndex = Math.min(Math.floor(score / 10), 9);
    buckets[bucketIndex].count++;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              formatter={(value: number) => [`${value} commits`, 'Count']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {buckets.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getScoreColor(entry.min + 5)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
