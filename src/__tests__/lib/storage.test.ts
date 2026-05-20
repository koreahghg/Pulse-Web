import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveReport,
  getStoredReport,
  getAllHistoryEntries,
  deleteHistoryEntry,
} from '@/lib/storage';
import type { LighthouseReport } from '@/types';

function makeMockReport(id: string, url: string): LighthouseReport {
  return {
    id,
    url,
    fetchTime: new Date().toISOString(),
    strategy: 'mobile',
    categories: {
      performance: { id: 'performance', title: '성능', score: 0.95 },
      accessibility: { id: 'accessibility', title: '접근성', score: 0.88 },
      bestPractices: { id: 'best-practices', title: '모범 사례', score: 0.92 },
      seo: { id: 'seo', title: 'SEO', score: 1.0 },
    },
    metrics: [],
    keyMetrics: {
      fcp: null,
      lcp: null,
      cls: null,
      tti: null,
      tbt: null,
      speedIndex: null,
    },
  };
}

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveReport / getStoredReport', () => {
    it('저장한 리포트를 URL로 조회할 수 있다', () => {
      const url = 'https://example.com';
      const report = makeMockReport('r1', url);
      saveReport(url, report);
      expect(getStoredReport(url)).toEqual(report);
    });

    it('같은 URL로 재저장하면 최신 리포트로 덮어쓴다', () => {
      const url = 'https://example.com';
      saveReport(url, makeMockReport('r1', url));
      const newer = makeMockReport('r2', url);
      saveReport(url, newer);
      expect(getStoredReport(url)?.id).toBe('r2');
    });

    it('저장되지 않은 URL은 null을 반환한다', () => {
      expect(getStoredReport('https://not-saved.com')).toBeNull();
    });
  });

  describe('getAllHistoryEntries', () => {
    it('저장 순서의 역순(최신 우선)으로 이력을 반환한다', () => {
      saveReport('https://a.com', makeMockReport('r-a', 'https://a.com'));
      saveReport('https://b.com', makeMockReport('r-b', 'https://b.com'));
      const entries = getAllHistoryEntries();
      expect(entries[0].id).toBe('r-b');
      expect(entries[1].id).toBe('r-a');
    });

    it('이력이 없으면 빈 배열을 반환한다', () => {
      expect(getAllHistoryEntries()).toEqual([]);
    });

    it('반환된 엔트리에 url, savedAt, report가 포함된다', () => {
      const url = 'https://example.com';
      saveReport(url, makeMockReport('r1', url));
      const [entry] = getAllHistoryEntries();
      expect(entry).toMatchObject({ id: 'r1', url });
      expect(entry.savedAt).toBeTruthy();
      expect(entry.report.categories.performance.score).toBe(0.95);
    });
  });

  describe('deleteHistoryEntry', () => {
    it('id에 해당하는 이력을 삭제한다', () => {
      saveReport('https://example.com', makeMockReport('del-1', 'https://example.com'));
      deleteHistoryEntry('del-1');
      expect(getAllHistoryEntries().find((e) => e.id === 'del-1')).toBeUndefined();
    });

    it('삭제 후 다른 이력은 유지된다', () => {
      saveReport('https://a.com', makeMockReport('keep-1', 'https://a.com'));
      saveReport('https://b.com', makeMockReport('del-1', 'https://b.com'));
      deleteHistoryEntry('del-1');
      const entries = getAllHistoryEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('keep-1');
    });

    it('존재하지 않는 id를 삭제해도 오류가 발생하지 않는다', () => {
      expect(() => deleteHistoryEntry('non-existent')).not.toThrow();
    });
  });
});
