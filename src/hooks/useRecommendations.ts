import { useMemo } from 'react';
import type { LighthouseReport } from '@/types';
import type { Recommendation } from '@/types/recommendation';
import { generateRecommendations } from '@/lib/recommendations';

export function useRecommendations(report: LighthouseReport | null): Recommendation[] {
  return useMemo(() => {
    if (!report) return [];
    return generateRecommendations(report);
  }, [report]);
}
