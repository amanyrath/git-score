import { ParsedRepoUrl } from '@/types';

/**
 * Parse a GitHub repository URL and extract owner and repo name
 * Supports formats:
 * - https://github.com/owner/repo
 * - http://github.com/owner/repo
 * - github.com/owner/repo
 * - owner/repo
 * Handles edge cases:
 * - .git suffix
 * - Trailing slashes
 * - Extra path segments
 */
export function parseGitHubUrl(input: string): ParsedRepoUrl | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Trim whitespace
  let url = input.trim();

  if (url.length === 0) {
    return null;
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  // Remove .git suffix
  url = url.replace(/\.git$/, '');

  // Try to extract owner/repo from different formats
  let owner: string | undefined;
  let repo: string | undefined;

  // Pattern 1: Full URL (https://github.com/owner/repo or http://github.com/owner/repo)
  const fullUrlMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)/i);
  if (fullUrlMatch) {
    owner = fullUrlMatch[1];
    repo = fullUrlMatch[2];
  }

  // Pattern 2: URL without protocol (github.com/owner/repo)
  if (!owner || !repo) {
    const noProtocolMatch = url.match(/^github\.com\/([^/]+)\/([^/]+)/i);
    if (noProtocolMatch) {
      owner = noProtocolMatch[1];
      repo = noProtocolMatch[2];
    }
  }

  // Pattern 3: Simple owner/repo format
  if (!owner || !repo) {
    const simpleMatch = url.match(/^([^/]+)\/([^/]+)$/);
    if (simpleMatch) {
      owner = simpleMatch[1];
      repo = simpleMatch[2];
    }
  }

  // Validate owner and repo
  if (!owner || !repo) {
    return null;
  }

  // GitHub username validation (alphanumeric and hyphens, no consecutive hyphens)
  const validUsernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$|^[a-zA-Z0-9]$/;

  // GitHub repo name validation (alphanumeric, hyphens, underscores, and periods)
  // More permissive as repo names can contain ., _, and -
  const validRepoRegex = /^[a-zA-Z0-9._-]+$/;

  if (!validUsernameRegex.test(owner) || !validRepoRegex.test(repo)) {
    return null;
  }

  return { owner, repo };
}

/**
 * Validate a parsed repository URL
 * Returns an error message if invalid, null if valid
 */
export function validateRepoInput(input: string): string | null {
  if (!input || input.trim().length === 0) {
    return 'Please enter a GitHub repository URL';
  }

  const parsed = parseGitHubUrl(input);

  if (!parsed) {
    return 'Invalid GitHub repository URL. Use format: owner/repo or https://github.com/owner/repo';
  }

  return null;
}

/**
 * Format a parsed URL back to a standard GitHub URL
 */
export function formatGitHubUrl(parsed: ParsedRepoUrl): string {
  return `https://github.com/${parsed.owner}/${parsed.repo}`;
}
