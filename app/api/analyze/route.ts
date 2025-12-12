import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github-client';
import { analyzeRepository } from '@/lib/commit-analyzer';
import { GitHubError } from '@/types';

interface AnalyzeRequest {
  owner: string;
  repo: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as AnalyzeRequest;
    const { owner, repo } = body;

    if (!owner || !repo) {
      const error: GitHubError = {
        type: 'UNKNOWN',
        message: 'Owner and repo are required',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Get GitHub token from environment variable (optional)
    const token = process.env.GITHUB_TOKEN;
    const client = createGitHubClient(token);

    // Fetch repository data from GitHub
    const rawResult = await client.analyzeRepository(owner, repo);

    // Apply heuristic-based commit analysis scoring
    const scoredResult = analyzeRepository(rawResult);

    return NextResponse.json(scoredResult);
  } catch (error) {
    // Check if it's our GitHubError type
    if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
      const githubError = error as GitHubError;
      const status = githubError.status || 500;
      return NextResponse.json(githubError, { status });
    }

    // Unknown error
    const unknownError: GitHubError = {
      type: 'UNKNOWN',
      message: 'An unexpected error occurred',
    };
    return NextResponse.json(unknownError, { status: 500 });
  }
}
