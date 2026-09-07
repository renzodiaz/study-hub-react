import { useEffect, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ClockIcon, CheckBadgeIcon } from '@heroicons/react/20/solid';

import { getAttempt } from '@api/assessments';

// Display-only countdown. It is seeded from the server's authoritative
// seconds_remaining and only formats a ticking label — it never decides whether
// the attempt is expired. Expiry is whatever the server says on (re)fetch.
const useDisplayCountdown = (expiresAt) => {
  // Tick a local clock and format the remaining time against the server's
  // authoritative expires_at. Only the label moves — the client never decides
  // whether the attempt has actually expired.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
};

const formatClock = (total) => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export default function AttemptShell() {
  const { attemptId } = useParams({ strict: false });

  // Refresh restores everything from the API — no attempt state is persisted
  // client-side.
  const {
    data: attempt,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['assessment-attempt', attemptId],
    queryFn: () => getAttempt(attemptId),
  });

  const remaining = useDisplayCountdown(attempt?.expires_at);

  if (isLoading) {
    return <p className="p-6 text-sm text-gray-500">Loading attempt…</p>;
  }
  if (isError) {
    return (
      <p className="p-6 text-sm text-red-600">
        {error?.message ?? 'Failed to load attempt.'}
      </p>
    );
  }

  const isExpired = attempt.expired || attempt.state === 'expired';

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {attempt.assessment_title}
          </h1>
          <p className="text-sm text-gray-500">
            Attempt #{attempt.attempt_number} · version v{attempt.version_no}
          </p>
        </div>
        {isExpired ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            Expired
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
            <ClockIcon className="size-4" />
            {formatClock(remaining)} left
          </span>
        )}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-gray-500">Started</dt>
          <dd className="text-gray-900">
            {new Date(attempt.started_at).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Expires</dt>
          <dd className="text-gray-900">
            {new Date(attempt.expires_at).toLocaleString()}
          </dd>
        </div>
      </dl>

      <div className="mt-8 rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
        <CheckBadgeIcon className="mx-auto size-10 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-600">
          Your attempt has been created and the clock is running.
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Questions will appear here in the next phase.
        </p>
      </div>
    </div>
  );
}
