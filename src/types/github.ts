import type { LighthouseReport } from './lighthouse';

export interface GitHubUser {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
}

export interface GitHubRepository {
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
}

export type PRState = 'open' | 'closed';

export interface GitHubPR {
  number: number;
  title: string;
  state: PRState;
  htmlUrl: string;
  headBranch: string;
  baseBranch: string;
  author: GitHubUser;
  repository: GitHubRepository;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  merged: boolean;
}

export type PRAnalysisStep =
  | 'input'
  | 'fetching-pr'
  | 'configuring'
  | 'analyzing-preview'
  | 'analyzing-baseline'
  | 'complete'
  | 'error';

export interface PRAnalysisSession {
  id: string;
  pr: GitHubPR;
  previewUrl: string;
  baselineUrl: string;
  previewReport: LighthouseReport | null;
  baselineReport: LighthouseReport | null;
  analyzedAt: string;
}
