'use client';

import { getScoreColor } from '@/lib/analysis';

interface CategoryBarProps {
  label: string;
  value: number;
  max: number;
  weight?: number;
}

export function CategoryBar({ label, value, max, weight }: CategoryBarProps) {
  const percentage = (value / max) * 100;
  const color = getScoreColor(value);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">
          {label}
          {weight && <span className="text-gray-400 ml-1">({weight}% weight)</span>}
        </span>
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
