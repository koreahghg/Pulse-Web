'use client';

import { useEffect, useState } from 'react';
import { getAllHistoryEntries } from '@/lib/storage';
import type { HistoryEntry } from '@/lib/storage';
import type { LighthouseCategories } from '@/types';

const RECENT_LIMIT = 5;

export interface DashboardSummary {
  latestScores: LighthouseCategories | null;
  recentEntries: HistoryEntry[];
  totalAudits: number;
}

export function useDashboard(): DashboardSummary {
  const [summary, setSummary] = useState<DashboardSummary>({
    latestScores: null,
    recentEntries: [],
    totalAudits: 0,
  });

  useEffect(() => {
    const entries = getAllHistoryEntries();
    setSummary({
      latestScores: entries[0]?.report.categories ?? null,
      recentEntries: entries.slice(0, RECENT_LIMIT),
      totalAudits: entries.length,
    });
  }, []);

  return summary;
}
