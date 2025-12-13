'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AIRepositoryInsights } from '@/types';

interface AIInsightsCardProps {
  insights?: AIRepositoryInsights;
  enabled: boolean;
}

export function AIInsightsCard({ insights, enabled }: AIInsightsCardProps) {
  if (!enabled) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            AI Insights
            <Badge variant="secondary">Disabled</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">
            AI analysis is not available. Set the OPENAI_API_KEY environment variable to enable
            AI-powered insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            AI Insights
            <Badge variant="secondary">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI Insights
          <Badge className="bg-purple-100 text-purple-800">Powered by GPT-4</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div>
          <p className="text-gray-700">{insights.summary}</p>
        </div>

        {/* Overall Assessment */}
        <div className="p-4 bg-white/60 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Overall Assessment</h4>
          <p className="text-gray-600 text-sm">{insights.overallAssessment}</p>
        </div>

        {/* Strengths & Weaknesses Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Strengths */}
          {insights.strengths.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <span className="text-lg">+</span> Strengths
              </h4>
              <ul className="space-y-2">
                {insights.strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                    <span className="text-green-500 mt-1">-</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {insights.weaknesses.length > 0 && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                <span className="text-lg">-</span> Areas to Improve
              </h4>
              <ul className="space-y-2">
                {insights.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-500 mt-1">-</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        {insights.recommendations.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-3">AI Recommendations</h4>
            <ul className="space-y-3">
              {insights.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-blue-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
