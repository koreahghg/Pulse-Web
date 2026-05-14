export type { MetricScore, AuditStrategy } from './common';

export type { AnalysisStatus, AnalysisRequest, AnalysisError, AuditTarget } from './analysis';

export type {
  WebVitalMetric,
  WebVitals,
  WebVitalKey,
  WebVitalThresholds,
} from './webVitals';
export { WEB_VITAL_THRESHOLDS } from './webVitals';

export type {
  CategoryScore,
  LighthouseCategories,
  PerformanceMetric,
  KeyMetrics,
  LighthouseReport,
} from './lighthouse';

export type { AnalysisRecord, AnalysisHistory, StoredHistory } from './history';

export type { MetricDelta, CategoryDelta, WebVitalDeltaMap, ComparisonResult } from './comparison';

export type {
  RecommendationPriority,
  RecommendationImpact,
  RecommendationCategory,
  RecommendationAction,
  Recommendation,
} from './recommendation';
