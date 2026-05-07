import { scoreToRating } from '@/lib/utils';
import type {
  AuditStrategy,
  KeyMetrics,
  LighthouseReport,
  PerformanceMetric,
  WebVitals,
} from '@/types';

const PSI_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

// PageSpeed Insights API 응답 타입 (필요한 필드만 정의)
interface PSIAudit {
  title?: string;
  numericValue?: number;
  score?: number | null;
  displayValue?: string;
}

interface PSICategoryScore {
  score?: number | null;
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
  error?: {
    code?: number;
    message?: string;
  };
}

const METRIC_IDS = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'total-blocking-time',
  'cumulative-layout-shift',
  'speed-index',
  'interactive',
] as const;

const METRIC_METADATA = {
  'first-contentful-paint': {
    title: 'First Contentful Paint',
    description: '첫 번째 콘텐츠가 화면에 나타날 때까지 걸린 시간입니다.',
  },
  'largest-contentful-paint': {
    title: 'Largest Contentful Paint',
    description: '가장 큰 주요 콘텐츠가 렌더링될 때까지 걸린 시간입니다.',
  },
  'total-blocking-time': {
    title: 'Total Blocking Time',
    description: '메인 스레드가 사용자 입력을 막은 누적 시간입니다.',
  },
  'cumulative-layout-shift': {
    title: 'Cumulative Layout Shift',
    description: '예상치 못한 레이아웃 이동 정도를 나타냅니다.',
  },
  'speed-index': {
    title: 'Speed Index',
    description: '페이지가 시각적으로 채워지는 속도를 보여줍니다.',
  },
  interactive: {
    title: 'Time to Interactive',
    description: '페이지가 안정적으로 상호작용 가능한 상태가 될 때까지 걸린 시간입니다.',
  },
} as const;

const KEY_METRIC_IDS = {
  fcp: 'first-contentful-paint',
  lcp: 'largest-contentful-paint',
  cls: 'cumulative-layout-shift',
  tti: 'interactive',
  tbt: 'total-blocking-time',
  speedIndex: 'speed-index',
} as const;

export class LighthouseServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'LighthouseServiceError';
  }
}

export async function runLighthouseAudit(
  url: string,
  strategy: AuditStrategy = 'mobile'
): Promise<LighthouseReport> {
  const apiKey = process.env.LIGHTHOUSE_API_KEY;
  const timeout = Number(process.env.AUDIT_TIMEOUT) || 30000;

  const params = new URLSearchParams({ url, strategy });
  if (apiKey) params.set('key', apiKey);

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${PSI_API_URL}?${params}`, {
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorPayload = (await safeParseJson(response)) as PSIResponse | null;
      const errorMessage =
        errorPayload?.error?.message ||
        `PageSpeed API 오류: ${response.status} ${response.statusText}`;

      throw new LighthouseServiceError(errorMessage, 502, 'LIGHTHOUSE_UPSTREAM_ERROR');
    }

    const data = await safeParseJson(response);

    if (!isPSIResponse(data)) {
      throw new LighthouseServiceError(
        '유효하지 않은 응답 데이터입니다.',
        502,
        'LIGHTHOUSE_INVALID_RESPONSE'
      );
    }

    return transformResponse(data, url, strategy);
  } catch (error) {
    if (error instanceof LighthouseServiceError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new LighthouseServiceError(
        'Lighthouse API 요청이 시간 초과되었습니다. 잠시 후 다시 시도해주세요.',
        504,
        'LIGHTHOUSE_TIMEOUT'
      );
    }

    throw new LighthouseServiceError(
      'Lighthouse 분석 중 알 수 없는 오류가 발생했습니다.',
      502,
      'LIGHTHOUSE_REQUEST_FAILED'
    );
  } finally {
    clearTimeout(timerId);
  }
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isPSIResponse(data: unknown): data is PSIResponse {
  return typeof data === 'object' && data !== null;
}

function transformResponse(
  data: PSIResponse,
  requestedUrl: string,
  strategy: AuditStrategy
): LighthouseReport {
  const result = data.lighthouseResult ?? {};
  const categories = result.categories ?? {};
  const audits = result.audits ?? {};
  const metrics = extractMetrics(audits);

  return {
    id: crypto.randomUUID(),
    url: data.id ?? requestedUrl,
    fetchTime: result.fetchTime ?? new Date().toISOString(),
    strategy,
    categories: {
      performance: {
        id: 'performance',
        title: '성능',
        score: normalizeScore(categories.performance?.score),
      },
      accessibility: {
        id: 'accessibility',
        title: '접근성',
        score: normalizeScore(categories.accessibility?.score),
      },
      bestPractices: {
        id: 'best-practices',
        title: '모범 사례',
        score: normalizeScore(categories['best-practices']?.score),
      },
      seo: {
        id: 'seo',
        title: 'SEO',
        score: normalizeScore(categories.seo?.score),
      },
    },
    metrics,
    keyMetrics: extractKeyMetrics(metrics),
    webVitals: extractWebVitals(metrics),
  };
}

function extractMetrics(audits: Record<string, PSIAudit>): PerformanceMetric[] {
  return METRIC_IDS.filter((id) => audits[id]).map((id) => ({
    id,
    title: audits[id].title ?? METRIC_METADATA[id].title,
    value: audits[id].numericValue ?? 0,
    score: normalizeScore(audits[id].score),
    displayValue: audits[id].displayValue ?? '',
    scoreLabel: scoreToRating(normalizeScore(audits[id].score)),
    description: METRIC_METADATA[id].description,
  }));
}

function extractKeyMetrics(metrics: PerformanceMetric[]): KeyMetrics {
  const metricMap = new Map(metrics.map((metric) => [metric.id, metric]));

  return {
    fcp: metricMap.get(KEY_METRIC_IDS.fcp) ?? null,
    lcp: metricMap.get(KEY_METRIC_IDS.lcp) ?? null,
    cls: metricMap.get(KEY_METRIC_IDS.cls) ?? null,
    tti: metricMap.get(KEY_METRIC_IDS.tti) ?? null,
    tbt: metricMap.get(KEY_METRIC_IDS.tbt) ?? null,
    speedIndex: metricMap.get(KEY_METRIC_IDS.speedIndex) ?? null,
  };
}

function extractWebVitals(metrics: PerformanceMetric[]): WebVitals {
  const keyMetrics = extractKeyMetrics(metrics);

  return {
    lcp: toWebVitalMetric(keyMetrics.lcp),
    inp: null,
    cls: toWebVitalMetric(keyMetrics.cls),
    fcp: toWebVitalMetric(keyMetrics.fcp),
    ttfb: null,
    tbt: toWebVitalMetric(keyMetrics.tbt),
    si: toWebVitalMetric(keyMetrics.speedIndex),
  };
}

function normalizeScore(score?: number | null): number {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }

  return Math.min(1, Math.max(0, score));
}

function toWebVitalMetric(metric: PerformanceMetric | null) {
  if (!metric?.scoreLabel) {
    return null;
  }

  return {
    value: metric.value,
    score: metric.scoreLabel,
    displayValue: metric.displayValue,
  };
}
