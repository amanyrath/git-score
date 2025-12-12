'use client';

import { useState } from 'react';
import { AIEnhancedAnalysisResult } from '@/types';
import {
  exportAsJSON,
  exportContributorsAsCSV,
  exportCommitsAsCSV,
  generateShareableLink,
  copyShareableLink,
} from '@/lib/export';

interface ExportPanelProps {
  result: AIEnhancedAnalysisResult;
}

export function ExportPanel({ result }: ExportPanelProps): React.ReactElement {
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExportJSON = (): void => {
    exportAsJSON(result);
  };

  const handleExportContributorsCSV = (): void => {
    exportContributorsAsCSV(result.contributors);
  };

  const handleExportCommitsCSV = (): void => {
    exportCommitsAsCSV(result.commits);
  };

  const handleShare = async (): Promise<void> => {
    const id = generateShareableLink(result);
    setShareId(id);

    const success = await copyShareableLink(id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export & Share</h3>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExportJSON}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Export JSON
        </button>
        <button
          onClick={handleExportContributorsCSV}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Contributors CSV
        </button>
        <button
          onClick={handleExportCommitsCSV}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Commits CSV
        </button>
        <button
          onClick={handleShare}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {copied ? 'Link Copied!' : 'Share Link'}
        </button>
      </div>

      {shareId && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Shareable link (valid for 24 hours):</p>
          <code className="text-xs text-blue-600 break-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/shared/${shareId}` : ''}
          </code>
        </div>
      )}
    </div>
  );
}
