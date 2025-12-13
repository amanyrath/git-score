'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Commit } from '@/types';

interface CommitHeatmapProps {
  commits: Commit[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getIntensityColor(count: number, max: number): string {
  if (count === 0) return 'bg-gray-100';
  const intensity = count / max;
  if (intensity > 0.75) return 'bg-green-600';
  if (intensity > 0.5) return 'bg-green-500';
  if (intensity > 0.25) return 'bg-green-400';
  return 'bg-green-200';
}

export function CommitHeatmap({ commits }: CommitHeatmapProps) {
  // Build heatmap data: [day][hour] = count
  const heatmap: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );

  for (const commit of commits) {
    const date = new Date(commit.timestamp);
    const day = date.getDay();
    const hour = date.getHours();
    heatmap[day][hour]++;
  }

  // Find max for color scaling
  const max = Math.max(...heatmap.flat(), 1);

  // Calculate summary stats
  const totalByDay = DAYS.map((_, i) => heatmap[i].reduce((a, b) => a + b, 0));
  const totalByHour = HOURS.map((h) => heatmap.reduce((sum, day) => sum + day[h], 0));

  const busiestDay = DAYS[totalByDay.indexOf(Math.max(...totalByDay))];
  const busiestHour = totalByHour.indexOf(Math.max(...totalByHour));

  const workingHoursCommits = totalByHour.slice(9, 18).reduce((a, b) => a + b, 0);
  const afterHoursCommits = commits.length - workingHoursCommits;
  const afterHoursPercent = Math.round((afterHoursCommits / commits.length) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Commit Activity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex mb-1">
              <div className="w-10" />
              {HOURS.filter((h) => h % 3 === 0).map((h) => (
                <div
                  key={h}
                  className="text-xs text-gray-400 text-center"
                  style={{ width: '48px' }}
                >
                  {h}:00
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center mb-1">
                <div className="w-10 text-xs text-gray-500">{day}</div>
                <div className="flex gap-[2px]">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className={`w-4 h-4 rounded-sm ${getIntensityColor(
                        heatmap[dayIndex][hour],
                        max
                      )}`}
                      title={`${day} ${hour}:00 - ${heatmap[dayIndex][hour]} commits`}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
              <span>Less</span>
              <div className="flex gap-[2px]">
                <div className="w-3 h-3 rounded-sm bg-gray-100" />
                <div className="w-3 h-3 rounded-sm bg-green-200" />
                <div className="w-3 h-3 rounded-sm bg-green-400" />
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <div className="w-3 h-3 rounded-sm bg-green-600" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-center">
          <div>
            <p className="text-lg font-semibold">{busiestDay}</p>
            <p className="text-xs text-gray-500">Busiest Day</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{busiestHour}:00</p>
            <p className="text-xs text-gray-500">Peak Hour</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{afterHoursPercent}%</p>
            <p className="text-xs text-gray-500">After Hours</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
