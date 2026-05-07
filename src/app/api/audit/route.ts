import { NextResponse } from 'next/server';
import { isValidUrl } from '@/lib/utils';
import { LighthouseServiceError, runLighthouseAudit } from '@/services/lighthouse';
import type { AuditStrategy } from '@/types';

export const dynamic = 'force-dynamic';

interface AuditRequestBody {
  url?: unknown;
  strategy?: unknown;
}

export async function POST(request: Request) {
  let body: AuditRequestBody;

  try {
    body = (await request.json()) as AuditRequestBody;
  } catch {
    return createErrorResponse('요청 본문은 JSON 형식이어야 합니다.', 'INVALID_JSON', 400);
  }

  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const strategy = parseStrategy(body.strategy);

  if (!url) {
    return createErrorResponse('분석할 URL을 입력해주세요.', 'INVALID_URL', 400);
  }

  if (!isValidUrl(url)) {
    return createErrorResponse(
      'http:// 또는 https:// 형식의 올바른 URL을 입력해주세요.',
      'INVALID_URL',
      400
    );
  }

  try {
    const report = await runLighthouseAudit(url, strategy);

    return NextResponse.json(
      { report },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    if (error instanceof LighthouseServiceError) {
      return createErrorResponse(error.message, error.code, error.status);
    }

    return createErrorResponse(
      '성능 분석 요청을 처리하는 중 오류가 발생했습니다.',
      'AUDIT_REQUEST_FAILED',
      500
    );
  }
}

function parseStrategy(value: unknown): AuditStrategy {
  return value === 'desktop' ? 'desktop' : 'mobile';
}

function createErrorResponse(message: string, code: string, status: number) {
  return NextResponse.json(
    { message, code },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
