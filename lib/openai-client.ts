import OpenAI from 'openai';
import {
  ScoredCommit,
  ScoredContributor,
  ScoredAnalysisResult,
  SemanticAnalysis,
  EnhancedCommitScore,
  AIInsight,
  TokenUsage,
  AIEnhancedCommit,
  AIEnhancedContributor,
  AIEnhancedAnalysisResult,
  CommitIntent,
} from '@/types';

type OpenAIModel = 'gpt-4o-mini' | 'gpt-4o';

const MAX_RETRIES = 3;
const BATCH_SIZE = 20;
const MAX_CONCURRENT_BATCHES = 3;

/**
 * OpenAI client wrapper with retry logic and token tracking
 */
export class AIAnalyzer {
  private client: OpenAI;
  private model: OpenAIModel;
  private tokenUsage: TokenUsage;

  constructor(apiKey: string, model: OpenAIModel = 'gpt-4o-mini') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  /**
   * Get current token usage
   */
  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  /**
   * Execute API call with retry logic
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Analyze a batch of commit messages
   */
  private async analyzeBatch(
    commits: ScoredCommit[]
  ): Promise<Map<string, SemanticAnalysis>> {
    const commitData = commits.map((c) => ({
      sha: c.sha.slice(0, 7),
      message: c.message.slice(0, 500), // Truncate long messages
    }));

    const prompt = `Analyze these Git commit messages and provide semantic analysis for each.

For each commit, return:
- intent: one of [feature, bugfix, refactor, docs, test, style, chore, performance, security]
- clarityScore: 0-100, how clear and understandable is the message
- completenessScore: 0-100, does it adequately describe what changed and why
- technicalQualityScore: 0-100, technical accuracy and professionalism
- summary: brief 10-word summary of what the commit does

Commits to analyze:
${JSON.stringify(commitData, null, 2)}

Return a JSON array with objects containing: sha, intent, clarityScore, completenessScore, technicalQualityScore, summary
Only return the JSON array, no other text.`;

    const response = await this.withRetry(async () => {
      return await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a Git commit analyzer. Analyze commit messages and return structured JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
    });

    // Track token usage
    if (response.usage) {
      this.tokenUsage.promptTokens += response.usage.prompt_tokens;
      this.tokenUsage.completionTokens += response.usage.completion_tokens;
      this.tokenUsage.totalTokens += response.usage.total_tokens;
    }

    const content = response.choices[0]?.message?.content || '{"results":[]}';
    const results = new Map<string, SemanticAnalysis>();

    try {
      const parsed = JSON.parse(content);
      const analyses = parsed.results || parsed;

      if (Array.isArray(analyses)) {
        for (const analysis of analyses) {
          results.set(analysis.sha, {
            intent: analysis.intent as CommitIntent,
            clarityScore: Math.min(100, Math.max(0, analysis.clarityScore || 50)),
            completenessScore: Math.min(100, Math.max(0, analysis.completenessScore || 50)),
            technicalQualityScore: Math.min(100, Math.max(0, analysis.technicalQualityScore || 50)),
            summary: analysis.summary || 'No summary available',
          });
        }
      }
    } catch {
      // If parsing fails, return empty results
      console.error('Failed to parse AI response');
    }

    return results;
  }

  /**
   * Generate repository-level insights
   */
  private async generateInsights(
    commits: AIEnhancedCommit[],
    contributors: AIEnhancedContributor[]
  ): Promise<AIInsight[]> {
    const summary = {
      totalCommits: commits.length,
      contributors: contributors.length,
      intentBreakdown: this.getIntentBreakdown(commits),
      avgClarityScore: this.getAverage(commits.map((c) => c.enhancedScore?.clarityScore || 50)),
      avgCompletenessScore: this.getAverage(commits.map((c) => c.enhancedScore?.completenessScore || 50)),
      topContributors: contributors.slice(0, 3).map((c) => ({
        name: c.name,
        commits: c.stats.totalCommits,
        avgScore: c.aiAverageScore || c.score.averageScore,
      })),
    };

    const prompt = `Based on this repository analysis, generate 5-8 actionable insights.

Repository Summary:
${JSON.stringify(summary, null, 2)}

Generate insights about:
- Commit message quality patterns
- Areas needing improvement
- Best practices being followed or missed
- Team collaboration patterns
- Technical debt indicators

For each insight return:
- title: short title (5-10 words)
- description: detailed description (2-3 sentences)
- impact: what's the impact of this issue/pattern
- recommendation: specific actionable advice
- severity: "info", "warning", or "critical"

Return a JSON object with an "insights" array containing 5-8 insights.`;

    const response = await this.withRetry(async () => {
      return await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a Git repository analyst. Generate actionable insights in JSON format.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });
    });

    // Track token usage
    if (response.usage) {
      this.tokenUsage.promptTokens += response.usage.prompt_tokens;
      this.tokenUsage.completionTokens += response.usage.completion_tokens;
      this.tokenUsage.totalTokens += response.usage.total_tokens;
    }

    const content = response.choices[0]?.message?.content || '{"insights":[]}';

    try {
      const parsed = JSON.parse(content);
      return (parsed.insights || []).slice(0, 8).map((insight: AIInsight) => ({
        title: insight.title || 'Insight',
        description: insight.description || '',
        impact: insight.impact || '',
        recommendation: insight.recommendation || '',
        severity: (['info', 'warning', 'critical'].includes(insight.severity)
          ? insight.severity
          : 'info') as AIInsight['severity'],
      }));
    } catch {
      return [];
    }
  }

  /**
   * Helper: Get intent breakdown
   */
  private getIntentBreakdown(commits: AIEnhancedCommit[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const commit of commits) {
      const intent = commit.enhancedScore?.semanticAnalysis.intent || 'chore';
      breakdown[intent] = (breakdown[intent] || 0) + 1;
    }
    return breakdown;
  }

  /**
   * Helper: Calculate average
   */
  private getAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  }

  /**
   * Calculate enhanced commit score with new weights
   * 30% heuristic, 25% clarity, 20% completeness, 20% size, 5% technical
   */
  private calculateEnhancedScore(
    commit: ScoredCommit,
    semantic: SemanticAnalysis
  ): EnhancedCommitScore {
    const heuristicScore = commit.score.overallScore;
    const sizeScore = commit.score.sizeScore.total;

    const overallScore = Math.round(
      heuristicScore * 0.3 +
      semantic.clarityScore * 0.25 +
      semantic.completenessScore * 0.2 +
      sizeScore * 0.2 +
      semantic.technicalQualityScore * 0.05
    );

    return {
      sha: commit.sha,
      heuristicScore,
      clarityScore: semantic.clarityScore,
      completenessScore: semantic.completenessScore,
      sizeScore,
      technicalScore: semantic.technicalQualityScore,
      overallScore,
      semanticAnalysis: semantic,
    };
  }

  /**
   * Process commits in batches with concurrency limit
   */
  private async processBatches(
    commits: ScoredCommit[]
  ): Promise<Map<string, SemanticAnalysis>> {
    const results = new Map<string, SemanticAnalysis>();
    const batches: ScoredCommit[][] = [];

    // Split commits into batches
    for (let i = 0; i < commits.length; i += BATCH_SIZE) {
      batches.push(commits.slice(i, i + BATCH_SIZE));
    }

    // Process batches with concurrency limit
    for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
      const concurrentBatches = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
      const batchResults = await Promise.all(
        concurrentBatches.map((batch) => this.analyzeBatch(batch))
      );

      for (const batchResult of batchResults) {
        for (const [sha, analysis] of batchResult) {
          // Find full SHA from short SHA
          const commit = commits.find((c) => c.sha.startsWith(sha));
          if (commit) {
            results.set(commit.sha, analysis);
          }
        }
      }
    }

    return results;
  }

  /**
   * Main entry point: Analyze repository with AI
   */
  async analyzeRepository(
    scoredResult: ScoredAnalysisResult
  ): Promise<AIEnhancedAnalysisResult> {
    // Reset token usage for this analysis
    this.tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    // Process commits in batches
    const semanticResults = await this.processBatches(scoredResult.commits);

    // Enhance commits with AI scores
    const enhancedCommits: AIEnhancedCommit[] = scoredResult.commits.map((commit) => {
      const semantic = semanticResults.get(commit.sha);
      if (semantic) {
        return {
          ...commit,
          enhancedScore: this.calculateEnhancedScore(commit, semantic),
        };
      }
      return commit;
    });

    // Calculate contributor AI scores and dominant intents
    const enhancedContributors: AIEnhancedContributor[] = scoredResult.contributors.map(
      (contributor) => {
        const contributorCommits = enhancedCommits.filter(
          (c) => c.author.email.toLowerCase() === contributor.email.toLowerCase()
        );

        const aiScores = contributorCommits
          .filter((c) => c.enhancedScore)
          .map((c) => c.enhancedScore!.overallScore);

        const aiAverageScore = aiScores.length > 0 ? this.getAverage(aiScores) : undefined;

        // Find dominant intent
        const intentCounts: Record<string, number> = {};
        for (const commit of contributorCommits) {
          if (commit.enhancedScore) {
            const intent = commit.enhancedScore.semanticAnalysis.intent;
            intentCounts[intent] = (intentCounts[intent] || 0) + 1;
          }
        }
        const dominantIntent = Object.entries(intentCounts).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0] as CommitIntent | undefined;

        return {
          ...contributor,
          aiAverageScore,
          dominantIntent,
        };
      }
    );

    // Generate AI insights
    const aiInsights = await this.generateInsights(enhancedCommits, enhancedContributors);

    // Calculate AI-enhanced repository score
    const aiScores = enhancedCommits
      .filter((c) => c.enhancedScore)
      .map((c) => c.enhancedScore!.overallScore);
    const aiRepositoryScore = aiScores.length > 0 ? this.getAverage(aiScores) : undefined;

    return {
      ...scoredResult,
      commits: enhancedCommits,
      contributors: enhancedContributors,
      aiInsights,
      aiRepositoryScore,
      tokenUsage: this.getTokenUsage(),
      aiAnalysisEnabled: true,
    };
  }
}

/**
 * Create AI analyzer instance
 */
export function createAIAnalyzer(
  apiKey: string,
  model: OpenAIModel = 'gpt-4o-mini'
): AIAnalyzer {
  return new AIAnalyzer(apiKey, model);
}
