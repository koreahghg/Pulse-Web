import { describe, it, expect } from 'vitest';
import { generateRecommendations } from '@/lib/recommendations';
import type { LighthouseReport } from '@/types';

function makeReport(overrides: Partial<LighthouseReport> = {}): LighthouseReport {
  return {
    id: 'test-report',
    url: 'https://example.com',
    fetchTime: new Date().toISOString(),
    strategy: 'mobile',
    categories: {
      performance: { id: 'performance', title: '성능', score: 1.0 },
      accessibility: { id: 'accessibility', title: '접근성', score: 1.0 },
      bestPractices: { id: 'best-practices', title: '모범 사례', score: 1.0 },
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
    ...overrides,
  };
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

describe('generateRecommendations', () => {
  it('모든 점수가 양호하면 빈 배열을 반환한다', () => {
    expect(generateRecommendations(makeReport())).toHaveLength(0);
  });

  describe('LCP 추천', () => {
    it('LCP가 poor이면 critical 우선순위 추천을 포함한다', () => {
      const report = makeReport({
        keyMetrics: {
          fcp: null,
          lcp: {
            id: 'largest-contentful-paint',
            title: 'LCP',
            value: 6500,
            score: 0.1,
            displayValue: '6.5 s',
            scoreLabel: 'poor',
          },
          cls: null,
          tti: null,
          tbt: null,
          speedIndex: null,
        },
      });
      const recs = generateRecommendations(report);
      const lcpRec = recs.find((r) => r.id === 'lcp');
      expect(lcpRec).toBeDefined();
      expect(lcpRec?.priority).toBe('critical');
    });

    it('LCP가 needs-improvement이면 high 우선순위 추천을 포함한다', () => {
      const report = makeReport({
        keyMetrics: {
          fcp: null,
          lcp: {
            id: 'largest-contentful-paint',
            title: 'LCP',
            value: 3200,
            score: 0.6,
            displayValue: '3.2 s',
            scoreLabel: 'needs-improvement',
          },
          cls: null,
          tti: null,
          tbt: null,
          speedIndex: null,
        },
      });
      const recs = generateRecommendations(report);
      const lcpRec = recs.find((r) => r.id === 'lcp');
      expect(lcpRec?.priority).toBe('high');
    });
  });

  describe('접근성 추천', () => {
    it('접근성 점수가 0.7 미만이면 high 우선순위 추천을 포함한다', () => {
      const report = makeReport({
        categories: {
          performance: { id: 'performance', title: '성능', score: 1.0 },
          accessibility: { id: 'accessibility', title: '접근성', score: 0.6 },
          bestPractices: { id: 'best-practices', title: '모범 사례', score: 1.0 },
          seo: { id: 'seo', title: 'SEO', score: 1.0 },
        },
      });
      const recs = generateRecommendations(report);
      const a11yRec = recs.find((r) => r.id === 'accessibility');
      expect(a11yRec).toBeDefined();
      expect(a11yRec?.priority).toBe('high');
    });

    it('접근성 점수가 0.7~0.9이면 medium 우선순위 추천을 포함한다', () => {
      const report = makeReport({
        categories: {
          performance: { id: 'performance', title: '성능', score: 1.0 },
          accessibility: { id: 'accessibility', title: '접근성', score: 0.8 },
          bestPractices: { id: 'best-practices', title: '모범 사례', score: 1.0 },
          seo: { id: 'seo', title: 'SEO', score: 1.0 },
        },
      });
      const recs = generateRecommendations(report);
      expect(recs.find((r) => r.id === 'accessibility')?.priority).toBe('medium');
    });
  });

  it('성능 점수가 0.5 미만이고 메트릭 추천이 없으면 일반 성능 개선 추천을 반환한다', () => {
    const report = makeReport({
      categories: {
        performance: { id: 'performance', title: '성능', score: 0.3 },
        accessibility: { id: 'accessibility', title: '접근성', score: 1.0 },
        bestPractices: { id: 'best-practices', title: '모범 사례', score: 1.0 },
        seo: { id: 'seo', title: 'SEO', score: 1.0 },
      },
    });
    const recs = generateRecommendations(report);
    expect(recs.find((r) => r.id === 'performance-general')).toBeDefined();
  });

  it('추천 결과가 우선순위 순(critical → high → medium → low)으로 정렬된다', () => {
    const report = makeReport({
      categories: {
        performance: { id: 'performance', title: '성능', score: 0.3 },
        accessibility: { id: 'accessibility', title: '접근성', score: 0.6 },
        bestPractices: { id: 'best-practices', title: '모범 사례', score: 0.5 },
        seo: { id: 'seo', title: 'SEO', score: 0.5 },
      },
    });
    const recs = generateRecommendations(report);
    for (let i = 0; i < recs.length - 1; i++) {
      expect(PRIORITY_ORDER[recs[i].priority]).toBeLessThanOrEqual(
        PRIORITY_ORDER[recs[i + 1].priority],
      );
    }
  });

  it('각 추천에 title, description, actions 필드가 존재한다', () => {
    const report = makeReport({
      categories: {
        performance: { id: 'performance', title: '성능', score: 1.0 },
        accessibility: { id: 'accessibility', title: '접근성', score: 0.6 },
        bestPractices: { id: 'best-practices', title: '모범 사례', score: 1.0 },
        seo: { id: 'seo', title: 'SEO', score: 1.0 },
      },
    });
    const recs = generateRecommendations(report);
    for (const rec of recs) {
      expect(rec.title).toBeTruthy();
      expect(rec.description).toBeTruthy();
      expect(rec.actions.length).toBeGreaterThan(0);
    }
  });
});
