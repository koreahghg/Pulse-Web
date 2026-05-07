import type { AuditStrategy, MetricScore } from './common';
import type { WebVitals } from './webVitals';

export interface CategoryScore {
  id: string;
  title: string;
  /** PSI 0~1 범위 점수 */
  score: number;
  /** 전체 성능 점수 산출 시 가중치 */
  weight?: number;
}

export interface LighthouseCategories {
  performance: CategoryScore;
  accessibility: CategoryScore;
  bestPractices: CategoryScore;
  seo: CategoryScore;
}

export interface PerformanceMetric {
  id: string;
  title: string;
  /** 원시 수치 (ms, 또는 CLS의 경우 unitless) */
  value: number;
  /** PSI 0~1 범위 점수 */
  score: number;
  displayValue: string;
  scoreLabel?: MetricScore;
  description?: string;
}

export interface LighthouseReport {
  id: string;
  url: string;
  fetchTime: string;
  strategy: AuditStrategy;
  categories: LighthouseCategories;
  metrics: PerformanceMetric[];
  /** Web Vitals 파생 데이터 — 서비스 변환 시 선택적으로 채움 */
  webVitals?: WebVitals;
}
