'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryScores } from '@/types';

interface CategoryRadarProps {
  categoryScores: CategoryScores;
  aiScores?: {
    clarity: number;
    completeness: number;
    technicalQuality: number;
  };
}

export function CategoryRadar({ categoryScores, aiScores }: CategoryRadarProps) {
  // Normalize scores to 0-100 scale
  const data = [
    {
      category: 'Message Quality',
      score: Math.round((categoryScores.messageQuality / 40) * 100),
      fullMark: 100,
    },
    {
      category: 'Commit Size',
      score: Math.round((categoryScores.commitSize / 35) * 100),
      fullMark: 100,
    },
    {
      category: 'Consistency',
      score: Math.round((categoryScores.consistency / 25) * 100),
      fullMark: 100,
    },
  ];

  // Add AI scores if available
  if (aiScores) {
    data.push(
      { category: 'Clarity', score: aiScores.clarity, fullMark: 100 },
      { category: 'Completeness', score: aiScores.completeness, fullMark: 100 },
      { category: 'Technical', score: aiScores.technicalQuality, fullMark: 100 }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Category Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                tickCount={5}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Score']}
                contentStyle={{ fontSize: 12 }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
