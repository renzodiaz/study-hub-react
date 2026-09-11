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

// Ask the backend to create a hosted Stripe Customer Portal Session for the
// current user. Sends NO body — the server resolves customer + return URL. The
// Portal manages/cancels the subscription ON STRIPE; local entitlement only
// changes later via the verified webhook. Returns { url }.
export const createPortalSession = async () => {
  const res = await fetch(`${API_BASE}/api/v1/billing/portal_session`, {
    method: 'POST',
    credentials: 'include',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      body.errors?.join(', ') ?? 'Could not open billing management',
    );
    err.code = body.code; // billing_not_initialized, stripe_unavailable, …
    throw err;
  }
  return body; // { url }
};

// Navigate to Stripe's hosted Customer Portal. Only ever called with a URL our
// authenticated backend returned; the Portal URL is never stored or logged.
export const redirectToPortal = (url) => {
  window.location.assign(url);
};
