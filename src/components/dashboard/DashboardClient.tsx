'use client';

import Link from 'next/link';
import { useDashboard } from '@/hooks/useDashboard';
import { RecentAuditCard } from './RecentAuditCard';
import type { LighthouseCategories } from '@/types';

type CategoryKey = keyof LighthouseCategories;

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'performance', label: '성능' },
  { key: 'accessibility', label: '접근성' },
  { key: 'bestPractices', label: '모범 사례' },
  { key: 'seo', label: 'SEO' },
];

function scoreColor(score: number | null): string {
  if (score === null) return 'text-[var(--color-text-muted)]';
  const pct = Math.round(score * 100);
  if (pct >= 90) return 'text-green-600';
  if (pct >= 50) return 'text-orange-500';
  return 'text-red-600';
}

export function DashboardClient() {
  const { latestScores, recentEntries, totalAudits } = useDashboard();

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map(({ key, label }) => {
          const score = latestScores?.[key].score ?? null;
          return (
            <div
              key={key}
              data-testid="score-card"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
              <p
                data-testid="score-value"
                className={`mt-2 text-3xl font-bold tabular-nums ${scoreColor(score)}`}
              >
                {score !== null ? Math.round(score * 100) : '--'}
              </p>
            </div>
          );
        })}
      </div>

      {recentEntries.length === 0 ? (
        <div
          data-testid="empty-state"
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)] py-20"
        >
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            분석 결과가 없습니다
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            성능 감사 메뉴에서 URL을 입력해 시작하세요.
          </p>
          <Link
            href="/audit"
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            첫 번째 감사 시작하기
          </Link>
        </div>
      ) : (
        <section data-testid="recent-audit-list" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              최근 감사 내역
              <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
                총 {totalAudits}건
              </span>
            </h3>
            <Link
              href="/history"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <RecentAuditCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
