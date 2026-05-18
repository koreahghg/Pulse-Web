import Image from 'next/image';
import type { GitHubPR } from '@/types/github';

interface PRInfoCardProps {
  pr: GitHubPR;
}

function PRStateBadge({ state, merged }: { state: GitHubPR['state']; merged: boolean }) {
  if (merged) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
        병합됨
      </span>
    );
  }
  if (state === 'open') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        열림
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      닫힘
    </span>
  );
}

export function PRInfoCard({ pr }: PRInfoCardProps) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <PRStateBadge state={pr.state} merged={pr.merged} />
            <span className="text-xs text-[var(--color-text-muted)]">
              {pr.repository.fullName} #{pr.number}
            </span>
          </div>
          <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {pr.title}
          </h3>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            <span className="rounded bg-gray-100 px-1 font-mono">{pr.headBranch}</span>
            {' → '}
            <span className="rounded bg-gray-100 px-1 font-mono">{pr.baseBranch}</span>
          </p>
        </div>
        <a
          href={pr.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-blue-600 hover:underline"
        >
          GitHub에서 보기 ↗
        </a>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <Image
          src={pr.author.avatarUrl}
          alt={pr.author.login}
          width={16}
          height={16}
          className="rounded-full"
        />
        <span className="text-xs text-[var(--color-text-muted)]">{pr.author.login}</span>
      </div>
    </div>
  );
}
