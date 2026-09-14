import { renderHook, act } from '@testing-library/react';

import useBoundedPoll from './useBoundedPoll';

const pending = { state: { data: { code: 'evaluation_pending' } } };
const terminal = { state: { data: { passed: true } } };
const isPending = (d) => d?.code === 'evaluation_pending';

describe('useBoundedPoll', () => {
  afterEach(() => vi.restoreAllMocks());

  it('polls fast initially, backs off, then stops after the max window', () => {
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    const { result } = renderHook(() =>
      useBoundedPoll({
        isPending,
        fast: 4000,
        slow: 12000,
        fastWindowMs: 30_000,
        maxWindowMs: 150_000,
      }),
    );

    // t≈0 → fast
    expect(result.current.intervalFn(pending)).toBe(4000);

    // t=40s → slow (past the fast window)
    now += 40_000;
    expect(result.current.intervalFn(pending)).toBe(12000);

    // t=160s → stop automatic polling, flip `stopped`
    now += 120_000;
    let interval;
    act(() => {
      interval = result.current.intervalFn(pending);
    });
    expect(interval).toBe(false);
    expect(result.current.stopped).toBe(true);
  });

  it('stops immediately at a terminal outcome', () => {
    const { result } = renderHook(() => useBoundedPoll({ isPending }));
    expect(result.current.intervalFn(terminal)).toBe(false);
  });

  it('reset() restarts the window and clears stopped', () => {
    let now = 5_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const { result } = renderHook(() =>
      useBoundedPoll({ isPending, maxWindowMs: 100_000 }),
    );

    now += 200_000;
    act(() => result.current.intervalFn(pending));
    expect(result.current.stopped).toBe(true);

    act(() => result.current.reset());
    expect(result.current.stopped).toBe(false);
    expect(result.current.intervalFn(pending)).toBe(4000); // fast again
  });
});
