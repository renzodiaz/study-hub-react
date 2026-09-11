import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getSubscription } from '@api/billing';

// Post-Checkout landing page. Activation is server-authoritative: the Stripe
// webhook (PR-3) syncs the local Subscription, and this page ONLY polls our own
// read-only subscription endpoint to observe that. It never reads Stripe, never
// infers success from query params, and never mutates cache/plan state.
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

// Live Stripe-backed statuses that will NOT resolve into paid access on their
// own — polling should stop and the user should be sent to Manage billing.
const PROBLEM_STATUSES = ['past_due', 'incomplete', 'unpaid', 'paused'];

const isProblem = (sub) =>
  Boolean(sub) && !sub.paid_access && PROBLEM_STATUSES.includes(sub.status);

export default function Success() {
  const [timedOut, setTimedOut] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    // Poll until access is granted OR a terminal billing problem is observed.
    refetchInterval: (query) => {
      const sub = query.state.data;
      return sub?.paid_access || isProblem(sub) ? false : POLL_INTERVAL_MS;
    },
  });

  const paidAccess = Boolean(subscription?.paid_access);
  const billingProblem = isProblem(subscription);

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

  if (billingProblem) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-bold text-gray-900">
          There&rsquo;s a problem with your payment
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Your subscription didn&rsquo;t activate. You can review and fix your
          billing details to finish setting up your plan.
        </p>
        <a
          href="/billing"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Manage billing
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
