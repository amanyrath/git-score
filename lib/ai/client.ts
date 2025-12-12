import OpenAI from 'openai';

export type ModelType = 'gpt-4o-mini' | 'gpt-4o';

export type CommitIntent =
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'docs'
  | 'test'
  | 'style'
  | 'chore'
  | 'performance'
  | 'security';

export interface SemanticAnalysis {
  intent: CommitIntent;
  intentConfidence: number; // 0-100
  clarity: number; // 0-100
  completeness: number; // 0-100
  technicalQuality: number; // 0-100
  reasoning: string;
}

export interface Insight {
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  severity: 'high' | 'medium' | 'low';
  category: 'strength' | 'improvement' | 'pattern' | 'recommendation';
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface AIClientConfig {
  apiKey?: string;
  model?: ModelType;
  maxRetries?: number;
}

export class AIClient {
  private client: OpenAI;
  private model: ModelType;
  private maxRetries: number;
  private totalUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  constructor(config: AIClientConfig = {}) {
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    });
    this.model = config.model || 'gpt-4o-mini';
    this.maxRetries = config.maxRetries || 3;
  }

  getTokenUsage(): TokenUsage {
    return { ...this.totalUsage };
  }

  private updateTokenUsage(usage: OpenAI.CompletionUsage | undefined) {
    if (usage) {
      this.totalUsage.promptTokens += usage.prompt_tokens;
      this.totalUsage.completionTokens += usage.completion_tokens;
      this.totalUsage.totalTokens += usage.total_tokens;
    }
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === retries) throw error;

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  // Analyze a batch of commit messages (up to 20)
  async analyzeCommitBatch(
    commits: Array<{ sha: string; message: string; body?: string }>
  ): Promise<Map<string, SemanticAnalysis>> {
    const prompt = `Analyze these Git commit messages and return a JSON array with analysis for each.

For each commit, evaluate:
1. intent: Categorize as one of: feature, bugfix, refactor, docs, test, style, chore, performance, security
2. intentConfidence: How confident are you in the classification? (0-100)
3. clarity: How clear and specific is the message about what changed? (0-100)
4. completeness: Does it explain WHY the change was made? Does it provide context? (0-100)
5. technicalQuality: Is it technically accurate with proper terminology? (0-100)
6. reasoning: Brief explanation of your scores (1-2 sentences)

Commits to analyze:
${commits.map((c, i) => `${i + 1}. [${c.sha.slice(0, 7)}] ${c.message}${c.body ? `\n   ${c.body.slice(0, 200)}` : ''}`).join('\n')}

Return ONLY a JSON array with objects containing: sha, intent, intentConfidence, clarity, completeness, technicalQuality, reasoning`;

    const response = await this.retryWithBackoff(async () => {
      return this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a Git commit analyzer. Return only valid JSON arrays, no markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
    });

    this.updateTokenUsage(response.usage);

    const content = response.choices[0]?.message?.content || '{"results":[]}';

    try {
      const parsed = JSON.parse(content);
      const results = Array.isArray(parsed) ? parsed : parsed.results || [];

      const analysisMap = new Map<string, SemanticAnalysis>();

      for (const result of results) {
        const sha = commits.find(c =>
          c.sha.startsWith(result.sha) || result.sha?.startsWith(c.sha.slice(0, 7))
        )?.sha;

        if (sha) {
          analysisMap.set(sha, {
            intent: result.intent || 'chore',
            intentConfidence: Math.min(100, Math.max(0, result.intentConfidence || 50)),
            clarity: Math.min(100, Math.max(0, result.clarity || 50)),
            completeness: Math.min(100, Math.max(0, result.completeness || 50)),
            technicalQuality: Math.min(100, Math.max(0, result.technicalQuality || 50)),
            reasoning: result.reasoning || '',
          });
        }
      }

      return analysisMap;
    } catch {
      // Return empty map on parse failure
      return new Map();
    }
  }

  // Process commits in batches with concurrency control
  async analyzeCommits(
    commits: Array<{ sha: string; message: string; body?: string }>,
    options: { batchSize?: number; concurrency?: number } = {}
  ): Promise<Map<string, SemanticAnalysis>> {
    const { batchSize = 20, concurrency = 3 } = options;

    // Split into batches
    const batches: Array<typeof commits> = [];
    for (let i = 0; i < commits.length; i += batchSize) {
      batches.push(commits.slice(i, i + batchSize));
    }

    const allResults = new Map<string, SemanticAnalysis>();

    // Process batches with concurrency limit
    for (let i = 0; i < batches.length; i += concurrency) {
      const batchGroup = batches.slice(i, i + concurrency);

      const results = await Promise.allSettled(
        batchGroup.map((batch) => this.analyzeCommitBatch(batch))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          for (const [sha, analysis] of result.value) {
            allResults.set(sha, analysis);
          }
        }
        // Continue processing even if some batches fail
      }
    }

    return allResults;
  }

  // Generate repository-level insights
  async generateInsights(context: {
    repoName: string;
    totalCommits: number;
    averageScore: number;
    categoryScores: {
      messageQuality: number;
      commitSize: number;
      consistency: number;
    };
    antiPatterns: {
      giantCommits: number;
      tinyCommits: number;
      wipCommits: number;
      mergeCommits: number;
    };
    contributorCount: number;
    topIssues: string[];
  }): Promise<Insight[]> {
    const prompt = `Analyze this Git repository's commit practices and generate 5-8 actionable insights.

Repository: ${context.repoName}
Total Commits: ${context.totalCommits}
Contributors: ${context.contributorCount}
Overall Score: ${context.averageScore}/100

Category Scores:
- Message Quality: ${context.categoryScores.messageQuality}/40
- Commit Size: ${context.categoryScores.commitSize}/35
- Consistency: ${context.categoryScores.consistency}/25

Anti-patterns Detected:
- Giant commits (>1000 lines): ${context.antiPatterns.giantCommits}
- Tiny/vague commits: ${context.antiPatterns.tinyCommits}
- WIP commits: ${context.antiPatterns.wipCommits}
- Merge commits: ${context.antiPatterns.mergeCommits}

Top Issues: ${context.topIssues.join(', ') || 'None identified'}

Generate 5-8 insights with this JSON structure:
{
  "insights": [
    {
      "title": "Concise title",
      "description": "2-3 sentences with specific data from the analysis",
      "impact": "Why this matters for the team",
      "recommendation": "Specific action to take",
      "severity": "high|medium|low",
      "category": "strength|improvement|pattern|recommendation"
    }
  ]
}

Focus on non-obvious patterns and actionable improvements. Include both strengths and areas for improvement.`;

    const response = await this.retryWithBackoff(async () => {
      return this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a Git practices consultant. Return only valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });
    });

    this.updateTokenUsage(response.usage);

    const content = response.choices[0]?.message?.content || '{"insights":[]}';

    try {
      const parsed = JSON.parse(content);
      return (parsed.insights || []).map((insight: Insight) => ({
        title: insight.title || 'Untitled Insight',
        description: insight.description || '',
        impact: insight.impact || '',
        recommendation: insight.recommendation || '',
        severity: insight.severity || 'medium',
        category: insight.category || 'recommendation',
      }));
    } catch {
      return [];
    }
  }
}
