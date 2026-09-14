// Canonical production polling windows for useBoundedPoll. These are the ONLY
// values production ever uses (~4s fast, ~12s slow, 30s fast-window, 150s max);
// they must never change based on environment.
export const CANONICAL_POLL_WINDOWS = {
  fast: 4000,
  slow: 12000,
  fastWindowMs: 30_000,
  maxWindowMs: 150_000,
};

// The env var that may shorten each window in dev/test/E2E only.
const ENV_KEYS = {
  fast: 'VITE_POLL_FAST_MS',
  slow: 'VITE_POLL_SLOW_MS',
  fastWindowMs: 'VITE_POLL_FAST_WINDOW_MS',
  maxWindowMs: 'VITE_POLL_MAX_WINDOW_MS',
};

const positiveMs = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// Pure resolver (no import.meta access) so it is directly unit-testable.
//
// In a PRODUCTION build (`prod` true) it returns the canonical constants and
// never reads `env`, so a VITE_POLL_* override cannot shorten production polling
// — the override branch is structurally unreachable, not merely "left unset".
// Outside production, each window may be shortened by its VITE_POLL_* var
// (positive numbers only; anything else falls back to the canonical value).
export function resolvePollWindows({ prod, env = {} } = {}) {
  if (prod) return { ...CANONICAL_POLL_WINDOWS };

  return Object.fromEntries(
    Object.keys(CANONICAL_POLL_WINDOWS).map((key) => [
      key,
      positiveMs(env[ENV_KEYS[key]]) ?? CANONICAL_POLL_WINDOWS[key],
    ]),
  );
}
