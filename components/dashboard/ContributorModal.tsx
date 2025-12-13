'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ContributorAnalysis } from '@/types';
import { format } from 'date-fns';

interface ContributorModalProps {
  contributor: ContributorAnalysis;
  open: boolean;
  onClose: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getCategory(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  return 'Needs Improvement';
}

export function ContributorModal({ contributor, open, onClose }: ContributorModalProps) {
  const { author, commits, totalCommits, stats, scores, patterns } = contributor;

  // Sort commits by score (best and worst)
  const sortedByTimestamp = [...commits].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const recentCommits = sortedByTimestamp.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {author.avatarUrl && (
              <img
                src={author.avatarUrl}
                alt={author.name}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <DialogTitle className="text-xl">{author.name}</DialogTitle>
              <p className="text-sm text-gray-500">{author.email}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Overall Score */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Overall Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(scores.overall)}`}>
                {scores.overall}
              </p>
            </div>
            <Badge
              variant={scores.overall >= 60 ? 'default' : 'secondary'}
              className="text-sm"
            >
              {getCategory(scores.overall)}
            </Badge>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{totalCommits}</p>
                <p className="text-xs text-gray-500">Total Commits</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">+{stats.totalAdditions.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Lines Added</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">-{stats.totalDeletions.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Lines Deleted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{Math.round(stats.avgCommitSize)}</p>
                <p className="text-xs text-gray-500">Avg Commit Size</p>
              </CardContent>
            </Card>
          </div>

          {/* Score Breakdown */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Score Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Message Quality</span>
                <span className="font-medium">{scores.messageQuality}/40</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Commit Size</span>
                <span className="font-medium">{scores.commitSize}/35</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Consistency</span>
                <span className="font-medium">{scores.consistency}/25</span>
              </div>
            </div>
          </div>

          {/* Recent Commits */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Recent Commits</h3>
            <div className="space-y-2">
              {recentCommits.map((commit) => (
                <div
                  key={commit.sha}
                  className="p-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-medium truncate flex-1">{commit.message}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {format(new Date(commit.timestamp), 'MMM d')}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span className="text-green-600">+{commit.stats.additions}</span>
                    <span className="text-red-600">-{commit.stats.deletions}</span>
                    <span>{commit.stats.filesChanged} files</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Patterns */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Activity Patterns</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Velocity</p>
                <p className="font-medium">{patterns.velocity.toFixed(1)} commits/day</p>
              </div>
              <div>
                <p className="text-gray-500">Most Active Hours</p>
                <p className="font-medium">
                  {patterns.workingHours.slice(0, 3).map((h) => `${h}:00`).join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
