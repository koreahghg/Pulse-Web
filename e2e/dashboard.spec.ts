import { test, expect } from '@playwright/test';

interface MockCategories {
  performance: { id: string; title: string; score: number };
  accessibility: { id: string; title: string; score: number };
  bestPractices: { id: string; title: string; score: number };
  seo: { id: string; title: string; score: number };
}

interface MockEntry {
  id: string;
  url: string;
  savedAt: string;
  report: {
    id: string;
    url: string;
    fetchTime: string;
    strategy: string;
    categories: MockCategories;
    metrics: unknown[];
    keyMetrics: Record<string, null>;
  };
}

function makeEntry(id: string, url: string, perfScore = 0.9): MockEntry {
  const now = new Date(Date.now() - 120_000).toISOString();
  return {
    id,
    url,
    savedAt: now,
    report: {
      id,
      url,
      fetchTime: now,
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

function buildStorageData(entries: MockEntry[]): Record<string, string> {
  return {
    'pulse-web:history-list': JSON.stringify(entries),
    'pulse-web:history': JSON.stringify(
      Object.fromEntries(
        entries.map((e) => [e.url, { report: e.report, savedAt: e.savedAt }]),
      ),
    ),
  };
}

test.describe('대시보드 — 빈 상태', () => {
  test('이력이 없으면 빈 상태 화면을 보여준다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('빈 상태에서 "첫 번째 감사 시작하기" 버튼이 /audit으로 연결된다', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: '첫 번째 감사 시작하기' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/audit');
  });

  test('이력이 없으면 4개 점수 카드가 모두 -- 로 표시된다', async ({ page }) => {
    await page.goto('/');
    const scoreValues = page.getByTestId('score-value');
    await expect(scoreValues).toHaveCount(4);
    for (const el of await scoreValues.all()) {
      await expect(el).toHaveText('--');
    }
  });
});

test.describe('대시보드 — 이력 있음', () => {
  test('이력이 있으면 최근 감사 카드를 보여준다', async ({ page }) => {
    const entry = makeEntry('r1', 'https://example.com', 0.92);
    await page.addInitScript((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, buildStorageData([entry]));

    await page.goto('/');
    await expect(page.getByTestId('recent-audit-list')).toBeVisible();
    await expect(page.getByTestId('recent-audit-card')).toHaveCount(1);
    await expect(page.getByText('https://example.com')).toBeVisible();
  });

  test('성능 점수가 카드에 정확히 표시된다', async ({ page }) => {
    const entry = makeEntry('r1', 'https://example.com', 0.92);
    await page.addInitScript((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, buildStorageData([entry]));

    await page.goto('/');
    await expect(page.getByTestId('perf-score')).toHaveText('92');
  });

  test('카테고리 점수 카드가 숫자로 표시된다', async ({ page }) => {
    const entry = makeEntry('r1', 'https://example.com', 0.85);
    await page.addInitScript((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, buildStorageData([entry]));

    await page.goto('/');
    const scoreValues = page.getByTestId('score-value');
    await expect(scoreValues).toHaveCount(4);
    await expect(scoreValues.first()).toHaveText('85');
  });

  test('"전체 보기" 링크가 /history로 연결된다', async ({ page }) => {
    const entry = makeEntry('r1', 'https://example.com');
    await page.addInitScript((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, buildStorageData([entry]));

    await page.goto('/');
    const link = page.getByRole('link', { name: /전체 보기/ });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/history');
  });

  test('이력 6건 중 최대 5건만 표시된다', async ({ page }) => {
    const entries = Array.from({ length: 6 }, (_, i) =>
      makeEntry(`r${i}`, `https://site${i}.com`),
    );
    await page.addInitScript((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, buildStorageData(entries));

    await page.goto('/');
    await expect(page.getByTestId('recent-audit-card')).toHaveCount(5);
  });
});
