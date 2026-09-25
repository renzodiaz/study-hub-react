import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid';

import { getSubscription } from '@api/billing';
import { Card, Spinner } from '@components/ui';

// Post-Checkout landing page. Activation is server-authoritative: the Stripe
// webhook syncs the local Subscription, and this page ONLY polls our own
// read-only subscription endpoint to observe that. It never reads Stripe, never
// infers success from query params, and never mutates cache/plan state.
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

// Live Stripe-backed statuses that will NOT resolve into paid access on their
// own — polling should stop and the user should be sent to Manage billing.
const PROBLEM_STATUSES = ['past_due', 'incomplete', 'unpaid', 'paused'];

const isProblem = (sub) =>
  Boolean(sub) && !sub.paid_access && PROBLEM_STATUSES.includes(sub.status);

const primaryLink =
  'inline-flex h-10 items-center justify-center rounded-control bg-primary px-5 text-body font-semibold text-white hover:bg-primary-hover';
const secondaryLink =
  'inline-flex h-10 items-center justify-center rounded-control border border-line-strong bg-surface px-5 text-body font-semibold text-ink hover:bg-primary-wash';

function Shell({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-sunken px-4 py-12">
      <Card className="w-full max-w-md p-8 text-center">{children}</Card>
    </div>
  );
}

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
  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), POLL_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);

  if (paidAccess) {
    return (
      <Shell>
        <CheckCircleIcon
          aria-hidden="true"
          className="mx-auto size-10 text-success"
        />
        <h1 className="mt-4 text-section font-semibold text-ink">
          You’re all set
        </h1>
        <p className="mt-2 text-body-sm text-ink-secondary">
          Your subscription is active. Paid learning and the credential
          assessment are now unlocked.
        </p>
        <a href="/" className={`${primaryLink} mt-6`}>
          Continue
        </a>
      </Shell>
    );
  }

  if (billingProblem) {
    return (
      <Shell>
        <ExclamationTriangleIcon
          aria-hidden="true"
          className="mx-auto size-10 text-danger"
        />
        <h1 className="mt-4 text-section font-semibold text-ink">
          There’s a problem with your payment
        </h1>
        <p className="mt-2 text-body-sm text-ink-secondary">
          Your subscription didn’t activate. You can review and fix your billing
          details to finish setting up your plan.
        </p>
        <a href="/billing" className={`${primaryLink} mt-6`}>
          Manage billing
        </a>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex justify-center" aria-hidden="true">
        <Spinner size="lg" />
      </div>
      <h1 className="mt-4 text-section font-semibold text-ink">
        Payment processing
      </h1>
      <p className="mt-2 text-body-sm text-ink-secondary" role="status">
        {timedOut
          ? 'Your payment is still being confirmed. This can take a little longer ' +
            'than usual — your subscription will activate automatically once it ' +
            'completes.'
          : 'Your subscription will be activated after your payment is confirmed. ' +
            'This can take a few moments.'}
      </p>
      <a href="/" className={`${secondaryLink} mt-6`}>
        Continue
      </a>
    </Shell>
  );
}
