/**
 * Fixed-window rate limiter, in memory.
 *
 * In memory means per server instance: two instances behind a load balancer
 * each allow the full budget, and a deploy resets every window. That is a real
 * limitation and the honest ceiling of what a limiter inside the app can do —
 * the fix is a shared store (Redis) or the edge (Cloudflare/WAF), not a
 * cleverer map. What this does buy, on a single-instance deployment, is the
 * thing that was missing entirely: an attacker cannot sit on /api/v1/auth/login
 * and grind through a password list, and no one script can flood the database
 * through the newsletter endpoint.
 *
 * A fixed window (rather than a sliding one) lets a burst straddle a boundary
 * and spend two windows' budget back to back. Accepted: the budgets here are
 * set low enough that twice one is still far below what a human operator or a
 * page load needs.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

// Bounds the map so a flood of distinct keys (spoofed forwarded-for headers,
// or simply a lot of real visitors) cannot grow it without limit.
const MAX_TRACKED_KEYS = 20000;

let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

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

export interface RateLimitRule {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
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
    // Out of room: let the request through rather than locking everyone out
    // because the map filled. Availability beats a limiter that has already
    // lost track of who is who.
    return {
      allowed: true,
      limit: rule.limit,
      remaining: rule.limit - 1,
      resetAt: window.resetAt,
      retryAfterSeconds: 0,
    };
  }

  windows.set(key, window);

  const allowed = window.count <= rule.limit;

  return {
    allowed,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - window.count),
    resetAt: window.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000)),
  };
}

/** Test seam — the map is module state, so a suite needs a way to reset it. */
export function resetRateLimits() {
  windows.clear();
  lastSweep = 0;
}
