'use client';

import { useMemo } from 'react';
import type { HistoryEntry } from '@/types';
import { formatDate, formatScore } from '@/lib/utils';
import { WebVitalsChart } from '@/components/charts/WebVitalsChart';
import { RecommendationPanel } from '@/components/recommendations/RecommendationPanel';
import { useRecommendations } from '@/hooks/useRecommendations';

interface HistoryDetailProps {
  entry: HistoryEntry;
  onClose: () => void;
}

export function HistoryDetail({ entry, onClose }: HistoryDetailProps) {
  const { report } = entry;
  const categories = useMemo(() => Object.values(report.categories), [report]);
  const recommendations = useRecommendations(report);

  return (
    <div className="space-y-6">
      {/* 헤더: 모바일에서 목록 복귀 버튼 포함 */}
      <div className="flex items-start gap-3">
        <button
          onClick={onClose}
          className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition hover:bg-gray-50 hover:text-[var(--color-text-primary)] lg:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="size-4"
          >
            <path
              fillRule="evenodd"
              d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
          목록
        </button>
        <div className="min-w-0 flex-1">
          <p className="break-all text-base font-semibold text-[var(--color-text-primary)]">
            {report.url}
          </p>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            분석 시각 {formatDate(entry.savedAt)}
          </p>
        </div>
      </div>

      {/* 카테고리 점수 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((cat) => (
          <article
            key={cat.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-[var(--color-text-muted)]">{cat.title}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
              {formatScore(cat.score)}
            </p>
          </article>
        ))}
      </section>

      <WebVitalsChart report={report} />

      <RecommendationPanel recommendations={recommendations} />
    </div>
  );
}
