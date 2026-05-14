import { useMemo } from 'react';
import type { LighthouseReport } from '@/types';
import type { ComparisonResult } from '@/types/comparison';
import { calculateComparison } from '@/lib/comparison';

export function useComparison(
  previous: LighthouseReport | null,
  current: LighthouseReport | null
): ComparisonResult | null {
  return useMemo(() => {
    if (!previous || !current) return null;
    return calculateComparison(previous, current);
  }, [previous, current]);
}
