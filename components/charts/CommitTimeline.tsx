'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Commit } from '@/types';
import { format, parseISO, startOfDay } from 'date-fns';

interface CommitTimelineProps {
  commits: Commit[];
  showScoreTrend?: boolean;
  scores?: Map<string, number> | Record<string, number>;
}

export function CommitTimeline({ commits, showScoreTrend, scores }: CommitTimelineProps) {
  // Group commits by day
  const commitsByDay = new Map<string, { count: number; totalScore: number }>();

  for (const commit of commits) {
    const day = format(startOfDay(new Date(commit.timestamp)), 'yyyy-MM-dd');
    const existing = commitsByDay.get(day) || { count: 0, totalScore: 0 };

    let score = 50; // default
    if (scores) {
      const scoreValue = scores instanceof Map ? scores.get(commit.sha) : scores[commit.sha];
      if (typeof scoreValue === 'number') {
        score = scoreValue;
      }
    }

    commitsByDay.set(day, {
      count: existing.count + 1,
      totalScore: existing.totalScore + score,
    });
  }

  // Convert to array and sort by date
  const data = Array.from(commitsByDay.entries())
    .map(([date, { count, totalScore }]) => ({
      date,
      commits: count,
      avgScore: Math.round(totalScore / count),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Commit Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                interval="preserveStartEnd"
              />
              <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 12 }} />
              {showScoreTrend && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                />
              )}
              <Tooltip
                labelFormatter={(value) => format(parseISO(value as string), 'MMM d, yyyy')}
                contentStyle={{ fontSize: 12 }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="commits"
                fill="#3b82f6"
                fillOpacity={0.2}
                stroke="#3b82f6"
                strokeWidth={2}
                name="Commits"
              />
              {showScoreTrend && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Avg Score"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
