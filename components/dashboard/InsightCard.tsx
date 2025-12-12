'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Insight } from '@/types';

interface InsightCardProps {
  insight: Insight;
}

const severityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const categoryLabels = {
  strength: 'Strength',
  improvement: 'Improvement',
  pattern: 'Pattern',
  recommendation: 'Recommendation',
};

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{insight.title}</CardTitle>
          <div className="flex gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-xs">
              {categoryLabels[insight.category]}
            </Badge>
            <Badge className={`text-xs ${severityColors[insight.severity]}`}>
              {insight.severity}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">{insight.description}</p>

        {insight.impact && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Impact</p>
            <p className="text-sm text-gray-700">{insight.impact}</p>
          </div>
        )}

        {insight.recommendation && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Recommendation</p>
            <p className="text-sm text-blue-900">{insight.recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
