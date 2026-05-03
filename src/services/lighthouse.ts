import type { AuditStrategy, LighthouseReport, PerformanceMetric } from '@/types';

const PSI_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

// PageSpeed Insights API 응답 타입 (필요한 필드만 정의)
interface PSIAudit {
  title: string;
  numericValue?: number;
  score?: number;
  displayValue?: string;
}

interface PSICategoryScore {
  score: number;
}

interface PSILighthouseResult {
  fetchTime?: string;
  categories?: {
    performance?: PSICategoryScore;
    accessibility?: PSICategoryScore;
    'best-practices'?: PSICategoryScore;
    seo?: PSICategoryScore;
  };
  audits?: Record<string, PSIAudit>;
}

interface PSIResponse {
  id?: string;
  lighthouseResult?: PSILighthouseResult;
}

const METRIC_IDS = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'total-blocking-time',
  'cumulative-layout-shift',
  'speed-index',
  'interactive',
] as const;

export async function runLighthouseAudit(
  url: string,
  strategy: AuditStrategy = 'mobile'
): Promise<LighthouseReport> {
  const apiKey = process.env.LIGHTHOUSE_API_KEY;

  const params = new URLSearchParams({ url, strategy });
  if (apiKey) params.set('key', apiKey);

  const response = await fetch(`${PSI_API_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`PageSpeed API 오류: ${response.status} ${response.statusText}`);
  }

  const data: PSIResponse = await response.json();
  return transformResponse(data, strategy);
}

function transformResponse(data: PSIResponse, strategy: AuditStrategy): LighthouseReport {
  const result = data.lighthouseResult ?? {};
  const categories = result.categories ?? {};
  const audits = result.audits ?? {};

  return {
    id: crypto.randomUUID(),
    url: data.id ?? '',
    fetchTime: result.fetchTime ?? new Date().toISOString(),
    strategy,
    categories: {
      performance: {
        id: 'performance',
        title: '성능',
        score: categories.performance?.score ?? 0,
      },
      accessibility: {
        id: 'accessibility',
        title: '접근성',
        score: categories.accessibility?.score ?? 0,
      },
      bestPractices: {
        id: 'best-practices',
        title: '모범 사례',
        score: categories['best-practices']?.score ?? 0,
      },
      seo: {
        id: 'seo',
        title: 'SEO',
        score: categories.seo?.score ?? 0,
      },
    },
    metrics: extractMetrics(audits),
  };
}

function extractMetrics(audits: Record<string, PSIAudit>): PerformanceMetric[] {
  return METRIC_IDS.filter((id) => audits[id]).map((id) => ({
    id,
    title: audits[id].title,
    value: audits[id].numericValue ?? 0,
    score: audits[id].score ?? 0,
    displayValue: audits[id].displayValue ?? '',
  }));
}
