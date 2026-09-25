import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CheckCircleIcon,
  ClockIcon,
  MinusCircleIcon,
} from '@heroicons/react/20/solid';

import {
  getPlans,
  getSubscription,
  createCheckoutSession,
  redirectToCheckout,
  createPortalSession,
  redirectToPortal,
} from '@api/billing';
import { useAuth } from '@hooks/useAuth';
import { Button, Banner, Card, StatusPill, Spinner } from '@components/ui';

const PURCHASABLE = ['pro', 'advanced'];

// Human copy for backend refusal codes. The server stays authoritative; this
// only renders what it decided.
const ERROR_MESSAGE = {
  already_subscribed: 'You already have an active subscription.',
  billing_already_exists:
    'You have an existing subscription. Use Manage billing to change it.',
  checkout_in_progress:
    'A checkout is already in progress. Finish or cancel it, then try again.',
  stripe_unavailable: 'Payments are temporarily unavailable. Please try again.',
  billing_not_initialized: 'You don’t have a billing account yet.',
  configuration_error: 'Billing is temporarily unavailable. Please try again.',
};

// Presentation copy from the approved Pricing handoff. Feature meaning is NOT a
// server-owned entitlement source (the API returns only name/price/interval), so
// the bullet lists live here — with an honest maturity marker so nothing implies
// functionality that does not exist yet:
//   confirmed — exists in the product today
//   decided   — approved product decision, not yet built
//   proposed  — still needs a product decision (never presented as available)
const PLAN_COPY = {
  free: {
    tagline: 'Look around before committing. No credential path.',
    features: [
      { label: 'Account and profile', status: 'confirmed' },
      { label: 'Explore every published career', status: 'confirmed' },
      {
        label: 'Open any public credential verification page',
        status: 'confirmed',
      },
      {
        label: 'Free preview lessons, designated per course',
        status: 'confirmed',
      },
    ],
  },
  pro: {
    tagline: 'The complete credential path, end to end.',
    inheritsFrom: 'Everything in Free, plus',
    features: [
      { label: 'Enrol in careers and open every lesson', status: 'confirmed' },
      {
        label: 'Progress tracking and course assessments',
        status: 'confirmed',
      },
      {
        label: 'Course Certificates, with public verification',
        status: 'confirmed',
      },
      { label: 'One Final Qualification attempt', status: 'decided' },
      { label: 'The full Seniority Badge on passing', status: 'decided' },
    ],
    note: {
      tone: 'primary',
      text: 'You can earn the credential entirely on Pro. Advanced is for preparation and extra attempts, not for the badge itself.',
    },
  },
  advanced: {
    tagline:
      'More preparation and more room to retry, for learners who want both.',
    inheritsFrom: 'Everything in Pro, plus',
    features: [
      {
        label: 'Self-serve mock interview practice, with feedback',
        status: 'proposed',
      },
      {
        label: 'Additional Final Qualification attempts — count to be decided',
        status: 'proposed',
      },
      {
        label: 'Further validation capability — to be approved',
        status: 'unconfirmed',
      },
    ],
    note: {
      tone: 'neutral',
      text: 'Advanced does not change the credential. Mock practice is preparation only — it is never recorded as evidence and failing it has no consequence.',
    },
  },
};

const STATUS_MARK = {
  confirmed: { Icon: CheckCircleIcon, tint: 'text-success' },
  decided: { Icon: CheckCircleIcon, tint: 'text-primary' },
  proposed: { Icon: ClockIcon, tint: 'text-warning' },
  unconfirmed: { Icon: MinusCircleIcon, tint: 'text-ink-muted' },
};

const formatPrice = (cents, currency) =>
  cents === 0
    ? '$0'
    : new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: (currency ?? 'usd').toUpperCase(),
        minimumFractionDigits: 0,
      }).format(cents / 100);

function FeatureRow({ feature }) {
  const mark = STATUS_MARK[feature.status] ?? STATUS_MARK.confirmed;
  const muted =
    feature.status === 'proposed' || feature.status === 'unconfirmed';
  return (
    <li className="flex items-start gap-2.5">
      <mark.Icon
        aria-hidden="true"
        className={`mt-0.5 size-4 shrink-0 ${mark.tint}`}
      />
      <span
        className={`text-body-sm ${muted ? 'text-ink-secondary' : 'text-ink'}`}
      >
        {feature.label}
        {feature.status === 'decided' && (
          <StatusPill status="info" className="ml-2 align-middle">
            Decided
          </StatusPill>
        )}
        {feature.status === 'proposed' && (
          <StatusPill status="warning" className="ml-2 align-middle">
            Proposed
          </StatusPill>
        )}
      </span>
    </li>
  );
}

export default function Pricing() {
  const { user } = useAuth();
  const [errorCode, setErrorCode] = useState(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
  });

  // Only fetched when logged in — determines whether the user is already paid.
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    enabled: Boolean(user),
  });

  // Authoritative backend flags — the frontend never derives billing policy.
  const paidAccess = Boolean(subscription?.paid_access);
  const canStartCheckout = Boolean(subscription?.can_start_checkout);
  const canManageBilling = Boolean(subscription?.can_manage_billing);
  const currentSlug = subscription?.plan?.slug ?? (user ? 'free' : null);

  const checkout = useMutation({
    mutationFn: (slug) => createCheckoutSession(slug),
    onSuccess: (data) => redirectToCheckout(data.url),
    onError: (err) => setErrorCode(err?.code ?? 'error'),
  });

  const portal = useMutation({
    mutationFn: createPortalSession,
    onSuccess: (data) => redirectToPortal(data.url),
    onError: (err) => setErrorCode(err?.code ?? 'stripe_unavailable'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 p-12 text-body text-ink-muted">
        <Spinner /> Loading plans…
      </div>
    );
  }

  const subscribe = (slug) => {
    setErrorCode(null);
    checkout.mutate(slug);
  };

  const manageBilling = () => {
    setErrorCode(null);
    portal.mutate();
  };

  // A logged-in user who cannot start a fresh Checkout (already paid, or a live
  // Stripe-backed non-granting state) is directed to Manage billing instead.
  const showManageInsteadOfCheckout =
    Boolean(user) && !canStartCheckout && canManageBilling;

  // Emphasise the user's current paid plan, otherwise Pro as the credential path.
  const emphasisSlug = paidAccess && currentSlug ? currentSlug : 'pro';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title font-semibold tracking-tight text-ink">
            Plans
          </h1>
          <p className="mt-2 max-w-prose text-body text-ink-secondary">
            Billed monthly, cancels at the end of the period. Credentials you
            have already earned stay valid and verifiable if you cancel.
          </p>
        </div>
        <dl className="flex flex-col gap-1.5 text-caption text-ink-secondary">
          <div className="flex items-center gap-2">
            <CheckCircleIcon
              aria-hidden="true"
              className="size-4 text-success"
            />
            <span>
              <strong className="font-semibold text-ink">Confirmed</strong> — in
              the product today
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon
              aria-hidden="true"
              className="size-4 text-primary"
            />
            <span>
              <strong className="font-semibold text-ink">Decided</strong> —
              approved, not yet built
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon aria-hidden="true" className="size-4 text-warning" />
            <span>
              <strong className="font-semibold text-ink">Proposed</strong> —
              needs a product decision
            </span>
          </div>
        </dl>
      </header>

      {errorCode && (
        <Banner variant="warning" className="mt-6">
          {ERROR_MESSAGE[errorCode] ??
            'Something went wrong. Please try again.'}
        </Banner>
      )}

      {showManageInsteadOfCheckout && (
        <Banner
          variant="info"
          className="mt-6"
          title={
            paidAccess
              ? 'You already have an active subscription.'
              : 'You have an existing billing account.'
          }
          action={
            <Button
              size="sm"
              onClick={manageBilling}
              busy={portal.isPending}
              busyLabel="Opening…"
            >
              Manage billing
            </Button>
          }
        >
          Change your plan, update payment, or cancel from Manage billing.
        </Banner>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const copy = PLAN_COPY[plan.slug] ?? { features: [] };
          const purchasable = PURCHASABLE.includes(plan.slug);
          const isCurrent = currentSlug === plan.slug;
          const emphasised = emphasisSlug === plan.slug;

          return (
            <Card
              key={plan.slug}
              as="section"
              className={`relative flex flex-col p-6 ${
                emphasised ? 'border-2 border-primary' : ''
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-6 inline-flex items-center rounded-pill bg-primary px-2.5 py-0.5 text-eyebrow font-semibold uppercase tracking-wide text-white">
                  Your plan
                </span>
              )}

              <h2 className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
                {plan.name}
              </h2>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="text-title font-semibold tracking-tight text-ink">
                  {formatPrice(plan.price_cents, plan.currency)}
                </span>
                {plan.price_cents > 0 && plan.interval && (
                  <span className="text-body-sm text-ink-muted">
                    per {plan.interval}
                  </span>
                )}
              </p>
              {copy.tagline && (
                <p className="mt-2 text-body-sm text-ink-secondary">
                  {copy.tagline}
                </p>
              )}

              <ul className="mt-5 flex flex-col gap-2.5">
                {copy.inheritsFrom && (
                  <li className="text-body-sm font-semibold text-ink-muted">
                    {copy.inheritsFrom}
                  </li>
                )}
                {copy.features.map((f) => (
                  <FeatureRow key={f.label} feature={f} />
                ))}
              </ul>

              {copy.note && (
                <div
                  className={`mt-5 rounded-control p-3 text-caption ${
                    copy.note.tone === 'primary'
                      ? 'bg-primary-tint text-primary-deep'
                      : 'bg-surface-sunken text-ink-secondary'
                  }`}
                >
                  {copy.note.text}
                </div>
              )}

              <div className="mt-6 grow" />

              {/* CTA — behaviour is unchanged and driven by the backend flags. */}
              <div className="mt-4">
                {!purchasable ? (
                  <p className="rounded-control bg-surface-sunken px-4 py-2 text-center text-body-sm font-medium text-ink-secondary">
                    {isCurrent ? 'Your current plan' : plan.name}
                  </p>
                ) : !user ? (
                  <a
                    href="/login"
                    className="inline-flex h-10 w-full items-center justify-center rounded-control bg-primary px-4 text-body font-semibold text-white hover:bg-primary-hover"
                  >
                    Log in to subscribe
                  </a>
                ) : isCurrent && paidAccess ? (
                  <Button variant="secondary" fullWidth disabled>
                    Current plan
                  </Button>
                ) : canStartCheckout ? (
                  <Button
                    fullWidth
                    onClick={() => subscribe(plan.slug)}
                    busy={checkout.isPending}
                    busyLabel="Starting…"
                  >
                    Subscribe to {plan.name}
                  </Button>
                ) : (
                  <p className="rounded-control bg-surface-sunken px-4 py-2 text-center text-body-sm font-medium text-ink-secondary">
                    {paidAccess ? 'Included in your plan' : 'Unavailable'}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card variant="accented" accent="bronze" className="mt-6 p-5">
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:gap-8">
          <div>
            <p className="text-body-sm font-semibold text-ink">
              One credential, not one per plan
            </p>
            <p className="mt-1 text-body-sm text-ink-secondary">
              The Seniority Badge is earned from demonstrated competency. A
              learner who passes on Pro holds exactly the same credential, with
              the same evidence and the same verification page, as one who
              passes on Advanced. There is no “Pro badge”.
            </p>
          </div>
          <div className="sm:max-w-xs sm:border-l sm:border-line sm:pl-8">
            <p className="text-body-sm font-semibold text-ink">
              Not plan features
            </p>
            <p className="mt-1 text-body-sm text-ink-secondary">
              Preview access and Pilot Assessments are granted per learner, not
              bought, and never appear in this comparison.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
