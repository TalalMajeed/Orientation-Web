interface Window {
  count: number;
  resetAt: number;
}

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

const MAX_TRACKED_KEYS = 20000;
const SWEEP_INTERVAL_MS = 60_000;

const windows = new Map<string, Window>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) {
    return;
  }

  lastSweep = now;

  for (const [key, window] of windows) {
    if (window.resetAt <= now) {
      windows.delete(key);
    }
  }
}

export function checkRateLimit(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();

  sweep(now);

  const existing = windows.get(key);
  const window =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + rule.windowMs };

  window.count += 1;

  if (!windows.has(key) && windows.size >= MAX_TRACKED_KEYS) {
    return {
      allowed: true,
      limit: rule.limit,
      remaining: rule.limit - 1,
      resetAt: window.resetAt,
      retryAfterSeconds: 0,
    };
  }

  windows.set(key, window);

  return {
    allowed: window.count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - window.count),
    resetAt: window.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000)),
  };
}

export function resetRateLimits() {
  windows.clear();
  lastSweep = 0;
}
