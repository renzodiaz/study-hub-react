import { ClockIcon } from '@heroicons/react/20/solid';

import StatusPill from '@components/ui/StatusPill';

// Timer (§6.4, §23): displays server-authoritative time remaining (computed from
// the server's expires_at by the caller). The continuously changing display is
// NOT a live region — that would interrupt a screen reader every second. A
// separate polite region carries a milestone message that only changes at 10, 5
// and 1 minute, so it is announced once per threshold (aria-live fires on
// content change) without any per-second chatter. The timer never decides
// expiry; that is the server's authority.
const formatClock = (total) => {
  const safe = Math.max(0, total);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

// Pure milestone message: constant between thresholds, so the polite region only
// changes (and announces) when a threshold is crossed.
const milestone = (seconds) => {
  if (seconds <= 60) return '1 minute remaining';
  if (seconds <= 300) return '5 minutes remaining';
  if (seconds <= 600) return '10 minutes remaining';
  return '';
};

const Timer = ({ secondsRemaining = 0, expired = false }) => {
  if (expired) {
    return <StatusPill status="neutral">Expired</StatusPill>;
  }

  return (
    <>
      <span
        className="inline-flex items-center gap-1 rounded-pill bg-surface-sunken px-3 py-1 font-mono text-body-sm text-ink"
        aria-label={`Time remaining ${formatClock(secondsRemaining)}`}
      >
        <ClockIcon aria-hidden="true" className="size-4 text-ink-muted" />
        {formatClock(secondsRemaining)} left
      </span>
      <span aria-live="polite" className="sr-only">
        {milestone(secondsRemaining)}
      </span>
    </>
  );
};

export default Timer;
