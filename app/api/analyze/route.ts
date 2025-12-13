import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GitHubClient } from '@/lib/github';
import { analyzeRepository } from '@/lib/analysis';
import { AIClient } from '@/lib/ai';
import { detectAntiPatterns, calculateEnhancedScores } from '@/lib/analysis/scoring';
import { analyzeCollaboration } from '@/lib/analysis/collaboration';

// Request validation schema
const analyzeRequestSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  token: z.string().optional(),
  enableAI: z.boolean().optional().default(false),
  openaiKey: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { url, token, enableAI, openaiKey } = analyzeRequestSchema.parse(body);

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

    // Analyze repository (heuristic analysis)
    const analysis = analyzeRepository(repository, commits);

    // Analyze collaboration patterns (bus factor, knowledge silos)
    analysis.collaboration = analyzeCollaboration(commits, analysis.contributors);

    // AI-enhanced analysis (optional)
    if (enableAI) {
      const aiApiKey = openaiKey || process.env.OPENAI_API_KEY;

      if (!aiApiKey) {
        return NextResponse.json(
          { success: false, error: 'OpenAI API key required for AI analysis. Provide openaiKey or set OPENAI_API_KEY env var.' },
          { status: 400 }
        );
      }

      const aiClient = new AIClient({ apiKey: aiApiKey });

      // Analyze commits semantically
      const semanticScores = await aiClient.analyzeCommits(
        commits.map((c) => ({ sha: c.sha, message: c.message, body: c.body }))
      );

      // Detect anti-patterns
      const antiPatterns = detectAntiPatterns(commits);

      // Calculate enhanced scores
      const enhancedScores = calculateEnhancedScores(commits, semanticScores);

      // Identify top issues for insight generation
      const topIssues: string[] = [];
      if (antiPatterns.giantCommits.length > 0) {
        topIssues.push(`${antiPatterns.giantCommits.length} giant commits (>1000 lines)`);
      }
      if (antiPatterns.wipCommits.length > 0) {
        topIssues.push(`${antiPatterns.wipCommits.length} WIP commits`);
      }
      if (analysis.categoryScores.messageQuality < 20) {
        topIssues.push('Low message quality scores');
      }
      if (analysis.categoryScores.consistency < 15) {
        topIssues.push('Inconsistent commit patterns');
      }

      // Generate AI insights
      const insights = await aiClient.generateInsights({
        repoName: repository.fullName,
        totalCommits: commits.length,
        averageScore: analysis.overallScore,
        categoryScores: analysis.categoryScores,
        antiPatterns: {
          giantCommits: antiPatterns.giantCommits.length,
          tinyCommits: antiPatterns.tinyCommits.length,
          wipCommits: antiPatterns.wipCommits.length,
          mergeCommits: antiPatterns.mergeCommits.length,
        },
        contributorCount: analysis.contributors.length,
        topIssues,
      });

      // Convert Map to object for JSON serialization
      const semanticScoresObj: Record<string, typeof semanticScores extends Map<string, infer V> ? V : never> = {};
      for (const [key, value] of semanticScores) {
        semanticScoresObj[key] = value;
      }

      // Add AI analysis to result
      analysis.aiAnalysis = {
        semanticScores: semanticScoresObj,
        enhancedScores,
        insights,
        antiPatterns,
        tokenUsage: aiClient.getTokenUsage(),
      };

      // Update overall score to use enhanced average if AI is enabled
      if (enhancedScores.length > 0) {
        const avgEnhanced = enhancedScores.reduce((sum, s) => sum + s.overall, 0) / enhancedScores.length;
        analysis.overallScore = Math.round(avgEnhanced);
      }
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

      // Handle OpenAI errors
      if (error.message.includes('OpenAI') || error.message.includes('API key')) {
        return NextResponse.json(
          { success: false, error: `AI Analysis error: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
