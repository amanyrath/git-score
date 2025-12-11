import { Octokit } from '@octokit/rest';
import type { Commit, Repository, Author, FileChange, ParsedGitHubURL } from '@/types';

interface GitHubConfig {
  auth?: string;
  baseUrl?: string;
}

export class GitHubClient {
  private octokit: Octokit;

  constructor(config: GitHubConfig = {}) {
    this.octokit = new Octokit({
      auth: config.auth,
      baseUrl: config.baseUrl || 'https://api.github.com',
      userAgent: 'GitScore-Pro/1.0',
    });
  }

  // Parse GitHub URL to extract owner and repo
  static parseURL(url: string): ParsedGitHubURL | null {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,
      /^([^\/]+)\/([^\/]+)$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''),
        };
      }
    }

    return null;
  }

  // Fetch repository metadata
  async getRepository(owner: string, repo: string): Promise<Repository> {
    const { data } = await this.octokit.repos.get({ owner, repo });

    return {
      id: data.id,
      owner: data.owner.login,
      name: data.name,
      fullName: data.full_name,
      url: data.html_url,
      defaultBranch: data.default_branch,
      description: data.description || undefined,
      language: data.language || undefined,
      stars: data.stargazers_count,
      forks: data.forks_count,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // Fetch commits from repository (limited to 100 for MVP)
  async getCommits(
    owner: string,
    repo: string,
    options: {
      branch?: string;
      limit?: number;
    } = {}
  ): Promise<Commit[]> {
    const { branch, limit = 100 } = options;

    const { data: commitList } = await this.octokit.repos.listCommits({
      owner,
      repo,
      sha: branch,
      per_page: Math.min(limit, 100),
    });

    // Fetch detailed commit info for each commit
    const commits: Commit[] = await Promise.all(
      commitList.map(async (commit) => {
        const { data: details } = await this.octokit.repos.getCommit({
          owner,
          repo,
          ref: commit.sha,
        });

        const author: Author = {
          name: commit.commit.author?.name || 'Unknown',
          email: commit.commit.author?.email || 'unknown@unknown.com',
          username: commit.author?.login,
          avatarUrl: commit.author?.avatar_url,
        };

        const committer: Author = {
          name: commit.commit.committer?.name || 'Unknown',
          email: commit.commit.committer?.email || 'unknown@unknown.com',
          username: commit.committer?.login,
          avatarUrl: commit.committer?.avatar_url,
        };

        const files: FileChange[] = (details.files || []).map((file) => ({
          filename: file.filename,
          status: file.status as FileChange['status'],
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
        }));

        return {
          sha: commit.sha,
          message: commit.commit.message.split('\n')[0], // First line only
          body: commit.commit.message.split('\n').slice(1).join('\n').trim() || undefined,
          author,
          committer,
          timestamp: new Date(commit.commit.author?.date || Date.now()),
          branch: branch || 'main',
          parents: commit.parents.map((p) => p.sha),
          stats: {
            additions: details.stats?.additions || 0,
            deletions: details.stats?.deletions || 0,
            total: details.stats?.total || 0,
            filesChanged: details.files?.length || 0,
          },
          files,
        };
      })
    );

    return commits;
  }

  // Check rate limit status
  async getRateLimit() {
    const { data } = await this.octokit.rateLimit.get();
    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: new Date(data.rate.reset * 1000),
    };
  }

  // Validate repository accessibility
  async validateRepository(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.repos.get({ owner, repo });
      return true;
    } catch {
      return false;
    }
  }
}
