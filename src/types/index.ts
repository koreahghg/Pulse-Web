export type MetricScore = 'good' | 'needs-improvement' | 'poor';

export type AuditStrategy = 'mobile' | 'desktop';

export interface CategoryScore {
  id: string;
  title: string;
  score: number; // 0~1 범위
}

export interface PerformanceMetric {
  id: string;
  title: string;
  value: number;
  score: number; // 0~1 범위
  displayValue: string;
}

export interface LighthouseReport {
  id: string;
  url: string;
  fetchTime: string;
  strategy: AuditStrategy;
  categories: {
    performance: CategoryScore;
    accessibility: CategoryScore;
    bestPractices: CategoryScore;
    seo: CategoryScore;
  };
  metrics: PerformanceMetric[];
}

export interface AuditTarget {
  id: string;
  url: string;
  label: string;
  createdAt: string;
}
