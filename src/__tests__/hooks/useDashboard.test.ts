import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboard } from '@/hooks/useDashboard';
import * as storage from '@/lib/storage';
import type { HistoryEntry } from '@/types';

vi.mock('@/lib/storage', () => ({
  getAllHistoryEntries: vi.fn(),
}));

const mockGetAll = vi.mocked(storage.getAllHistoryEntries);

function makeEntry(id: string, url: string, perfScore = 0.9): HistoryEntry {
  return {
    id,
    url,
    savedAt: new Date().toISOString(),
    report: {
      id,
      url,
      fetchTime: new Date().toISOString(),
      strategy: 'mobile',
      categories: {
        performance: { id: 'performance', title: '성능', score: perfScore },
        accessibility: { id: 'accessibility', title: '접근성', score: 0.95 },
        bestPractices: { id: 'best-practices', title: '모범 사례', score: 0.92 },
        seo: { id: 'seo', title: 'SEO', score: 1.0 },
      },
      metrics: [],
      keyMetrics: { fcp: null, lcp: null, cls: null, tti: null, tbt: null, speedIndex: null },
    },
  };
}

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('이력이 없으면 초기 상태(latestScores=null, 빈 배열, 0건)를 반환한다', () => {
    mockGetAll.mockReturnValue([]);
    const { result } = renderHook(() => useDashboard());
    expect(result.current.latestScores).toBeNull();
    expect(result.current.recentEntries).toHaveLength(0);
    expect(result.current.totalAudits).toBe(0);
  });

  it('가장 최근 이력의 카테고리 점수를 latestScores로 반환한다', () => {
    mockGetAll.mockReturnValue([makeEntry('r1', 'https://a.com', 0.85)]);
    const { result } = renderHook(() => useDashboard());
    expect(result.current.latestScores?.performance.score).toBe(0.85);
  });

  it('최대 5개의 최근 이력만 recentEntries로 반환한다', () => {
    const entries = Array.from({ length: 8 }, (_, i) =>
      makeEntry(`r${i}`, `https://site${i}.com`),
    );
    mockGetAll.mockReturnValue(entries);
    const { result } = renderHook(() => useDashboard());
    expect(result.current.recentEntries).toHaveLength(5);
  });

  it('전체 감사 수를 totalAudits로 반환한다', () => {
    const entries = Array.from({ length: 3 }, (_, i) =>
      makeEntry(`r${i}`, `https://site${i}.com`),
    );
    mockGetAll.mockReturnValue(entries);
    const { result } = renderHook(() => useDashboard());
    expect(result.current.totalAudits).toBe(3);
  });

  it('이력이 정확히 5개이면 5개 모두 반환한다', () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry(`r${i}`, `https://site${i}.com`),
    );
    mockGetAll.mockReturnValue(entries);
    const { result } = renderHook(() => useDashboard());
    expect(result.current.recentEntries).toHaveLength(5);
    expect(result.current.totalAudits).toBe(5);
  });

  it('recentEntries의 첫 번째 항목이 getAllHistoryEntries 반환값의 첫 번째와 동일하다', () => {
    const entries = [
      makeEntry('latest', 'https://latest.com'),
      makeEntry('older', 'https://older.com'),
    ];
    mockGetAll.mockReturnValue(entries);
    const { result } = renderHook(() => useDashboard());
    expect(result.current.recentEntries[0].id).toBe('latest');
  });
});
