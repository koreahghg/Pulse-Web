import type { AuditStrategy } from './common';
import type { LighthouseReport } from './lighthouse';
import type { WebVitalKey } from './webVitals';

export interface MetricDelta {
  metricId: string;
  title: string;
  before: number;
  after: number;
  /** after - before (음수 = 대부분 지표에서 개선) */
  delta: number;
  /** before가 0이면 계산 불가 → null */
  deltaPercent: number | null;
  improved: boolean;
}

export interface CategoryDelta {
  categoryId: string;
  title: string;
  /** 0~1 범위 */
  before: number;
  /** 0~1 범위 */
  after: number;
  delta: number;
  improved: boolean;
}

export type WebVitalDeltaMap = Partial<Record<WebVitalKey, MetricDelta>>;

export interface ComparisonResult {
  id: string;
  url: string;
  strategy: AuditStrategy;
  /** 기준 스냅샷 ("before") */
  baselineReport: LighthouseReport;
  /** 비교 대상 스냅샷 ("after") */
  candidateReport: LighthouseReport;
  categoryDeltas: CategoryDelta[];
  metricDeltas: MetricDelta[];
  webVitalDeltas: WebVitalDeltaMap;
  /** 카테고리 점수 합산 기준 전반적 개선 여부 */
  overallImproved: boolean;
  comparedAt: string;
}
