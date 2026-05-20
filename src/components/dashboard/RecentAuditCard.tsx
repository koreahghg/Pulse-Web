'use client';

import { getScoreStyle, formatTimeAgo } from '@/lib/utils';
import type { HistoryEntry } from '@/lib/storage';

interface Props {
  entry: HistoryEntry;
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
