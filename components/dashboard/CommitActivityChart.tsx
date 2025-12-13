'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Commit } from '@/types';
import { format, startOfWeek, eachWeekOfInterval } from 'date-fns';

interface CommitActivityChartProps {
  commits: Commit[];
  dateRange: [Date, Date];
}

export function CommitActivityChart({ commits, dateRange }: CommitActivityChartProps) {
  const chartData = useMemo(() => {
    // Group commits by week
    const weeks = eachWeekOfInterval({
      start: dateRange[0],
      end: dateRange[1],
    });

    return weeks.map((weekStart) => {
      const weekCommits = commits.filter((commit) => {
        const commitWeek = startOfWeek(commit.timestamp);
        return commitWeek.getTime() === weekStart.getTime();
      });

      return {
        week: format(weekStart, 'MMM d'),
        commits: weekCommits.length,
        additions: weekCommits.reduce((sum, c) => sum + c.stats.additions, 0),
        deletions: weekCommits.reduce((sum, c) => sum + c.stats.deletions, 0),
      };
    });
  }, [commits, dateRange]);

  if (chartData.length < 2) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commit Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number, name: string) => [
                  value,
                  name === 'commits'
                    ? 'Commits'
                    : name === 'additions'
                    ? 'Lines Added'
                    : 'Lines Deleted',
                ]}
              />
              <Area
                type="monotone"
                dataKey="commits"
                stroke="#3b82f6"
                fill="#93c5fd"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
