import { normalize } from '@utils/jsonapi';

// Billing API. Checkout activation is server-authoritative: this client only
// asks the backend to start a hosted Stripe Checkout and then redirects to the
// URL the backend returns. It never sets plan/subscription state locally.
const API_BASE = import.meta.env.VITE_API_URL ?? '';

// Public pricing data (no auth). Never includes Stripe price/product ids.
export const getPlans = async () => {
  const res = await fetch(`${API_BASE}/api/v1/plans`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load plans');
  return normalize(await res.json());
};

// The current user's subscription (or null when they have none). Read-only; the
// source of truth for whether the UI shows "subscribed".
export const getSubscription = async () => {
  const res = await fetch(`${API_BASE}/api/v1/subscription`, {
    credentials: 'include',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load subscription');
  return normalize(await res.json());
};

// Ask the backend to create/reuse a hosted Checkout Session for a plan slug.
// Returns { url }. The body carries ONLY the plan slug — nothing financial.
export const createCheckoutSession = async (plan) => {
  const res = await fetch(`${API_BASE}/api/v1/billing/checkout_session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ plan }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      body.errors?.join(', ') ?? 'Could not start checkout',
    );
    err.code = body.code; // machine-readable (already_subscribed, checkout_in_progress, …)
    throw err;
  }
  return body; // { url }
};

// Navigate to Stripe's hosted Checkout. Only ever called with a URL returned by
// our authenticated backend — never a client-supplied redirect target.
export const redirectToCheckout = (url) => {
  window.location.assign(url);
};
