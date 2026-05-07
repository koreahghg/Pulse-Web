import type { AuditStrategy, LighthouseReport } from '@/types';

interface AuditSuccessResponse {
  report: LighthouseReport;
}

interface AuditErrorResponse {
  message?: string;
}

const DEFAULT_ERROR_MESSAGE = '성능 분석 요청에 실패했습니다.';

export async function requestLighthouseAudit(
  url: string,
  strategy: AuditStrategy = 'mobile'
): Promise<LighthouseReport> {
  const response = await fetch('/api/audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({ url, strategy }),
  });

  const payload = (await safeReadJson(response)) as
    | AuditSuccessResponse
    | AuditErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  if (!payload || typeof payload !== 'object' || !('report' in payload)) {
    throw new Error('분석 결과 형식이 올바르지 않습니다.');
  }

  return payload.report;
}

async function safeReadJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(payload: AuditSuccessResponse | AuditErrorResponse | null): string {
  if (payload && 'message' in payload && typeof payload.message === 'string') {
    return payload.message;
  }

  return DEFAULT_ERROR_MESSAGE;
}
