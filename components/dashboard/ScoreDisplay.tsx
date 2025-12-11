'use client';

import { getScoreColor, getScoreDescription } from '@/lib/analysis';

interface ScoreDisplayProps {
  score: number;
  maxScore: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreDisplay({
  score,
  maxScore,
  size = 'md',
  showLabel = true,
}: ScoreDisplayProps) {
  const percentage = (score / maxScore) * 100;
  const color = getScoreColor(score);
  const description = getScoreDescription(score);

  const sizeClasses = {
    sm: { wrapper: 'w-24 h-24', score: 'text-2xl', label: 'text-xs' },
    md: { wrapper: 'w-36 h-36', score: 'text-4xl', label: 'text-sm' },
    lg: { wrapper: 'w-48 h-48', score: 'text-5xl', label: 'text-base' },
  };

  const sizes = sizeClasses[size];
  const strokeWidth = size === 'sm' ? 6 : 8;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizes.wrapper}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className={`${sizes.score} font-bold`} style={{ color }}>
            {score}
          </span>
          <span className={`${sizes.label} text-gray-500`}>/ {maxScore}</span>
        </div>
      </div>
      {showLabel && (
        <span className={`${sizes.label} font-medium`} style={{ color }}>
          {description}
        </span>
      )}
    </div>
  );
}
