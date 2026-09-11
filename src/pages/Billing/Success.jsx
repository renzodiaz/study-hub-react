import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getSubscription } from '@api/billing';

// Post-Checkout landing page. Activation is server-authoritative: the Stripe
// webhook (PR-3) syncs the local Subscription, and this page ONLY polls our own
// read-only subscription endpoint to observe that. It never reads Stripe, never
// infers success from query params, and never mutates cache/plan state.
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

export default function Success() {
  const [timedOut, setTimedOut] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    // Poll only until the authoritative paid_access flag flips, then stop.
    refetchInterval: (query) =>
      query.state.data?.paid_access ? false : POLL_INTERVAL_MS,
  });

  const paidAccess = Boolean(subscription?.paid_access);

  // Soften the copy after the timeout window; the webhook may simply be slow.
  // Runs once on mount — polling itself continues regardless.
  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), POLL_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);

  if (paidAccess) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-bold text-gray-900">
          You&rsquo;re all set
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Your subscription is active. Paid learning and the credential
          assessment are now unlocked.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Continue
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-8 text-center">
      <h1 className="text-xl font-bold text-gray-900">Payment processing</h1>
      <p className="mt-2 text-sm text-gray-600">
        {timedOut
          ? 'Your payment is still being confirmed. This can take a little ' +
            'longer than usual — your subscription will activate automatically ' +
            'once it completes.'
          : 'Your subscription will be activated after your payment is ' +
            'confirmed. This can take a few moments.'}
      </p>
      <a
        href="/"
        className="mt-6 inline-block rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Continue
      </a>
    </div>
  );
}
