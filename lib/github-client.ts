import { Octokit } from '@octokit/rest';
import {
  Repository,
  Commit,
  Author,
  CommitStats,
  Contributor,
  ContributorStats,
  GitHubError,
  GitHubErrorType,
  AnalysisResult,
} from '@/types';

const MAX_COMMITS = 100;

/**
 * GitHub API client for fetching repository data
 */
export class GitHubClient {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Convert GitHub API error to our error type
   */
  private handleError(error: unknown): GitHubError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Check for specific error types
      if ('status' in error) {
        const status = (error as { status: number }).status;

        if (status === 404) {
          return {
            type: 'NOT_FOUND',
            message: 'Repository not found. Please check the URL and try again.',
            status: 404,
          };
        }

        if (status === 403) {
          if (message.includes('rate limit')) {
            return {
              type: 'RATE_LIMIT',
              message: 'GitHub API rate limit exceeded. Please try again later or use a Personal Access Token.',
              status: 403,
            };
          }
          return {
            type: 'PRIVATE_REPO',
            message: 'This repository is private. Please provide a Personal Access Token with repo access.',
            status: 403,
          };
        }

        if (status === 401) {
          return {
            type: 'INVALID_TOKEN',
            message: 'Invalid authentication token. Please check your Personal Access Token.',
            status: 401,
          };
        }
      }

      // Network errors
      if (message.includes('network') || message.includes('fetch')) {
        return {
          type: 'NETWORK_ERROR',
          message: 'Network error. Please check your internet connection and try again.',
        };
      }
    }

    return {
      type: 'UNKNOWN',
      message: 'An unexpected error occurred. Please try again.',
    };
  }

  /**
   * Fetch repository metadata
   */
  async fetchRepository(owner: string, repo: string): Promise<Repository> {
    const { data } = await this.octokit.repos.get({
      owner,
      repo,
    });

    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      defaultBranch: data.default_branch,
      starCount: data.stargazers_count,
      language: data.language,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      owner: data.owner.login,
      url: data.html_url,
    };
  }

  /**
   * Fetch commits for a repository (limited to MAX_COMMITS)
   */
  async fetchCommits(owner: string, repo: string): Promise<Commit[]> {
    // Fetch commits with pagination
    const { data: commitsData } = await this.octokit.repos.listCommits({
      owner,
      repo,
      per_page: MAX_COMMITS,
    });

    // Fetch detailed stats for each commit (in parallel with batching)
    const commits: Commit[] = [];
    const batchSize = 10;

    for (let i = 0; i < commitsData.length; i += batchSize) {
      const batch = commitsData.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (commit) => {
          try {
            const { data: detailedCommit } = await this.octokit.repos.getCommit({
              owner,
              repo,
              ref: commit.sha,
            });

            const author: Author = {
              name: commit.commit.author?.name || 'Unknown',
              email: commit.commit.author?.email || 'unknown@example.com',
              avatarUrl: commit.author?.avatar_url,
            };

            const stats: CommitStats = {
              additions: detailedCommit.stats?.additions || 0,
              deletions: detailedCommit.stats?.deletions || 0,
              total: detailedCommit.stats?.total || 0,
              filesChanged: detailedCommit.files?.length || 0,
            };

            const parentShas = commit.parents.map((p) => p.sha);

            return {
              sha: commit.sha,
              message: commit.commit.message,
              timestamp: commit.commit.author?.date || new Date().toISOString(),
              author,
              stats,
              parentShas,
              isMergeCommit: parentShas.length > 1,
            };
          } catch {
            // If we can't fetch detailed commit, use basic info
            const author: Author = {
              name: commit.commit.author?.name || 'Unknown',
              email: commit.commit.author?.email || 'unknown@example.com',
              avatarUrl: commit.author?.avatar_url,
            };

            return {
              sha: commit.sha,
              message: commit.commit.message,
              timestamp: commit.commit.author?.date || new Date().toISOString(),
              author,
              stats: { additions: 0, deletions: 0, total: 0, filesChanged: 0 },
              parentShas: commit.parents.map((p) => p.sha),
              isMergeCommit: commit.parents.length > 1,
            };
          }
        })
      );
      commits.push(...batchResults);
    }

    return commits;
  }

  /**
   * Group commits by contributor email
   */
  groupCommitsByContributor(commits: Commit[]): Contributor[] {
    const contributorMap = new Map<string, Commit[]>();

    // Group commits by email
    for (const commit of commits) {
      const email = commit.author.email.toLowerCase();
      if (!contributorMap.has(email)) {
        contributorMap.set(email, []);
      }
      contributorMap.get(email)!.push(commit);
    }

    // Convert to Contributor array with stats
    const contributors: Contributor[] = [];

    for (const [email, contributorCommits] of contributorMap) {
      // Sort commits by timestamp
      const sortedCommits = [...contributorCommits].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Calculate stats
      const totalAdditions = sortedCommits.reduce((sum, c) => sum + c.stats.additions, 0);
      const totalDeletions = sortedCommits.reduce((sum, c) => sum + c.stats.deletions, 0);
      const totalLines = sortedCommits.reduce((sum, c) => sum + c.stats.total, 0);

      const stats: ContributorStats = {
        totalCommits: sortedCommits.length,
        totalAdditions,
        totalDeletions,
        averageCommitSize: sortedCommits.length > 0 ? Math.round(totalLines / sortedCommits.length) : 0,
        firstCommitDate: sortedCommits[0]?.timestamp || '',
        lastCommitDate: sortedCommits[sortedCommits.length - 1]?.timestamp || '',
      };

      // Use the most recent commit's author info
      const latestCommit = sortedCommits[sortedCommits.length - 1];

      contributors.push({
        name: latestCommit?.author.name || 'Unknown',
        email,
        avatarUrl: latestCommit?.author.avatarUrl,
        commits: sortedCommits,
        stats,
      });
    }

    // Sort contributors by commit count (descending)
    return contributors.sort((a, b) => b.stats.totalCommits - a.stats.totalCommits);
  }

  /**
   * Analyze a repository - main entry point
   */
  async analyzeRepository(owner: string, repo: string): Promise<AnalysisResult> {
    try {
      // Fetch repository and commits in parallel
      const [repository, commits] = await Promise.all([
        this.fetchRepository(owner, repo),
        this.fetchCommits(owner, repo),
      ]);

      // Group commits by contributor
      const contributors = this.groupCommitsByContributor(commits);

      return {
        repository,
        commits,
        contributors,
        totalCommits: commits.length,
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

/**
 * Create a GitHub client instance
 */
export function createGitHubClient(token?: string): GitHubClient {
  return new GitHubClient(token);
}
