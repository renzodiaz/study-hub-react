import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { LockClosedIcon } from '@heroicons/react/20/solid';

import {
  getSubscription,
  createPortalSession,
  redirectToPortal,
} from '@api/billing';
import { Button, Banner, Card, StatusPill, Spinner } from '@components/ui';

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
// sends. Entitlement itself is `paid_access` (never re-derived here). Returns a
// semantic StatusPill status plus plain-language headline/detail.
function billingState(sub) {
  if (!sub) {
    return {
      status: 'neutral',
      label: 'No plan',
      headline: 'No billing information yet.',
    };
  }

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
      status: 'warning',
      label: 'Ends soon',
      headline: 'Your plan is active and scheduled to end.',
      detail: end
        ? `Access continues until ${end}, then your plan returns to Free.`
        : 'Access continues until the end of your current billing period.',
    };
  }
  if (paid_access) {
    return {
      status: 'success',
      label: 'Active',
      headline: 'Your subscription is active.',
      detail: end ? `Renews on ${end}.` : undefined,
    };
  }
  switch (status) {
    case 'past_due':
    case 'unpaid':
      return {
        status: 'danger',
        label: 'Payment failed',
        headline: 'There’s a problem with your payment.',
        detail:
          'Paid access is paused until the payment is resolved. Use Manage billing to update your payment method.',
      };
    case 'incomplete':
      return {
        status: 'warning',
        label: 'Incomplete',
        headline: 'Your subscription setup is incomplete.',
        detail:
          'Paid access isn’t active yet. Use Manage billing to finish setting up your payment.',
      };
    case 'paused':
      return {
        status: 'warning',
        label: 'Paused',
        headline: 'Your subscription is paused.',
        detail: 'Paid access is unavailable while your plan is paused.',
      };
    default:
      return {
        status: 'neutral',
        label: isPaidPlan ? 'Inactive' : 'Free plan',
        headline: isPaidPlan
          ? 'Your plan is not currently active.'
          : 'You’re on the Free plan.',
        detail:
          'Upgrade any time to unlock paid learning and the credential assessment.',
      };
  }
}

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
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-title font-semibold tracking-tight text-ink">
          Billing
        </h1>
        <div className="mt-8 flex items-center gap-3 text-body text-ink-muted">
          <Spinner /> Loading billing…
        </div>
      </div>
    );
  }

  const state = billingState(subscription);
  const canManage = Boolean(subscription?.can_manage_billing);
  const canCheckout = Boolean(subscription?.can_start_checkout);
  const planName = subscription?.plan?.name ?? 'Free';

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-title font-semibold tracking-tight text-ink">
        Billing
      </h1>

      {errorCode && (
        <Banner variant="warning" className="mt-6">
          {PORTAL_ERROR[errorCode] ?? 'Something went wrong. Please try again.'}
        </Banner>
      )}

      <Card className="mt-6 overflow-hidden">
        <div className="p-6">
          <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
            Current plan
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-credential font-semibold text-ink">
              {planName}
            </span>
            <StatusPill status={state.status}>{state.label}</StatusPill>
          </div>

          <p className="mt-3 text-body text-ink">{state.headline}</p>
          {state.detail && (
            <p className="mt-1 text-body-sm text-ink-secondary">
              {state.detail}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {canCheckout && (
              <Link
                to="/pricing"
                className="inline-flex h-10 items-center justify-center rounded-control bg-primary px-4 text-body font-semibold text-white hover:bg-primary-hover"
              >
                {state.status === 'neutral' && planName === 'Free'
                  ? 'Upgrade'
                  : 'Compare plans'}
              </Link>
            )}
            {canManage && (
              <Button
                variant="secondary"
                onClick={() => {
                  setErrorCode(null);
                  portal.mutate();
                }}
                busy={portal.isPending}
                busyLabel="Opening…"
              >
                Manage billing
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-line bg-surface-raised px-6 py-3">
          <LockClosedIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-ink-muted"
          />
          <p className="text-caption text-ink-secondary">
            Payment details, invoices and receipts are handled in a secure
            billing portal. Study Hub never stores your card.
          </p>
        </div>
      </Card>

      <Card className="mt-5 p-6">
        <p className="text-body-sm font-semibold text-ink">If you cancel</p>
        <p className="mt-1 text-body-sm text-ink-secondary">
          Your plan runs to the end of the period you have paid for. After that,
          enrolled learning content closes, but{' '}
          <strong className="font-semibold text-ink">
            every credential you have already earned stays valid and verifiable
          </strong>
          , and your progress is kept if you come back.
        </p>
      </Card>
    </div>
  );
}
