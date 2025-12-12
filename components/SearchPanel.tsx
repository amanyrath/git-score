'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AIEnhancedCommit } from '@/types';

interface SearchPanelProps {
  commits: AIEnhancedCommit[];
  onSelectCommit: (commit: AIEnhancedCommit) => void;
}

export function SearchPanel({ commits, onSelectCommit }: SearchPanelProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Search results
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    return commits
      .filter((commit) => {
        // Search in message
        if (commit.message.toLowerCase().includes(lowerQuery)) return true;
        // Search in author
        if (commit.author.name.toLowerCase().includes(lowerQuery)) return true;
        if (commit.author.email.toLowerCase().includes(lowerQuery)) return true;
        // Search in SHA
        if (commit.sha.toLowerCase().includes(lowerQuery)) return true;
        // Search in intent
        if (commit.enhancedScore?.semanticAnalysis.intent.toLowerCase().includes(lowerQuery)) return true;
        return false;
      })
      .slice(0, 10); // Limit to 10 results
  }, [commits, query]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with / or Cmd+K
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Handle keyboard navigation in results
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        onSelectCommit(results[selectedIndex]);
        setIsOpen(false);
        setQuery('');
      }
    },
    [results, selectedIndex, onSelectCommit]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search commits</span>
        <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 rounded">/</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => {
          setIsOpen(false);
          setQuery('');
        }}
      />

      {/* Search dialog */}
      <div className="relative min-h-screen flex items-start justify-center pt-20 px-4">
        <div className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search commits by message, author, SHA..."
              className="flex-1 outline-none text-gray-900 placeholder-gray-400"
            />
            <kbd className="px-1.5 py-0.5 text-xs text-gray-500 bg-gray-100 rounded">ESC</kbd>
          </div>

          {/* Results */}
          {query.trim() && (
            <div ref={resultsRef} className="max-h-80 overflow-y-auto py-2">
              {results.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No commits found for &quot;{query}&quot;
                </div>
              ) : (
                results.map((commit, index) => {
                  const score = commit.enhancedScore?.overallScore ?? commit.score.overallScore;
                  return (
                    <button
                      key={commit.sha}
                      data-index={index}
                      onClick={() => {
                        onSelectCommit(commit);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 ${
                        index === selectedIndex ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          score >= 80
                            ? 'bg-green-100 text-green-600'
                            : score >= 60
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {commit.message.split('\n')[0]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {commit.sha.slice(0, 7)} by {commit.author.name}
                        </p>
                      </div>
                      {commit.enhancedScore?.semanticAnalysis.intent && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          {commit.enhancedScore.semanticAnalysis.intent}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Keyboard hints */}
          <div className="flex items-center gap-4 px-4 py-2 border-t text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-100 rounded">↑</kbd>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd>
              to select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
