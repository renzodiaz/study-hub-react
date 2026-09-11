import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import {
  getSubscription,
  createPortalSession,
  redirectToPortal,
} from '@api/billing';
import ContentHeading from '@layouts/partials/ContentHeading';

// Human copy for backend portal refusal codes. The server stays authoritative.
const PORTAL_ERROR = {
  billing_not_initialized:
    'You don’t have a billing account yet. Choose a plan to get started.',
  billing_identity_conflict:
    'We found an issue with your billing account. Please contact support.',
  configuration_error: 'Billing management is temporarily unavailable.',
  stripe_unavailable:
    'Billing management is temporarily unavailable. Please try again.',
};

const formatDate = (iso) =>
  iso
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
        new Date(iso),
      )
    : null;

// Presentation only — derived from the AUTHORITATIVE flags/status the backend
// sends. Entitlement itself is `paid_access` (never re-derived here).
function billingState(sub) {
  if (!sub) return { tone: 'neutral', headline: 'No billing information yet.' };

  const {
    status,
    paid_access,
    cancel_at_period_end,
    current_period_end,
    plan,
  } = sub;
  const end = formatDate(current_period_end);
  const isPaidPlan = plan?.slug && plan.slug !== 'free';

  if (paid_access && cancel_at_period_end) {
    return {
      tone: 'warn',
      headline: 'Your plan is active and scheduled to end.',
      detail: end
        ? `Access continues until ${end}, then your plan returns to Free.`
        : 'Access continues until the end of your current billing period.',
    };
  }
  if (paid_access) {
    return {
      tone: 'ok',
      headline: 'Your subscription is active.',
      detail: end ? `Renews on ${end}.` : undefined,
    };
  }
  // Non-granting states.
  switch (status) {
    case 'past_due':
    case 'unpaid':
      return {
        tone: 'error',
        headline: 'There’s a problem with your payment.',
        detail:
          'Paid access is paused until the payment is resolved. Use Manage billing to update your payment method.',
      };
    case 'incomplete':
      return {
        tone: 'warn',
        headline: 'Your subscription setup is incomplete.',
        detail:
          'Paid access isn’t active yet. Use Manage billing to finish setting up your payment.',
      };
    case 'paused':
      return {
        tone: 'warn',
        headline: 'Your subscription is paused.',
        detail: 'Paid access is unavailable while your plan is paused.',
      };
    default:
      // Free (including a formerly-paid user now back on Free).
      return {
        tone: 'neutral',
        headline: isPaidPlan
          ? 'Your plan is not currently active.'
          : 'You’re on the Free plan.',
        detail:
          'Upgrade any time to unlock paid learning and the credential assessment.',
      };
  }
}

const TONE_CLASS = {
  ok: 'bg-green-50 text-green-800',
  warn: 'bg-amber-50 text-amber-800',
  error: 'bg-red-50 text-red-800',
  neutral: 'bg-gray-50 text-gray-700',
};

export default function Manage() {
  const [errorCode, setErrorCode] = useState(null);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    // On returning from the hosted Portal the webhook may not have landed yet —
    // refetch on window focus so local state converges. Never optimistic.
    refetchOnWindowFocus: true,
  });

  const portal = useMutation({
    mutationFn: createPortalSession,
    onSuccess: (data) => redirectToPortal(data.url),
    onError: (err) => setErrorCode(err?.code ?? 'stripe_unavailable'),
  });

  if (isLoading) {
    return (
      <>
        <ContentHeading title="Billing" />
        <p className="p-6 text-sm text-gray-500">Loading billing…</p>
      </>
    );
  }

  const state = billingState(subscription);
  const canManage = Boolean(subscription?.can_manage_billing);
  const canCheckout = Boolean(subscription?.can_start_checkout);
  const planName = subscription?.plan?.name ?? 'Free';

  return (
    <>
      <ContentHeading title="Billing" />
      <div className="mx-auto max-w-2xl">
        {errorCode && (
          <div className="mb-6 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
            {PORTAL_ERROR[errorCode] ??
              'Something went wrong. Please try again.'}
          </div>
        )}

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Current plan
            </h2>
            <span className="text-lg font-bold text-gray-900">{planName}</span>
          </div>

          <div
            className={`mt-4 rounded-lg p-3 text-sm ${TONE_CLASS[state.tone]}`}
          >
            <p className="font-medium">{state.headline}</p>
            {state.detail && <p className="mt-1">{state.detail}</p>}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {canCheckout && (
              <Link
                to="/pricing"
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                {state.tone === 'neutral' && planName === 'Free'
                  ? 'Upgrade'
                  : 'Choose a plan'}
              </Link>
            )}
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setErrorCode(null);
                  portal.mutate();
                }}
                disabled={portal.isPending}
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {portal.isPending ? 'Opening…' : 'Manage billing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
