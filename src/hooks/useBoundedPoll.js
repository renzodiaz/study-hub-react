import { useEffect, useRef, useState, useCallback } from 'react';

import { resolvePollWindows } from './pollWindows';

// Resolved once at module load. `import.meta.env.PROD` is statically true in a
// production build, so resolvePollWindows returns the canonical constants and the
// VITE_POLL_* override branch is dead-code-eliminated there — production timing
// cannot be shortened by any env var. In dev/test/E2E the windows may be
// shortened via VITE_POLL_* (see pollWindows.js).
const ENV = import.meta.env ?? {};
const WINDOWS = resolvePollWindows({ prod: ENV.PROD === true, env: ENV });

// Bounded, backing-off polling for a TanStack Query `refetchInterval`.
//
// While `isPending(data)` is true it polls fast for an initial window, then
// slower, then STOPS automatically after a bounded total window (so the browser
// never hammers the API forever — an interview can legitimately stay evaluating
// if its evaluation dispatch is blocked/exhausted). When it stops, `stopped`
// flips true so the UI can show reassuring copy + a manual "Check again" action.
//
// `reset()` restarts the window (used by "Check again" alongside a refetch).
export default function useBoundedPoll({
  isPending,
  fast = WINDOWS.fast,
  slow = WINDOWS.slow,
  fastWindowMs = WINDOWS.fastWindowMs,
  maxWindowMs = WINDOWS.maxWindowMs,
}) {
  const startRef = useRef(null); // set after mount (avoids impure render-time Date.now)
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  // Passed straight to useQuery({ refetchInterval }). Returns ms, or false to stop.
  const intervalFn = useCallback(
    (query) => {
      if (!isPending(query.state.data)) return false; // terminal → stop immediately
      const start = startRef.current ?? Date.now();
      const elapsed = Date.now() - start;
      if (elapsed >= maxWindowMs) {
        setStopped((was) => (was ? was : true));
        return false;
      }
      return elapsed < fastWindowMs ? fast : slow;
    },
    [isPending, fast, slow, fastWindowMs, maxWindowMs],
  );

  const reset = useCallback(() => {
    startRef.current = Date.now();
    setStopped(false);
  }, []);

  return { intervalFn, stopped, reset };
}
