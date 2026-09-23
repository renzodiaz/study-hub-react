import { useCallback, useState } from 'react';

// Client-side persistence of the desktop sidebar collapse preference (§3.2).
// This is a UI preference only: it never affects authorization, and it is
// deliberately separate from the responsive forced-rail/mobile behaviour (a
// saved "collapsed" desktop preference does not redefine tablet or mobile
// navigation — the shell derives those from breakpoints).
//
// Reads/writes are wrapped in try/catch so a private window, blocked storage or
// a serialization error falls back to "expanded" and never blocks render.

const KEY = 'studyhub.shell.sidebar-collapsed';

const readInitial = () => {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
};

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readInitial);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(KEY, String(next));
      } catch {
        // Preference is best-effort; ignore storage failures.
      }
      return next;
    });
  }, []);

  return [collapsed, toggle];
}
