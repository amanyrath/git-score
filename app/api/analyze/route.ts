import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GitHubClient } from '@/lib/github';
import { analyzeRepository } from '@/lib/analysis';
import { generateRepositoryInsights } from '@/lib/ai';

// Request validation schema
const analyzeRequestSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  token: z.string().optional(),
  enableAI: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { url, token, enableAI } = analyzeRequestSchema.parse(body);

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

    // Add AI insights if enabled
    if (enableAI) {
      try {
        const aiInsights = await generateRepositoryInsights(
          commits,
          analysis.categoryScores,
          analysis.antiPatterns.total
        );
        analysis.aiInsights = aiInsights;
        analysis.aiEnabled = true;
      } catch (aiError) {
        console.warn('AI analysis failed:', aiError);
        analysis.aiEnabled = false;
      }
    } else {
      analysis.aiEnabled = false;
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
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
