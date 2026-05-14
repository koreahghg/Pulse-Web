'use client';

import { formatDate, formatScore } from '@/lib/utils';
import type { ComparisonResult } from '@/types/comparison';
import type { WebVitalKey } from '@/types/webVitals';

const WEB_VITAL_LABELS: Record<WebVitalKey, string> = {
  lcp: 'Largest Contentful Paint',
  inp: 'Interaction to Next Paint',
  cls: 'Cumulative Layout Shift',
  fcp: 'First Contentful Paint',
  ttfb: 'Time to First Byte',
  tbt: 'Total Blocking Time',
  si: 'Speed Index',
};

const WEB_VITAL_ORDER: WebVitalKey[] = ['lcp', 'inp', 'cls', 'fcp', 'ttfb', 'tbt', 'si'];

interface DeltaBadgeProps {
  improved: boolean;
  deltaPercent: number | null;
}

function DeltaBadge({ improved, deltaPercent }: DeltaBadgeProps) {
  if (deltaPercent === null) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const abs = Math.abs(deltaPercent);
  if (abs < 0.5) {
    return (
      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
        변화 없음
      </span>
    );
  }
  const pctLabel = `${abs.toFixed(1)}%`;
  if (improved) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        ↓ {pctLabel} 개선
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
      ↑ {pctLabel} 악화
    </span>
  );
}

interface Props {
  comparison: ComparisonResult;
}

export function ComparisonTable({ comparison }: Props) {
  const { overallImproved, categoryDeltas, webVitalDeltas, baselineReport, candidateReport } =
    comparison;
  const webVitalRows = WEB_VITAL_ORDER.filter((key) => webVitalDeltas[key]);

  return (
    <section className="space-y-4">
      <div
        className={`rounded-2xl border px-5 py-4 ${
          overallImproved
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-rose-200 bg-rose-50'
        }`}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className={`text-sm font-semibold ${
                overallImproved ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {overallImproved
                ? '전반적으로 성능이 개선되었습니다'
                : '전반적으로 성능이 저하되었습니다'}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              이전 분석 기준: {formatDate(baselineReport.fetchTime)}
            </p>
          </div>
          <span
            className={`self-start rounded-lg px-3 py-1.5 text-xs font-medium sm:self-auto ${
              overallImproved
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            before / after 비교
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
          카테고리 점수 비교
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categoryDeltas.map((cat) => {
            const diffPoints = Math.round(cat.delta * 100);
            const hasChange = Math.abs(diffPoints) >= 1;
            return (
              <div
                key={cat.categoryId}
                className="rounded-xl border border-[var(--color-border)] p-4"
              >
                <p className="text-xs text-[var(--color-text-muted)]">{cat.title}</p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl font-medium text-[var(--color-text-muted)]">
                    {formatScore(cat.before)}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">→</span>
                  <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {formatScore(cat.after)}
                  </span>
                </div>
                {hasChange ? (
                  <span
                    className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      cat.improved
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {cat.improved ? `↑ +${Math.abs(diffPoints)}` : `↓ ${Math.abs(diffPoints)}`}
                  </span>
                ) : (
                  <span className="mt-1.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    변화 없음
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {webVitalRows.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
            Web Vitals 비교
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="pb-3 text-left font-medium text-[var(--color-text-muted)]">
                    지표
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-muted)]">
                    이전
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-muted)]">
                    현재
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-muted)]">
                    변화량
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {webVitalRows.map((key) => {
                  const delta = webVitalDeltas[key]!;
                  const beforeDisplay =
                    baselineReport.webVitals?.[key]?.displayValue ?? '-';
                  const afterDisplay =
                    candidateReport.webVitals?.[key]?.displayValue ?? '-';
                  return (
                    <tr key={key} className="hover:bg-gray-50/50">
                      <td className="py-3 pr-4">
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {key.toUpperCase()}
                        </span>
                        <span className="ml-2 hidden text-xs text-[var(--color-text-muted)] sm:inline">
                          {WEB_VITAL_LABELS[key]}
                        </span>
                      </td>
                      <td className="py-3 text-right text-[var(--color-text-muted)]">
                        {beforeDisplay}
                      </td>
                      <td className="py-3 text-right font-medium text-[var(--color-text-primary)]">
                        {afterDisplay}
                      </td>
                      <td className="py-3 text-right">
                        <DeltaBadge
                          improved={delta.improved}
                          deltaPercent={delta.deltaPercent}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
