'use client';

import { CollaborationMetrics } from '@/types';

interface CollaborationPanelProps {
  metrics: CollaborationMetrics;
}

export function CollaborationPanel({ metrics }: CollaborationPanelProps): React.ReactElement {
  const { busFactor, collaborationPattern, knowledgeSilos, reviewPatterns, fileOwnership } = metrics;

  const getRiskColor = (risk: 'high' | 'medium' | 'low'): string => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
    }
  };

  const getPatternColor = (type: string): string => {
    switch (type) {
      case 'collaborative': return 'text-green-600 bg-green-100';
      case 'mixed': return 'text-yellow-600 bg-yellow-100';
      case 'siloed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaboration Metrics</h3>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Bus Factor */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Bus Factor</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(busFactor.riskLevel)}`}>
              {busFactor.riskLevel.toUpperCase()}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{busFactor.overallBusFactor}</div>
          <p className="text-xs text-gray-500 mt-1">
            {busFactor.overallBusFactor === 1
              ? 'One person controls most code'
              : `${busFactor.overallBusFactor} people cover 50% of commits`}
          </p>
        </div>

        {/* Collaboration Score */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Collaboration</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPatternColor(collaborationPattern.type)}`}>
              {collaborationPattern.type.toUpperCase()}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{collaborationPattern.collaborationScore}</div>
          <p className="text-xs text-gray-500 mt-1">Collaboration score (0-100)</p>
        </div>

        {/* Review Activity */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Merge Commits</span>
            {reviewPatterns.hasMergeCommits ? (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-600">
                ACTIVE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                NONE
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {Math.round(reviewPatterns.mergeCommitRatio * 100)}%
          </div>
          <p className="text-xs text-gray-500 mt-1">Of total commits are merges</p>
        </div>
      </div>

      {/* Collaboration Pattern Description */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">{collaborationPattern.description}</p>
      </div>

      {/* Knowledge Silos */}
      {knowledgeSilos.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Knowledge Silos</h4>
          <div className="space-y-2">
            {knowledgeSilos.slice(0, 5).map((silo, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(silo.siloRisk)}`}>
                  {silo.siloRisk.toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{silo.contributor}</p>
                  <p className="text-xs text-gray-500">
                    Exclusive areas: {silo.exclusiveFiles.join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Ownership */}
      {fileOwnership.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Area Ownership</h4>
          <div className="space-y-2">
            {fileOwnership.slice(0, 8).map((ownership, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 w-24 truncate">
                  {ownership.filePath}
                </span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${ownership.ownershipPercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {ownership.ownershipPercentage}%
                </span>
                <span className="text-xs text-gray-600 w-32 truncate">
                  {ownership.primaryOwner.split('@')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Mergers */}
      {reviewPatterns.topMergers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Top Mergers</h4>
          <div className="flex flex-wrap gap-2">
            {reviewPatterns.topMergers.map((merger, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100"
              >
                <span className="font-medium text-gray-900">{merger.name}</span>
                <span className="ml-2 text-gray-500">{merger.count} merges</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="border-t mt-6 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendation</h4>
        <p className="text-sm text-gray-600">{busFactor.recommendation}</p>
      </div>
    </div>
  );
}
