'use client';

import { AIEnhancedCommit, CommitIntent } from '@/types';

interface CommitDetailModalProps {
  commit: AIEnhancedCommit;
  onClose: () => void;
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

function getIntentColor(intent: CommitIntent): string {
  const colors: Record<CommitIntent, string> = {
    feature: 'bg-purple-100 text-purple-800',
    bugfix: 'bg-red-100 text-red-800',
    refactor: 'bg-blue-100 text-blue-800',
    docs: 'bg-green-100 text-green-800',
    test: 'bg-yellow-100 text-yellow-800',
    style: 'bg-pink-100 text-pink-800',
    chore: 'bg-gray-100 text-gray-800',
    performance: 'bg-orange-100 text-orange-800',
    security: 'bg-red-100 text-red-800',
  };
  return colors[intent] || 'bg-gray-100 text-gray-800';
}

function ScoreBar({ label, score, maxScore = 100 }: { label: string; score: number; maxScore?: number }): React.ReactElement {
  const percentage = (score / maxScore) * 100;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium ${getScoreColor(score)}`}>{score}/{maxScore}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function CommitDetailModal({
  commit,
  onClose,
}: CommitDetailModalProps): React.ReactElement {
  const score = commit.enhancedScore?.overallScore ?? commit.score.overallScore;
  const hasAIAnalysis = !!commit.enhancedScore;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm text-gray-500">{commit.sha.slice(0, 7)}</span>
                {hasAIAnalysis && commit.enhancedScore?.semanticAnalysis.intent && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getIntentColor(commit.enhancedScore.semanticAnalysis.intent)}`}>
                    {commit.enhancedScore.semanticAnalysis.intent}
                  </span>
                )}
                {commit.isMergeCommit && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Merge
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 break-words">
                {commit.message.split('\n')[0]}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                by {commit.author.name} on {formatDate(commit.timestamp)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Score Overview */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
                {score}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-3">
              {hasAIAnalysis && commit.enhancedScore ? (
                <>
                  <ScoreBar label="Heuristic Score" score={commit.enhancedScore.heuristicScore} />
                  <ScoreBar label="Clarity" score={commit.enhancedScore.clarityScore} />
                  <ScoreBar label="Completeness" score={commit.enhancedScore.completenessScore} />
                  <ScoreBar label="Size Score" score={commit.enhancedScore.sizeScore} />
                  <ScoreBar label="Technical Quality" score={commit.enhancedScore.technicalScore} />
                </>
              ) : (
                <>
                  <ScoreBar label="Message Quality" score={commit.score.messageQuality.total} />
                  <ScoreBar label="Size Score" score={commit.score.sizeScore.total} />
                </>
              )}
            </div>
          </div>

          {/* Commit Details */}
          <div className="p-6 overflow-y-auto max-h-64">
            {/* Full Message */}
            {commit.message.includes('\n') && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Full Message</h4>
                <pre className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap font-mono">
                  {commit.message}
                </pre>
              </div>
            )}

            {/* AI Summary */}
            {hasAIAnalysis && commit.enhancedScore?.semanticAnalysis.summary && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">AI Summary</h4>
                <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
                  {commit.enhancedScore.semanticAnalysis.summary}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-green-600">+{commit.stats.additions}</p>
                <p className="text-xs text-gray-500">Additions</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-red-600">-{commit.stats.deletions}</p>
                <p className="text-xs text-gray-500">Deletions</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{commit.stats.filesChanged}</p>
                <p className="text-xs text-gray-500">Files Changed</p>
              </div>
            </div>

            {/* Message Quality Breakdown */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Message Analysis</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Conventional Commit</span>
                  <span className={commit.score.messageQuality.isConventionalCommit ? 'text-green-600' : 'text-gray-400'}>
                    {commit.score.messageQuality.isConventionalCommit ? 'Yes' : 'No'}
                  </span>
                </div>
                {commit.score.messageQuality.commitType && (
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium">{commit.score.messageQuality.commitType}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
