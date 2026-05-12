'use client';

import { PerformanceScoreGauge } from './PerformanceScoreGauge';
import { WebVitalsBarChart } from './WebVitalsBarChart';
import type { LighthouseReport, MetricScore } from '@/types';
import type { WebVitalKey } from '@/types/webVitals';
import { WEB_VITAL_THRESHOLDS } from '@/types/webVitals';

interface Props {
  report: LighthouseReport;
}

const THRESHOLD_LABEL_STYLES = { good: 'text-emerald-600', poor: 'text-rose-500' } as const;

const SCORE_BADGE: Record<MetricScore, string> = {
  good: 'bg-emerald-50 text-emerald-700',
  'needs-improvement': 'bg-amber-50 text-amber-700',
  poor: 'bg-rose-50 text-rose-700',
};

const SCORE_LABELS: Record<MetricScore, string> = {
  good: '좋음',
  'needs-improvement': '개선 필요',
  poor: '나쁨',
};

const METRIC_DESCRIPTIONS: Partial<Record<WebVitalKey, { full: string; desc: string }>> = {
  lcp:  { full: 'Largest Contentful Paint',    desc: '페이지 내 가장 큰 콘텐츠가 렌더링되는 시간. 로딩 성능을 측정합니다.' },
  cls:  { full: 'Cumulative Layout Shift',      desc: '예상치 못한 레이아웃 이동 정도. 시각적 안정성을 측정합니다.' },
  fcp:  { full: 'First Contentful Paint',       desc: '첫 번째 콘텐츠가 화면에 표시되는 시간입니다.' },
  tbt:  { full: 'Total Blocking Time',          desc: '메인 스레드가 사용자 입력을 차단한 총 시간입니다.' },
  si:   { full: 'Speed Index',                  desc: '페이지 콘텐츠가 시각적으로 채워지는 속도입니다.' },
  inp:  { full: 'Interaction to Next Paint',    desc: '사용자 상호작용 후 다음 화면이 그려지는 응답 시간입니다.' },
  ttfb: { full: 'Time to First Byte',           desc: '브라우저가 서버로부터 첫 번째 바이트를 받는 시간입니다.' },
};

function formatThreshold(key: WebVitalKey, value: number): string {
  if (key === 'cls') return String(value);
  return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${value} ms`;
}

export function WebVitalsChart({ report }: Props) {
  const performanceScore = Math.round((report.categories.performance.score ?? 0) * 100);
  const webVitals = report.webVitals;

  const metricEntries = webVitals
    ? (Object.keys(WEB_VITAL_THRESHOLDS) as WebVitalKey[])
        .map((key) => ({
          key,
          metric: webVitals[key],
          info: METRIC_DESCRIPTIONS[key],
        }))
        .filter(
          (entry): entry is typeof entry & { metric: NonNullable<typeof entry.metric> } =>
            entry.metric !== null
        )
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Web Vitals 시각화
          </h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            나쁨 기준 대비 각 지표의 상대적 위치를 보여줍니다. 막대가 짧을수록 우수합니다.
          </p>
        </div>

        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <div className="flex shrink-0 justify-center md:justify-start">
            <PerformanceScoreGauge score={performanceScore} />
          </div>

          <div className="min-w-0 flex-1">
            {webVitals ? (
              <WebVitalsBarChart webVitals={webVitals} />
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Web Vitals 데이터 없음</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-4 border-t border-[var(--color-border)] pt-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-[var(--color-text-muted)]">좋음</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="text-xs text-[var(--color-text-muted)]">개선 필요</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-xs text-[var(--color-text-muted)]">나쁨</span>
          </div>
        </div>
      </section>

      {metricEntries.length > 0 && (
        <section>
          <h3 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">
            지표 상세
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metricEntries.map(({ key, metric, info }) => (
                <article
                  key={key}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                        {key.toUpperCase()}
                      </p>
                      {info && (
                        <p className="mt-0.5 truncate text-sm font-semibold text-[var(--color-text-primary)]">
                          {info.full}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${SCORE_BADGE[metric.score]}`}>
                      {SCORE_LABELS[metric.score]}
                    </span>
                  </div>

                  {info && (
                    <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
                      {info.desc}
                    </p>
                  )}

                  <div className="mt-4 flex items-end justify-between">
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                      {metric.displayValue}
                    </p>
                    {WEB_VITAL_THRESHOLDS[key] && (
                      <div className="text-right">
                        <p className={`text-xs font-medium ${THRESHOLD_LABEL_STYLES.good}`}>
                          좋음 {'< ' + formatThreshold(key, WEB_VITAL_THRESHOLDS[key].good)}
                        </p>
                        <p className={`text-xs font-medium ${THRESHOLD_LABEL_STYLES.poor}`}>
                          나쁨 {'> ' + formatThreshold(key, WEB_VITAL_THRESHOLDS[key].poor)}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
