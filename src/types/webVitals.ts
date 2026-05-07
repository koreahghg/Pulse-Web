import type { MetricScore } from './common';

export interface WebVitalMetric {
  value: number;
  score: MetricScore;
  displayValue: string;
  /** 필드 데이터 기반 백분위 (0~100) */
  percentile?: number;
}

export interface WebVitals {
  /** Largest Contentful Paint — 로딩 성능 */
  lcp: WebVitalMetric | null;
  /** Interaction to Next Paint — 상호작용 응답성 */
  inp: WebVitalMetric | null;
  /** Cumulative Layout Shift — 시각적 안정성 */
  cls: WebVitalMetric | null;
  /** First Contentful Paint */
  fcp: WebVitalMetric | null;
  /** Time to First Byte */
  ttfb: WebVitalMetric | null;
  /** Total Blocking Time — INP 대리 지표 (lab 환경) */
  tbt: WebVitalMetric | null;
  /** Speed Index */
  si: WebVitalMetric | null;
}

export type WebVitalKey = keyof WebVitals;

/** Google 권고 기준값 (단위: ms, CLS는 unitless) */
export const WEB_VITAL_THRESHOLDS = {
  lcp:  { good: 2500, poor: 4000 },
  inp:  { good: 200,  poor: 500  },
  cls:  { good: 0.1,  poor: 0.25 },
  fcp:  { good: 1800, poor: 3000 },
  ttfb: { good: 800,  poor: 1800 },
  tbt:  { good: 200,  poor: 600  },
  si:   { good: 3400, poor: 5800 },
} as const;

export type WebVitalThresholds = typeof WEB_VITAL_THRESHOLDS;
