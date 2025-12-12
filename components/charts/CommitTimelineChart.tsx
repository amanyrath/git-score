'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { AIEnhancedCommit } from '@/types';

interface CommitTimelineChartProps {
  commits: AIEnhancedCommit[];
}

interface TimelineDataPoint {
  date: string;
  score: number;
  count: number;
  avgScore: number;
}

export function CommitTimelineChart({ commits }: CommitTimelineChartProps): React.ReactElement {
  // Group commits by date and calculate average score per day
  const dateMap = new Map<string, { scores: number[]; count: number }>();

  for (const commit of commits) {
    const date = new Date(commit.timestamp).toISOString().split('T')[0];
    const score = commit.enhancedScore?.overallScore ?? commit.score.overallScore;

    if (!dateMap.has(date)) {
      dateMap.set(date, { scores: [], count: 0 });
    }
    const entry = dateMap.get(date)!;
    entry.scores.push(score);
    entry.count++;
  }

  // Convert to array and sort by date
  const data: TimelineDataPoint[] = Array.from(dateMap.entries())
    .map(([date, { scores, count }]) => ({
      date,
      score: scores[scores.length - 1], // Last commit score of the day
      count,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate overall average for reference line
  const overallAvg =
    commits.length > 0
      ? Math.round(
          commits.reduce(
            (sum, c) => sum + (c.enhancedScore?.overallScore ?? c.score.overallScore),
            0
          ) / commits.length
        )
      : 0;

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Commit Score Timeline</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              labelFormatter={(label) => formatDate(label as string)}
              formatter={(value: number, name: string) => {
                if (name === 'avgScore') return [`${value}`, 'Avg Score'];
                return [`${value}`, 'Score'];
              }}
            />
            <ReferenceLine
              y={overallAvg}
              stroke="#9333ea"
              strokeDasharray="5 5"
              label={{ value: `Avg: ${overallAvg}`, fill: '#9333ea', fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
