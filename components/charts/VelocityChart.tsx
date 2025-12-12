'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { VelocityData } from '@/types';

interface VelocityChartProps {
  velocity: VelocityData[];
}

export function VelocityChart({ velocity }: VelocityChartProps): React.ReactElement {
  // Format data for display
  const chartData = velocity.slice(-12).map((v) => ({
    ...v,
    weekLabel: v.week.replace(/^\d{4}-/, ''),
  }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Development Velocity</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Not enough data to show velocity
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Development Velocity</h3>
      <p className="text-sm text-gray-500 mb-4">
        Commits and average score per week (last 12 weeks shown)
      </p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{
                value: 'Commits',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{
                value: 'Score',
                angle: 90,
                position: 'insideRight',
                style: { fontSize: 12 },
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as VelocityData & { weekLabel: string };
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                      <p className="font-medium text-gray-900">{data.week}</p>
                      <p className="text-sm text-blue-600">
                        {data.commitCount} commit{data.commitCount !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        {data.linesChanged.toLocaleString()} lines changed
                      </p>
                      <p className="text-sm text-green-600">
                        Avg. Score: {data.averageScore}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="commitCount"
              name="Commits"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="averageScore"
              name="Avg. Score"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
