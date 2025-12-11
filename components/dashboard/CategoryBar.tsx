'use client';

import { Progress } from '@/components/ui/progress';
import { getScoreColor } from '@/lib/analysis';

interface CategoryBarProps {
  label: string;
  value: number;
  max: number;
}

export function CategoryBar({ label, value, max }: CategoryBarProps) {
  const percentage = (value / max) * 100;
  const normalizedScore = (value / max) * 100; // Normalize to 0-100 for color
  const color = getScoreColor(normalizedScore);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {value} / {max}
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
