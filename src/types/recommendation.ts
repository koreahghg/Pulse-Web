export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationImpact = 'high' | 'medium' | 'low';
export type RecommendationCategory = 'performance' | 'accessibility' | 'best-practices' | 'seo';

export interface RecommendationAction {
  label: string;
  detail: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  impact: RecommendationImpact;
  metric?: string;
  currentValue?: string;
  actions: RecommendationAction[];
}
