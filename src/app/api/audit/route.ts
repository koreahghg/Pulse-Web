import { NextResponse } from 'next/server';
import { isValidUrl } from '@/lib/utils';
import { LighthouseServiceError, runLighthouseAudit } from '@/services/lighthouse';
import { checkRateLimit } from '@/lib/rate-limit';
import type { AuditStrategy } from '@/types';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 1_024;

interface AuditRequestBody {
  url?: unknown;
  strategy?: unknown;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, remaining, resetAt } = checkRateLimit(ip);

  if (!allowed) {
    return createErrorResponse(
      '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      'RATE_LIMIT_EXCEEDED',
      429,
      { remaining: 0, resetAt }
    );
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return createErrorResponse(
      'Content-Type은 application/json이어야 합니다.',
      'INVALID_CONTENT_TYPE',
      415,
      { remaining, resetAt }
    );
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return createErrorResponse('요청 본문이 너무 큽니다.', 'PAYLOAD_TOO_LARGE', 413, {
      remaining,
      resetAt,
    });
  }

  let body: AuditRequestBody;
  try {
    body = (await request.json()) as AuditRequestBody;
  } catch {
    return createErrorResponse('요청 본문은 JSON 형식이어야 합니다.', 'INVALID_JSON', 400, {
      remaining,
      resetAt,
    });
  }

  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const strategy = parseStrategy(body.strategy);

  if (!url) {
    return createErrorResponse('분석할 URL을 입력해주세요.', 'INVALID_URL', 400, {
      remaining,
      resetAt,
    });
  }

  if (!isValidUrl(url)) {
    return createErrorResponse(
      'http:// 또는 https:// 형식의 올바른 URL을 입력해주세요.',
      'INVALID_URL',
      400,
      { remaining, resetAt }
    );
  }

  try {
    const report = await runLighthouseAudit(url, strategy);

    return NextResponse.json(
      { report },
      {
        headers: {
          'Cache-Control': 'no-store',
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        },
      }
    );
  } catch (error) {
    if (error instanceof LighthouseServiceError) {
      return createErrorResponse(error.message, error.code, error.status, { remaining, resetAt });
    }

    return createErrorResponse(
      '성능 분석 요청을 처리하는 중 오류가 발생했습니다.',
      'AUDIT_REQUEST_FAILED',
      500,
      { remaining, resetAt }
    );
  }
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function parseStrategy(value: unknown): AuditStrategy {
  return value === 'desktop' ? 'desktop' : 'mobile';
}

function createErrorResponse(
  message: string,
  code: string,
  status: number,
  rateLimit?: { remaining: number; resetAt: number }
) {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };

  if (rateLimit) {
    headers['X-RateLimit-Remaining'] = String(rateLimit.remaining);
    headers['X-RateLimit-Reset'] = String(Math.ceil(rateLimit.resetAt / 1000));
  }

  return NextResponse.json({ message, code }, { status, headers });
}
