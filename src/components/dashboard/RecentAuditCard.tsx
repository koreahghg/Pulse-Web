'use client';

import type { HistoryEntry } from '@/lib/storage';

interface Props {
  entry: HistoryEntry;
}

function getScoreStyle(score: number): { text: string; bg: string; border: string } {
  const pct = Math.round(score * 100);
  if (pct >= 90) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  if (pct >= 50) return { text: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' };
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
}

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function RecentAuditCard({ entry }: Props) {
  const { performance: perf, accessibility, bestPractices, seo } = entry.report.categories;
  const perfPct = Math.round(perf.score * 100);
  const style = getScoreStyle(perf.score);

  return (
    <div
      data-testid="recent-audit-card"
      className={`rounded-xl border ${style.bg} ${style.border} p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-medium text-[var(--color-text-primary)]"
            title={entry.url}
          >
            {entry.url}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {formatTimeAgo(entry.savedAt)}
          </p>
        </div>
        <span
          data-testid="perf-score"
          className={`shrink-0 text-2xl font-bold tabular-nums ${style.text}`}
        >
          {perfPct}
        </span>
      </div>

      <div className="mt-3 flex gap-4 text-xs text-[var(--color-text-muted)]">
        <span>
          접근성{' '}
          <strong className="text-[var(--color-text-primary)]">
            {Math.round(accessibility.score * 100)}
          </strong>
        </span>
        <span>
          모범 사례{' '}
          <strong className="text-[var(--color-text-primary)]">
            {Math.round(bestPractices.score * 100)}
          </strong>
        </span>
        <span>
          SEO{' '}
          <strong className="text-[var(--color-text-primary)]">
            {Math.round(seo.score * 100)}
          </strong>
        </span>
      </div>
    </div>
  );
}
