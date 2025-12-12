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
import { AIEnhancedContributor } from '@/types';

interface ContributorComparisonChartProps {
  contributors: AIEnhancedContributor[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green-500
  if (score >= 60) return '#eab308'; // yellow-500
  return '#ef4444'; // red-500
}

export function ContributorComparisonChart({
  contributors,
}: ContributorComparisonChartProps): React.ReactElement {
  // Prepare data - take top 10 contributors by commit count
  const data = contributors.slice(0, 10).map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name,
    fullName: c.name,
    score: c.aiAverageScore ?? c.score.averageScore,
    commits: c.stats.totalCommits,
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contributor Scores</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              formatter={(value: number, name: string, props) => {
                if (name === 'score') {
                  return [`${value}`, `Score (${props.payload.commits} commits)`];
                }
                return [value, name];
              }}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
