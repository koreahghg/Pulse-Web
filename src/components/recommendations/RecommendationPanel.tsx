'use client';

import { useState } from 'react';
import type { Recommendation, RecommendationPriority, RecommendationCategory } from '@/types/recommendation';

interface Props {
  recommendations: Recommendation[];
}

const PRIORITY_CONFIG: Record<
  RecommendationPriority,
  { label: string; badgeClass: string; borderClass: string; dotClass: string }
> = {
  critical: {
    label: '긴급',
    badgeClass: 'bg-red-100 text-red-700',
    borderClass: 'border-red-200',
    dotClass: 'bg-red-500',
  },
  high: {
    label: '높음',
    badgeClass: 'bg-orange-100 text-orange-700',
    borderClass: 'border-orange-200',
    dotClass: 'bg-orange-500',
  },
  medium: {
    label: '중간',
    badgeClass: 'bg-yellow-100 text-yellow-700',
    borderClass: 'border-yellow-200',
    dotClass: 'bg-yellow-500',
  },
  low: {
    label: '낮음',
    badgeClass: 'bg-green-100 text-green-700',
    borderClass: 'border-green-200',
    dotClass: 'bg-green-500',
  },
};

const CATEGORY_LABEL: Record<RecommendationCategory, string> = {
  performance: '성능',
  accessibility: '접근성',
  'best-practices': '모범 사례',
  seo: 'SEO',
};

const PRIORITY_FILTERS: { key: RecommendationPriority | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'critical', label: '긴급' },
  { key: 'high', label: '높음' },
  { key: 'medium', label: '중간' },
  { key: 'low', label: '낮음' },
];

export function RecommendationPanel({ recommendations }: Props) {
  const [activeFilter, setActiveFilter] = useState<RecommendationPriority | 'all'>('all');

  if (recommendations.length === 0) {
    return (
      <section className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
        <p className="text-sm font-semibold text-green-700">모든 지표가 양호합니다</p>
        <p className="mt-1 text-sm text-green-600">현재 개선이 필요한 항목이 없습니다.</p>
      </section>
    );
  }

  const criticalCount = recommendations.filter((r) => r.priority === 'critical').length;
  const highCount = recommendations.filter((r) => r.priority === 'high').length;

  const filtered =
    activeFilter === 'all'
      ? recommendations
      : recommendations.filter((r) => r.priority === activeFilter);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">개선 추천</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            총 {recommendations.length}개 항목
            {criticalCount > 0 && (
              <span className="ml-2 font-medium text-red-600">· 긴급 {criticalCount}개</span>
            )}
            {highCount > 0 && (
              <span className="ml-1 font-medium text-orange-600">· 높음 {highCount}개</span>
            )}
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-wrap gap-1.5">
          {PRIORITY_FILTERS.map(({ key, label }) => {
            const count =
              key === 'all'
                ? recommendations.length
                : recommendations.filter((r) => r.priority === key).length;
            if (key !== 'all' && count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeFilter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-[var(--color-border,#e5e7eb)] text-[var(--color-text-muted)] hover:bg-blue-100 hover:text-blue-700'
                }`}
              >
                {key !== 'all' && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${PRIORITY_CONFIG[key as RecommendationPriority].dotClass}`}
                  />
                )}
                {label}
                <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((rec, index) => {
          const config = PRIORITY_CONFIG[rec.priority];
          return (
            <RecommendationCard key={rec.id} rec={rec} config={config} index={index} />
          );
        })}
      </div>
    </section>
  );
}

interface CardProps {
  rec: Recommendation;
  config: (typeof PRIORITY_CONFIG)[RecommendationPriority];
  index: number;
}

function RecommendationCard({ rec, config }: CardProps) {
  const [expanded, setExpanded] = useState(
    rec.priority === 'critical' || rec.priority === 'high',
  );

  return (
    <article
      className={`rounded-2xl border bg-[var(--color-bg-surface)] shadow-sm ${config.borderClass}`}
    >
      {/* Card Header — 클릭으로 액션 펼치기/접기 */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-5 text-left"
      >
        <span
          className={`mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${config.badgeClass}`}
        >
          {PRIORITY_CONFIG[rec.priority].label}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {rec.title}
            </span>
            <span className="rounded bg-[var(--color-border,#e5e7eb)] px-1.5 py-0.5 text-xs text-[var(--color-text-muted)]">
              {CATEGORY_LABEL[rec.category]}
            </span>
            {rec.currentValue && (
              <span className="text-xs text-[var(--color-text-muted)]">
                현재:{' '}
                <strong className="text-[var(--color-text-primary)]">{rec.currentValue}</strong>
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{rec.description}</p>
        </div>

        {/* Chevron */}
        <svg
          className={`mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Action List */}
      {expanded && (
        <ul className="border-t border-[var(--color-border)] px-5 pb-5 pt-4 space-y-3">
          {rec.actions.map((action, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-border,#e5e7eb)] text-xs font-bold text-[var(--color-text-muted)]">
                {idx + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {action.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                  {action.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
