'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Recommendation } from '@/types';

interface RecommendationListProps {
  recommendations: Recommendation[];
}

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-green-100 text-green-800',
};

export function RecommendationList({ recommendations }: RecommendationListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Quick Wins</h2>
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <Card key={rec.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{rec.title}</CardTitle>
                <Badge className={priorityColors[rec.priority]} variant="secondary">
                  {rec.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{rec.description}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1">
                {rec.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
