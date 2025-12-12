'use client';

interface ScoreCardProps {
  score: number;
  label: string;
  size?: 'small' | 'large';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return 'ring-green-500';
  if (score >= 60) return 'ring-yellow-500';
  return 'ring-red-500';
}

export function ScoreCard({ score, label, size = 'large' }: ScoreCardProps): React.ReactElement {
  const isLarge = size === 'large';

  return (
    <div className={`flex flex-col items-center ${isLarge ? 'p-6' : 'p-3'}`}>
      <div
        className={`${isLarge ? 'w-24 h-24' : 'w-16 h-16'} rounded-full ${getScoreBgColor(score)} ring-4 ${getScoreRingColor(score)} flex items-center justify-center`}
      >
        <span className={`${isLarge ? 'text-3xl' : 'text-xl'} font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
      </div>
      <p className={`mt-2 ${isLarge ? 'text-sm' : 'text-xs'} text-gray-600 font-medium`}>{label}</p>
    </div>
  );
}

interface ScoreBreakdownProps {
  messageScore: number;
  sizeScore: number;
}

export function ScoreBreakdown({ messageScore, sizeScore }: ScoreBreakdownProps): React.ReactElement {
  return (
    <div className="flex gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Message:</span>
        <span className={`font-medium ${getScoreColor(messageScore)}`}>{messageScore}/100</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Size:</span>
        <span className={`font-medium ${getScoreColor(sizeScore)}`}>{sizeScore}/100</span>
      </div>
    </div>
  );
}
