import OpenAI from 'openai';
import type { Commit } from '@/types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Token tracking
let totalTokensUsed = 0;

export function getTokensUsed(): number {
  return totalTokensUsed;
}

export function resetTokensUsed(): void {
  totalTokensUsed = 0;
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if it's a rate limit error
      if (error instanceof OpenAI.RateLimitError) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await sleep(delay);
        continue;
      }

      // For other errors, don't retry
      throw error;
    }
  }

  throw lastError;
}

export interface CommitAnalysis {
  intent: string;
  category: 'feature' | 'bugfix' | 'refactor' | 'docs' | 'test' | 'chore' | 'other';
  quality: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  suggestions: string[];
}

export interface RepositoryInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overallAssessment: string;
}

/**
 * Analyze a batch of commits using OpenAI
 */
export async function analyzeCommits(commits: Commit[]): Promise<CommitAnalysis[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set, skipping AI analysis');
    return commits.map(() => ({
      intent: 'Unknown (AI analysis disabled)',
      category: 'other' as const,
      quality: 'needs_improvement' as const,
      suggestions: ['Enable AI analysis by setting OPENAI_API_KEY'],
    }));
  }

  // Process commits in batches to avoid token limits
  const BATCH_SIZE = 10;
  const results: CommitAnalysis[] = [];

  for (let i = 0; i < commits.length; i += BATCH_SIZE) {
    const batch = commits.slice(i, i + BATCH_SIZE);
    const batchResults = await analyzeBatch(batch);
    results.push(...batchResults);
  }

  return results;
}

async function analyzeBatch(commits: Commit[]): Promise<CommitAnalysis[]> {
  const commitData = commits.map((c, idx) => ({
    index: idx,
    message: c.message,
    body: c.body || '',
    filesChanged: c.stats.filesChanged,
    linesChanged: c.stats.total,
  }));

  const prompt = `Analyze these git commits and provide structured feedback for each.

Commits:
${JSON.stringify(commitData, null, 2)}

For each commit, provide:
1. intent: A brief description of what the commit aims to accomplish
2. category: One of: feature, bugfix, refactor, docs, test, chore, other
3. quality: One of: excellent, good, needs_improvement, poor
4. suggestions: Array of 0-2 specific suggestions for improvement

Respond with a JSON array matching the commit order.`;

  const response = await withRetry(async () => {
    return await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a git commit analyzer. Respond only with valid JSON arrays.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
  });

  // Track tokens
  if (response.usage) {
    totalTokensUsed += response.usage.total_tokens;
  }

  try {
    const content = response.choices[0]?.message?.content || '{"commits":[]}';
    const parsed = JSON.parse(content);
    const analyses = parsed.commits || parsed.results || parsed;

    return Array.isArray(analyses)
      ? analyses.map((a: CommitAnalysis) => ({
          intent: a.intent || 'Unknown',
          category: a.category || 'other',
          quality: a.quality || 'needs_improvement',
          suggestions: a.suggestions || [],
        }))
      : commits.map(() => ({
          intent: 'Analysis failed',
          category: 'other' as const,
          quality: 'needs_improvement' as const,
          suggestions: [],
        }));
  } catch {
    return commits.map(() => ({
      intent: 'Analysis failed',
      category: 'other' as const,
      quality: 'needs_improvement' as const,
      suggestions: [],
    }));
  }
}

/**
 * Generate repository-level insights using OpenAI
 */
export async function generateRepositoryInsights(
  commits: Commit[],
  categoryScores: { messageQuality: number; commitSize: number; consistency: number },
  antiPatternCount: number
): Promise<RepositoryInsights> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      summary: 'AI analysis is disabled. Set OPENAI_API_KEY to enable.',
      strengths: [],
      weaknesses: [],
      recommendations: ['Configure OpenAI API key for detailed insights'],
      overallAssessment: 'Unable to assess without AI capabilities',
    };
  }

  const commitSummary = {
    totalCommits: commits.length,
    contributors: [...new Set(commits.map((c) => c.author.email))].length,
    avgMessageLength: Math.round(
      commits.reduce((sum, c) => sum + c.message.length, 0) / commits.length
    ),
    avgLinesChanged: Math.round(
      commits.reduce((sum, c) => sum + c.stats.total, 0) / commits.length
    ),
    conventionalCommits: commits.filter((c) =>
      /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:/.test(c.message)
    ).length,
    sampleMessages: commits.slice(0, 5).map((c) => c.message),
  };

  const prompt = `Analyze this git repository's commit practices and provide insights.

Repository Stats:
- Total Commits: ${commitSummary.totalCommits}
- Contributors: ${commitSummary.contributors}
- Average Message Length: ${commitSummary.avgMessageLength} chars
- Average Lines Changed: ${commitSummary.avgLinesChanged}
- Conventional Commits: ${commitSummary.conventionalCommits}/${commitSummary.totalCommits}
- Anti-patterns Detected: ${antiPatternCount}

Scores (0-100):
- Message Quality: ${categoryScores.messageQuality}
- Commit Size: ${categoryScores.commitSize}
- Consistency: ${categoryScores.consistency}

Sample Commit Messages:
${commitSummary.sampleMessages.map((m, i) => `${i + 1}. "${m}"`).join('\n')}

Provide:
1. summary: A 1-2 sentence overview of the repository's commit practices
2. strengths: Array of 2-3 specific things done well
3. weaknesses: Array of 2-3 areas needing improvement
4. recommendations: Array of 3-4 actionable recommendations
5. overallAssessment: A brief assessment of the team's git practices

Respond with valid JSON.`;

  const response = await withRetry(async () => {
    return await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a git practices consultant. Provide actionable, specific feedback.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });
  });

  // Track tokens
  if (response.usage) {
    totalTokensUsed += response.usage.total_tokens;
  }

  try {
    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      summary: parsed.summary || 'Analysis complete',
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      recommendations: parsed.recommendations || [],
      overallAssessment: parsed.overallAssessment || 'Assessment unavailable',
    };
  } catch {
    return {
      summary: 'Failed to parse AI response',
      strengths: [],
      weaknesses: [],
      recommendations: [],
      overallAssessment: 'Assessment failed',
    };
  }
}
