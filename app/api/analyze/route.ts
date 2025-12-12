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

    // Fetch repository and commits in a single GraphQL query (1 API call vs 101)
    const { repository, commits } = await client.getRepositoryWithCommits(owner, repo, {
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    // Handle GitHub API errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { success: false, error: 'GitHub API rate limit exceeded. Please try again later or provide a token.' },
          { status: 429 }
        );
      }

      if (error.message.includes('Not Found')) {
        return NextResponse.json(
          { success: false, error: 'Repository not found or is private' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
