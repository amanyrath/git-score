import { Octokit } from '@octokit/rest';
import type { Commit, Repository, Author, FileChange, ParsedGitHubURL } from '@/types';

interface GitHubConfig {
  auth?: string;
  baseUrl?: string;
}

// GraphQL response types
interface GraphQLCommitNode {
  oid: string;
  message: string;
  committedDate: string;
  additions: number;
  deletions: number;
  changedFilesIfAvailable: number | null;
  parents: {
    nodes: Array<{ oid: string }>;
  };
  author: {
    name: string | null;
    email: string | null;
    user: {
      login: string;
      avatarUrl: string;
    } | null;
  };
  committer: {
    name: string | null;
    email: string | null;
    user: {
      login: string;
      avatarUrl: string;
    } | null;
  };
}

interface GraphQLResponse {
  repository: {
    databaseId: number;
    name: string;
    nameWithOwner: string;
    url: string;
    description: string | null;
    primaryLanguage: { name: string } | null;
    stargazerCount: number;
    forkCount: number;
    createdAt: string;
    updatedAt: string;
    defaultBranchRef: {
      name: string;
      target: {
        history: {
          nodes: GraphQLCommitNode[];
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        };
      };
    } | null;
  };
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
          repo: match[2].replace(/\.git$/, '').replace(/\/$/, ''),
        };
      }
    }

    return null;
  }

  // Fetch repository and commits in a single GraphQL query
  async getRepositoryWithCommits(
    owner: string,
    repo: string,
    options: { limit?: number } = {}
  ): Promise<{ repository: Repository; commits: Commit[] }> {
    const { limit = 100 } = options;

    const query = `
      query($owner: String!, $repo: String!, $limit: Int!) {
        repository(owner: $owner, name: $repo) {
          databaseId
          name
          nameWithOwner
          url
          description
          primaryLanguage { name }
          stargazerCount
          forkCount
          createdAt
          updatedAt
          defaultBranchRef {
            name
            target {
              ... on Commit {
                history(first: $limit) {
                  nodes {
                    oid
                    message
                    committedDate
                    additions
                    deletions
                    changedFilesIfAvailable
                    parents(first: 5) {
                      nodes { oid }
                    }
                    author {
                      name
                      email
                      user { login avatarUrl }
                    }
                    committer {
                      name
                      email
                      user { login avatarUrl }
                    }
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.octokit.graphql<GraphQLResponse>(query, {
      owner,
      repo,
      limit: Math.min(limit, 100),
    });

    if (!response.repository) {
      throw new Error('Repository not found');
    }

    const repoData = response.repository;
    const defaultBranch = repoData.defaultBranchRef?.name || 'main';
    const commitNodes = repoData.defaultBranchRef?.target?.history?.nodes || [];

    // Map repository data
    const repository: Repository = {
      id: repoData.databaseId,
      owner,
      name: repoData.name,
      fullName: repoData.nameWithOwner,
      url: repoData.url,
      defaultBranch,
      description: repoData.description || undefined,
      language: repoData.primaryLanguage?.name || undefined,
      stars: repoData.stargazerCount,
      forks: repoData.forkCount,
      createdAt: new Date(repoData.createdAt),
      updatedAt: new Date(repoData.updatedAt),
    };

    // Map commits data
    const commits: Commit[] = commitNodes.map((node) => {
      const messageParts = node.message.split('\n');
      const firstLine = messageParts[0];
      const body = messageParts.slice(1).join('\n').trim() || undefined;

      const author: Author = {
        name: node.author.name || 'Unknown',
        email: node.author.email || 'unknown@unknown.com',
        username: node.author.user?.login,
        avatarUrl: node.author.user?.avatarUrl,
      };

      const committer: Author = {
        name: node.committer.name || 'Unknown',
        email: node.committer.email || 'unknown@unknown.com',
        username: node.committer.user?.login,
        avatarUrl: node.committer.user?.avatarUrl,
      };

      const additions = node.additions || 0;
      const deletions = node.deletions || 0;

      return {
        sha: node.oid,
        message: firstLine,
        body,
        author,
        committer,
        timestamp: new Date(node.committedDate),
        branch: defaultBranch,
        parents: node.parents.nodes.map((p) => p.oid),
        stats: {
          additions,
          deletions,
          total: additions + deletions,
          filesChanged: node.changedFilesIfAvailable || 0,
        },
        files: [] as FileChange[], // GraphQL doesn't include file details in history query
      };
    });

    return { repository, commits };
  }

  // Legacy method for backwards compatibility - now uses GraphQL internally
  async getRepository(owner: string, repo: string): Promise<Repository> {
    const { repository } = await this.getRepositoryWithCommits(owner, repo, { limit: 1 });
    return repository;
  }

  // Legacy method for backwards compatibility - now uses GraphQL internally
  async getCommits(
    owner: string,
    repo: string,
    options: { branch?: string; limit?: number } = {}
  ): Promise<Commit[]> {
    const { commits } = await this.getRepositoryWithCommits(owner, repo, options);
    return commits;
  }

  // Check rate limit status
  async getRateLimit() {
    const { data } = await this.octokit.rateLimit.get();
    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: new Date(data.rate.reset * 1000),
      graphql: {
        limit: data.resources.graphql?.limit || 0,
        remaining: data.resources.graphql?.remaining || 0,
        reset: new Date((data.resources.graphql?.reset || 0) * 1000),
      },
    };
  }

  // Validate repository accessibility
  async validateRepository(owner: string, repo: string): Promise<boolean> {
    try {
      const query = `
        query($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            id
          }
        }
      `;
      await this.octokit.graphql(query, { owner, repo });
      return true;
    } catch {
      return false;
    }
  }
}
