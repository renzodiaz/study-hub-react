import { useEffect, useState } from 'react';

// Display-only countdown. Seeded from the server's authoritative `expires_at`,
// it ticks a local clock once a second only to format a label — it NEVER decides
// whether the attempt is actually expired. Business expiry is whatever the
// server says on (re)fetch or on a rejected save; a wrong client clock changes
// the label, never the authority.
export default function useDisplayCountdown(expiresAt) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}
