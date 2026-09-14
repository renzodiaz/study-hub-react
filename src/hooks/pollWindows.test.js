import { resolvePollWindows, CANONICAL_POLL_WINDOWS } from './pollWindows';

const OVERRIDE_ENV = {
  VITE_POLL_FAST_MS: '2000',
  VITE_POLL_SLOW_MS: '2000',
  VITE_POLL_FAST_WINDOW_MS: '2000',
  VITE_POLL_MAX_WINDOW_MS: '8000',
};

describe('resolvePollWindows', () => {
  it('production IGNORES every VITE_POLL_* override and returns canonical constants', () => {
    expect(resolvePollWindows({ prod: true, env: OVERRIDE_ENV })).toEqual(
      CANONICAL_POLL_WINDOWS,
    );
  });

  it('production with no env still returns canonical constants', () => {
    expect(resolvePollWindows({ prod: true, env: {} })).toEqual(
      CANONICAL_POLL_WINDOWS,
    );
    expect(resolvePollWindows({ prod: true })).toEqual(CANONICAL_POLL_WINDOWS);
  });

  it('non-production applies the shortened windows from VITE_POLL_* (E2E path)', () => {
    expect(resolvePollWindows({ prod: false, env: OVERRIDE_ENV })).toEqual({
      fast: 2000,
      slow: 2000,
      fastWindowMs: 2000,
      maxWindowMs: 8000,
    });
  });

  it('non-production with no overrides returns canonical constants', () => {
    expect(resolvePollWindows({ prod: false, env: {} })).toEqual(
      CANONICAL_POLL_WINDOWS,
    );
  });

  it('non-production ignores non-positive / non-numeric override values', () => {
    const bad = {
      VITE_POLL_FAST_MS: 'false',
      VITE_POLL_SLOW_MS: '0',
      VITE_POLL_FAST_WINDOW_MS: '-5',
      VITE_POLL_MAX_WINDOW_MS: 'abc',
    };
    expect(resolvePollWindows({ prod: false, env: bad })).toEqual(
      CANONICAL_POLL_WINDOWS,
    );
  });

  it('canonical constants are the approved production defaults', () => {
    expect(CANONICAL_POLL_WINDOWS).toEqual({
      fast: 4000,
      slow: 12000,
      fastWindowMs: 30_000,
      maxWindowMs: 150_000,
    });
  });
});
