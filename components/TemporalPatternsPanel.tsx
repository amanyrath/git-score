'use client';

import { TemporalAnalysis } from '@/types';
import { flagUnusualPatterns } from '@/lib/temporal-analysis';

interface TemporalPatternsPanelProps {
  temporalAnalysis: TemporalAnalysis;
}

export function TemporalPatternsPanel({ temporalAnalysis }: TemporalPatternsPanelProps): React.ReactElement {
  const { patterns, qualityTimeCorrelation, hourlyDistribution, dailyDistribution } = temporalAnalysis;
  const flags = flagUnusualPatterns(temporalAnalysis);

  // Format hour for display
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Temporal Patterns</h3>

      {/* Pattern Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {patterns.isNightOwl && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            Night Owl
          </span>
        )}
        {patterns.isEarlyBird && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Early Bird
          </span>
        )}
        {patterns.isWeekendCommitter && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Weekend Warrior
          </span>
        )}
        {patterns.workingHoursRatio > 0.7 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            9-to-5 Developer
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-500">Most Active Hour</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatHour(patterns.mostActiveHour)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-500">Most Active Day</div>
          <div className="text-lg font-semibold text-gray-900">
            {patterns.mostActiveDay}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-500">Working Hours</div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(patterns.workingHoursRatio * 100)}%
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-500">Quality Correlation</div>
          <div className={`text-lg font-semibold ${
            qualityTimeCorrelation.hourlyCorrelation > 0 ? 'text-green-600' :
            qualityTimeCorrelation.hourlyCorrelation < -0.2 ? 'text-red-600' :
            'text-gray-900'
          }`}>
            {qualityTimeCorrelation.hourlyCorrelation > 0 ? '+' : ''}
            {qualityTimeCorrelation.hourlyCorrelation.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Best/Worst Hours */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Best Quality Hours</h4>
          <div className="flex gap-2">
            {qualityTimeCorrelation.bestHours.map((hour) => (
              <span
                key={hour}
                className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-sm"
              >
                {formatHour(hour)}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Lower Quality Hours</h4>
          <div className="flex gap-2">
            {qualityTimeCorrelation.worstHours.map((hour) => (
              <span
                key={hour}
                className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-800 text-sm"
              >
                {formatHour(hour)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Distribution Bar */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Daily Distribution</h4>
        <div className="flex gap-1">
          {dailyDistribution.map((day) => {
            const maxCount = Math.max(...dailyDistribution.map((d) => d.count), 1);
            const height = (day.count / maxCount) * 100;
            return (
              <div key={day.day} className="flex-1 flex flex-col items-center">
                <div className="w-full h-16 bg-gray-100 rounded-t relative">
                  <div
                    className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{day.dayName.slice(0, 3)}</div>
                <div className="text-xs text-gray-700 font-medium">{day.count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unusual Pattern Flags */}
      {flags.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Observations</h4>
          <ul className="space-y-1">
            {flags.map((flag, index) => (
              <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                <span className="text-yellow-500">!</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
