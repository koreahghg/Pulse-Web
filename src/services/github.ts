import type { GitHubPR } from '@/types/github';

interface GitHubPRApiResponse {
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  head: { ref: string };
  base: { ref: string };
  user: { login: string; avatar_url: string; html_url: string };
  body: string | null;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
}

export function parsePRUrl(
  prUrl: string
): { owner: string; repo: string; number: number } | null {
  const match = prUrl.trim().match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2], number: parseInt(match[3], 10) };
}

export async function fetchGitHubPR(prUrl: string): Promise<GitHubPR> {
  const parsed = parsePRUrl(prUrl);
  if (!parsed) throw new Error('유효하지 않은 GitHub PR URL입니다.');

  const { owner, repo, number } = parsed;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;

  const response = await fetch(apiUrl, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });

  if (response.status === 404) {
    throw new Error('PR을 찾을 수 없습니다. URL을 확인해주세요.');
  }
  if (response.status === 403) {
    throw new Error('GitHub API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
  }
  if (!response.ok) {
    throw new Error(`GitHub API 오류 (${response.status})`);
  }

  const data: GitHubPRApiResponse = await response.json();

  return {
    number: data.number,
    title: data.title,
    state: data.state,
    htmlUrl: data.html_url,
    headBranch: data.head.ref,
    baseBranch: data.base.ref,
    author: {
      login: data.user.login,
      avatarUrl: data.user.avatar_url,
      htmlUrl: data.user.html_url,
    },
    repository: {
      owner,
      name: repo,
      fullName: `${owner}/${repo}`,
      htmlUrl: `https://github.com/${owner}/${repo}`,
    },
    body: data.body,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    merged: data.merged_at !== null,
  };
}
