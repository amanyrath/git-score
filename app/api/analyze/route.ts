import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github-client';
import { analyzeRepository } from '@/lib/commit-analyzer';
import { createAIAnalyzer } from '@/lib/openai-client';
import { GitHubError, AIEnhancedAnalysisResult } from '@/types';

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
    const githubToken = process.env.GITHUB_TOKEN;
    const client = createGitHubClient(githubToken);

    // Fetch repository data from GitHub
    const rawResult = await client.analyzeRepository(owner, repo);

    // Apply heuristic-based commit analysis scoring
    const scoredResult = analyzeRepository(rawResult);

    // Check if OpenAI API key is available for AI analysis
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      try {
        // Apply AI-powered semantic analysis
        const aiAnalyzer = createAIAnalyzer(openaiKey, 'gpt-4o-mini');
        const aiEnhancedResult = await aiAnalyzer.analyzeRepository(scoredResult);
        return NextResponse.json(aiEnhancedResult);
      } catch (aiError) {
        // If AI analysis fails, return heuristic results with aiAnalysisEnabled: false
        console.error('AI analysis failed:', aiError);
        const fallbackResult: AIEnhancedAnalysisResult = {
          ...scoredResult,
          aiInsights: [],
          aiAnalysisEnabled: false,
        };
        return NextResponse.json(fallbackResult);
      }
    }

    // No OpenAI key - return heuristic results only
    const resultWithoutAI: AIEnhancedAnalysisResult = {
      ...scoredResult,
      aiInsights: [],
      aiAnalysisEnabled: false,
    };
    return NextResponse.json(resultWithoutAI);
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
