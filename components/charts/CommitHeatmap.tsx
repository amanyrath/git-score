'use client';

import { TemporalAnalysis } from '@/types';

interface CommitHeatmapProps {
  temporalAnalysis: TemporalAnalysis;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CommitHeatmap({ temporalAnalysis }: CommitHeatmapProps): React.ReactElement {
  const { heatmapData } = temporalAnalysis;

  // Find max value for color scaling
  const maxValue = Math.max(...heatmapData.flat(), 1);

  // Get color intensity based on value
  const getColor = (value: number): string => {
    if (value === 0) return 'bg-gray-100';
    const intensity = value / maxValue;
    if (intensity < 0.25) return 'bg-green-200';
    if (intensity < 0.5) return 'bg-green-400';
    if (intensity < 0.75) return 'bg-green-600';
    return 'bg-green-800';
  };

  const getTextColor = (value: number): string => {
    if (value === 0) return 'text-gray-400';
    const intensity = value / maxValue;
    if (intensity < 0.5) return 'text-gray-700';
    return 'text-white';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Commit Activity Heatmap</h3>
      <p className="text-sm text-gray-500 mb-4">
        Shows when commits are made throughout the week (local time)
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex mb-1 ml-12">
            {HOURS.filter((h) => h % 3 === 0).map((hour) => (
              <div
                key={hour}
                className="text-xs text-gray-500 text-center"
                style={{ width: `${(100 / 24) * 3}%` }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-12 text-sm text-gray-600 font-medium">{day}</div>
              <div className="flex flex-1 gap-[2px]">
                {HOURS.map((hour) => {
                  const value = heatmapData[dayIndex]?.[hour] || 0;
                  return (
                    <div
                      key={hour}
                      className={`flex-1 h-6 rounded-sm ${getColor(value)} ${getTextColor(value)} flex items-center justify-center text-xs transition-colors hover:ring-2 hover:ring-blue-400`}
                      title={`${day} ${hour}:00 - ${value} commit${value !== 1 ? 's' : ''}`}
                    >
                      {value > 0 && value}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="w-4 h-4 bg-gray-100 rounded-sm"></div>
        <div className="w-4 h-4 bg-green-200 rounded-sm"></div>
        <div className="w-4 h-4 bg-green-400 rounded-sm"></div>
        <div className="w-4 h-4 bg-green-600 rounded-sm"></div>
        <div className="w-4 h-4 bg-green-800 rounded-sm"></div>
        <span>More</span>
      </div>
    </div>
  );
}
