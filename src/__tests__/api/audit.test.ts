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

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
