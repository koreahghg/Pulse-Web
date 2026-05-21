import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/lighthouse', () => {
  class LighthouseServiceError extends Error {
    code: string;
    status: number;
    constructor(message: string, status: number, code: string) {
      super(message);
      this.name = 'LighthouseServiceError';
      this.status = status;
      this.code = code;
    }
  }
  return {
    runLighthouseAudit: vi.fn(),
    LighthouseServiceError,
  };
});

import { POST } from '@/app/api/audit/route';
import { runLighthouseAudit, LighthouseServiceError } from '@/services/lighthouse';
import { resetRateLimitStore } from '@/lib/rate-limit';

const mockRunAudit = vi.mocked(runLighthouseAudit);

const mockReport = {
  id: 'report-1',
  url: 'https://example.com',
  fetchTime: new Date().toISOString(),
  strategy: 'mobile' as const,
  categories: {
    performance: { id: 'performance', title: '성능', score: 0.9 },
    accessibility: { id: 'accessibility', title: '접근성', score: 0.95 },
    bestPractices: { id: 'best-practices', title: '모범 사례', score: 0.92 },
    seo: { id: 'seo', title: 'SEO', score: 1.0 },
  },
  metrics: [],
  keyMetrics: { fcp: null, lcp: null, cls: null, tti: null, tbt: null, speedIndex: null },
};

function makeRequest(body: unknown, extraHeaders: Record<string, string> = {}): Request {
  return new Request('http://localhost:3000/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  });
}

describe('POST /api/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
  });

  it('URL 없이 요청하면 400을 반환한다', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('INVALID_URL');
  });

  it('잘못된 URL 형식이면 400을 반환한다', async () => {
    const res = await POST(makeRequest({ url: 'not-a-url' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('INVALID_URL');
  });

  it('ftp:// 프로토콜이면 400을 반환한다', async () => {
    const res = await POST(makeRequest({ url: 'ftp://example.com' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('INVALID_URL');
  });

  it('유효한 URL로 요청하면 Lighthouse 리포트를 반환한다', async () => {
    mockRunAudit.mockResolvedValueOnce(mockReport as never);
    const res = await POST(makeRequest({ url: 'https://example.com', strategy: 'mobile' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report.id).toBe('report-1');
    expect(mockRunAudit).toHaveBeenCalledWith('https://example.com', 'mobile');
  });

  it('strategy 미지정 시 mobile로 호출된다', async () => {
    mockRunAudit.mockResolvedValueOnce(mockReport as never);
    await POST(makeRequest({ url: 'https://example.com' }));
    expect(mockRunAudit).toHaveBeenCalledWith('https://example.com', 'mobile');
  });

  it('strategy: desktop이면 desktop으로 호출된다', async () => {
    mockRunAudit.mockResolvedValueOnce(mockReport as never);
    await POST(makeRequest({ url: 'https://example.com', strategy: 'desktop' }));
    expect(mockRunAudit).toHaveBeenCalledWith('https://example.com', 'desktop');
  });

  it('LighthouseServiceError 발생 시 해당 status 코드를 반환한다', async () => {
    mockRunAudit.mockRejectedValueOnce(
      new LighthouseServiceError('PSI 오류', 503, 'LIGHTHOUSE_UPSTREAM_ERROR'),
    );
    const res = await POST(makeRequest({ url: 'https://example.com' }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe('LIGHTHOUSE_UPSTREAM_ERROR');
  });

  it('예기치 못한 오류 발생 시 500을 반환한다', async () => {
    mockRunAudit.mockRejectedValueOnce(new Error('unexpected'));
    const res = await POST(makeRequest({ url: 'https://example.com' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe('AUDIT_REQUEST_FAILED');
  });

  it('잘못된 JSON 본문이면 400을 반환한다', async () => {
    const req = new Request('http://localhost:3000/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json{{{',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('INVALID_JSON');
  });

  describe('보안 — rate limit', () => {
    it('10회 초과 요청 시 429를 반환한다', async () => {
      for (let i = 0; i < 10; i++) {
        await POST(makeRequest({}));
      }
      const res = await POST(makeRequest({ url: 'https://example.com' }));
      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('성공 응답에 X-RateLimit 헤더가 포함된다', async () => {
      mockRunAudit.mockResolvedValueOnce(mockReport as never);
      const res = await POST(makeRequest({ url: 'https://example.com' }));
      expect(res.headers.get('X-RateLimit-Remaining')).not.toBeNull();
      expect(res.headers.get('X-RateLimit-Reset')).not.toBeNull();
    });
  });

  describe('보안 — Content-Type 검증', () => {
    it('Content-Type이 application/json이 아니면 415를 반환한다', async () => {
      const req = new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ url: 'https://example.com' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(415);
      const body = await res.json();
      expect(body.code).toBe('INVALID_CONTENT_TYPE');
    });
  });

  describe('보안 — 요청 크기 제한', () => {
    it('content-length가 1KB를 초과하면 413을 반환한다', async () => {
      const req = new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'content-length': '2048',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(413);
      const body = await res.json();
      expect(body.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('보안 — 내부망 URL 차단', () => {
    it('localhost URL이면 400을 반환한다', async () => {
      const res = await POST(makeRequest({ url: 'http://localhost/api/data' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('INVALID_URL');
    });

    it('127.0.0.1 URL이면 400을 반환한다', async () => {
      const res = await POST(makeRequest({ url: 'http://127.0.0.1:8080' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('INVALID_URL');
    });

    it('내부 사설 IP(192.168.x.x)이면 400을 반환한다', async () => {
      const res = await POST(makeRequest({ url: 'http://192.168.1.1/admin' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('INVALID_URL');
    });

    it('메타데이터 엔드포인트(169.254.x)이면 400을 반환한다', async () => {
      const res = await POST(makeRequest({ url: 'http://169.254.169.254/latest/meta-data/' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('INVALID_URL');
    });
  });
});
