'use client';

import { AIInsight, InsightSeverity } from '@/types';

interface AIInsightsListProps {
  insights: AIInsight[];
  aiEnabled: boolean;
}

function getSeverityStyles(severity: InsightSeverity): {
  bg: string;
  border: string;
  icon: string;
  iconBg: string;
} {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: '!',
        iconBg: 'bg-red-500 text-white',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: '!',
        iconBg: 'bg-yellow-500 text-white',
      };
    case 'info':
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'i',
        iconBg: 'bg-blue-500 text-white',
      };
  }
}

function getSeverityLabel(severity: InsightSeverity): string {
  switch (severity) {
    case 'critical':
      return 'Critical';
    case 'warning':
      return 'Warning';
    case 'info':
    default:
      return 'Info';
  }
}

function InsightCard({ insight }: { insight: AIInsight }): React.ReactElement {
  const styles = getSeverityStyles(insight.severity);

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-full ${styles.iconBg} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${styles.iconBg}`}>
              {getSeverityLabel(insight.severity)}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
          <div className="text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Impact:</span> {insight.impact}
            </p>
            <p className="text-gray-600 mt-1">
              <span className="font-medium">Recommendation:</span> {insight.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIInsightsList({ insights, aiEnabled }: AIInsightsListProps): React.ReactElement {
  if (!aiEnabled) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Insights</h2>
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-2">*</div>
          <p className="font-medium">AI Analysis Not Available</p>
          <p className="text-sm mt-1">
            Add an OpenAI API key to your environment to enable AI-powered insights.
          </p>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Insights</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No insights generated for this repository.</p>
        </div>
      </div>
    );
  }

  // Sort by severity: critical > warning > info
  const sortedInsights = [...insights].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const criticalCount = insights.filter((i) => i.severity === 'critical').length;
  const warningCount = insights.filter((i) => i.severity === 'warning').length;
  const infoCount = insights.filter((i) => i.severity === 'info').length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">AI-Powered Insights</h2>
        <div className="flex gap-2 text-sm">
          {criticalCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
              {warningCount} Warning
            </span>
          )}
          {infoCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {infoCount} Info
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {sortedInsights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </div>
    </div>
  );
}
