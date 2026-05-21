const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 10;

interface WindowRecord {
  timestamps: number[];
}

const store = new Map<string, WindowRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const record = store.get(key) ?? { timestamps: [] };
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  const resetAt =
    record.timestamps.length > 0 ? record.timestamps[0] + WINDOW_MS : now + WINDOW_MS;

  if (record.timestamps.length >= MAX_REQUESTS) {
    store.set(key, record);
    return { allowed: false, remaining: 0, resetAt };
  }

  record.timestamps.push(now);
  store.set(key, record);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - record.timestamps.length,
    resetAt,
  };
}

// 테스트 환경에서 store 초기화용
export function resetRateLimitStore(): void {
  store.clear();
}
