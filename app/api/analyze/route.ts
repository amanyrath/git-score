import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GitHubClient } from '@/lib/github';
import { analyzeRepository } from '@/lib/analysis';

// Request validation schema
const analyzeRequestSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  token: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { url, token } = analyzeRequestSchema.parse(body);

    // Parse GitHub URL
    const parsed = GitHubClient.parseURL(url);
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: 'Invalid GitHub URL format' },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Initialize GitHub client
    const client = new GitHubClient({ auth: token });

    // Validate repository accessibility
    const isValid = await client.validateRepository(owner, repo);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Repository not found or not accessible' },
        { status: 404 }
      );
    }

    // Fetch repository metadata
    const repository = await client.getRepository(owner, repo);

    // Fetch commits (limited to 100 for MVP)
    const commits = await client.getCommits(owner, repo, {
      branch: repository.defaultBranch,
      limit: 100,
    });

    if (commits.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No commits found in repository' },
        { status: 400 }
      );
    }

    // Analyze repository
    const analysis = analyzeRepository(repository, commits);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    // Handle GitHub API and other errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const errorObj = error as { status?: number };

      // Rate limit exceeded (403 with rate limit message or 429)
      if (message.includes('rate limit') || errorObj.status === 429) {
        return NextResponse.json(
          {
            success: false,
            error: 'GitHub API rate limit exceeded. Please wait a few minutes or provide a Personal Access Token to increase your limit from 60 to 5,000 requests per hour.'
          },
          { status: 429 }
        );
      }

      // Repository not found (404)
      if (message.includes('not found') || errorObj.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: 'Repository not found. Please check the URL and try again.'
          },
          { status: 404 }
        );
      }

      // Private repository or authentication required (403)
      if (errorObj.status === 403 || message.includes('forbidden')) {
        return NextResponse.json(
          {
            success: false,
            error: 'This repository is private or requires authentication. Please provide a Personal Access Token with repository access.'
          },
          { status: 403 }
        );
      }

      // Invalid authentication token (401)
      if (errorObj.status === 401 || message.includes('bad credentials') || message.includes('unauthorized')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid Personal Access Token. Please check your token and ensure it has the required permissions.'
          },
          { status: 401 }
        );
      }

      // Network errors
      if (message.includes('network') || message.includes('fetch') || message.includes('econnrefused') || message.includes('timeout')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Network error. Please check your internet connection and try again.'
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
