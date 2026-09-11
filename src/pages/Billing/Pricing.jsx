import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckIcon } from '@heroicons/react/20/solid';

import {
  getPlans,
  getSubscription,
  createCheckoutSession,
  redirectToCheckout,
} from '@api/billing';
import { useAuth } from '@hooks/useAuth';

const PURCHASABLE = ['pro', 'advanced'];

// Human copy for backend refusal codes. The server stays authoritative; this
// only renders what it decided.
const ERROR_MESSAGE = {
  already_subscribed: 'You already have an active subscription.',
  billing_already_exists:
    'You have an existing subscription that needs management — coming soon.',
  checkout_in_progress:
    'A checkout is already in progress. Finish or cancel it, then try again.',
  stripe_unavailable: 'Payments are temporarily unavailable. Please try again.',
};

const formatPrice = (cents, currency) =>
  cents === 0
    ? 'Free'
    : new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: (currency ?? 'usd').toUpperCase(),
        minimumFractionDigits: 0,
      }).format(cents / 100);

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

  // Authoritative flag from the backend — the frontend never derives entitlement.
  const paidAccess = Boolean(subscription?.paid_access);

  const checkout = useMutation({
    mutationFn: (slug) => createCheckoutSession(slug),
    onSuccess: (data) => redirectToCheckout(data.url),
    onError: (err) => setErrorCode(err?.code ?? 'error'),
  });

  if (isLoading) {
    return <p className="p-6 text-sm text-gray-500">Loading plans…</p>;
  }

  const subscribe = (slug) => {
    setErrorCode(null);
    checkout.mutate(slug);
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold text-gray-900">Plans &amp; pricing</h1>
      <p className="mt-1 text-sm text-gray-500">
        Full paid learning and the credential assessment require a paid plan.
      </p>

      {errorCode && (
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          {ERROR_MESSAGE[errorCode] ??
            'Something went wrong. Please try again.'}
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => {
          const purchasable = PURCHASABLE.includes(plan.slug);
          const isCurrentFree = plan.slug === 'free' && !paidAccess;
          return (
            <div
              key={plan.slug}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {plan.name}
              </h2>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatPrice(plan.price_cents, plan.currency)}
                {plan.price_cents > 0 && plan.interval && (
                  <span className="text-sm font-normal text-gray-500">
                    {' '}
                    /{plan.interval}
                  </span>
                )}
              </p>

              <div className="mt-6 grow" />

              {/* CTA */}
              {!purchasable ? (
                <span className="rounded-lg bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-600">
                  {isCurrentFree ? 'Your current plan' : plan.name}
                </span>
              ) : !user ? (
                <a
                  href="/login"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Log in to subscribe
                </a>
              ) : paidAccess ? (
                <span className="rounded-lg bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-600">
                  Manage billing coming soon
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => subscribe(plan.slug)}
                  disabled={checkout.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  <CheckIcon className="size-4" />
                  {checkout.isPending
                    ? 'Starting…'
                    : `Subscribe to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
