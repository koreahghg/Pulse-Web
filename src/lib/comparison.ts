import type { LighthouseReport, PerformanceMetric } from '@/types';
import type { ComparisonResult, MetricDelta, CategoryDelta, WebVitalDeltaMap } from '@/types/comparison';
import type { WebVitalKey } from '@/types/webVitals';

const WEB_VITAL_ORDER: WebVitalKey[] = ['lcp', 'inp', 'cls', 'fcp', 'ttfb', 'tbt', 'si'];

function buildCategoryDelta(
  id: string,
  title: string,
  before: number,
  after: number
): CategoryDelta {
  return { categoryId: id, title, before, after, delta: after - before, improved: after > before };
}

function buildMetricDelta(
  metricId: string,
  title: string,
  before: number,
  after: number
): MetricDelta {
  const delta = after - before;
  const deltaPercent = before !== 0 ? (delta / before) * 100 : null;
  return { metricId, title, before, after, delta, deltaPercent, improved: after < before };
}

function fromKeyMetrics(
  baseline: PerformanceMetric | null,
  candidate: PerformanceMetric | null
): MetricDelta | null {
  if (!baseline || !candidate) return null;
  return buildMetricDelta(baseline.id, baseline.title, baseline.value, candidate.value);
}

export function calculateComparison(
  baseline: LighthouseReport,
  candidate: LighthouseReport
): ComparisonResult {
  const bc = baseline.categories;
  const cc = candidate.categories;

  const categoryDeltas: CategoryDelta[] = [
    buildCategoryDelta('performance', bc.performance.title, bc.performance.score, cc.performance.score),
    buildCategoryDelta('accessibility', bc.accessibility.title, bc.accessibility.score, cc.accessibility.score),
    buildCategoryDelta('bestPractices', bc.bestPractices.title, bc.bestPractices.score, cc.bestPractices.score),
    buildCategoryDelta('seo', bc.seo.title, bc.seo.score, cc.seo.score),
  ];

  const metricDeltas: MetricDelta[] = [
    fromKeyMetrics(baseline.keyMetrics.fcp, candidate.keyMetrics.fcp),
    fromKeyMetrics(baseline.keyMetrics.lcp, candidate.keyMetrics.lcp),
    fromKeyMetrics(baseline.keyMetrics.cls, candidate.keyMetrics.cls),
    fromKeyMetrics(baseline.keyMetrics.tti, candidate.keyMetrics.tti),
    fromKeyMetrics(baseline.keyMetrics.tbt, candidate.keyMetrics.tbt),
    fromKeyMetrics(baseline.keyMetrics.speedIndex, candidate.keyMetrics.speedIndex),
  ].filter((d): d is MetricDelta => d !== null);

  const webVitalDeltas: WebVitalDeltaMap = {};
  for (const key of WEB_VITAL_ORDER) {
    const bv = baseline.webVitals?.[key];
    const cv = candidate.webVitals?.[key];
    if (bv && cv) {
      webVitalDeltas[key] = buildMetricDelta(key, key.toUpperCase(), bv.value, cv.value);
    }
  }

  const beforeTotal = categoryDeltas.reduce((s, c) => s + c.before, 0);
  const afterTotal = categoryDeltas.reduce((s, c) => s + c.after, 0);

  return {
    id: crypto.randomUUID(),
    url: candidate.url,
    strategy: candidate.strategy,
    baselineReport: baseline,
    candidateReport: candidate,
    categoryDeltas,
    metricDeltas,
    webVitalDeltas,
    overallImproved: afterTotal > beforeTotal,
    comparedAt: new Date().toISOString(),
  };
}
