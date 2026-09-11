import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import Pricing from './Pricing';

vi.mock('@api/billing', () => ({
  getPlans: vi.fn(),
  getSubscription: vi.fn(),
  createCheckoutSession: vi.fn(),
  redirectToCheckout: vi.fn(),
  createPortalSession: vi.fn(),
  redirectToPortal: vi.fn(),
}));
vi.mock('@hooks/useAuth', () => ({ useAuth: vi.fn() }));

import {
  getPlans,
  getSubscription,
  createCheckoutSession,
  redirectToCheckout,
  createPortalSession,
  redirectToPortal,
} from '@api/billing';
import { useAuth } from '@hooks/useAuth';

// A logged-in user always has a current subscription; a clean Free one permits
// checkout. Tests override this for paid / problem / history states.
const cleanFreeSub = {
  paid_access: false,
  status: 'active',
  plan: { slug: 'free', name: 'Free' },
  can_start_checkout: true,
  can_manage_billing: false,
};

const PLANS = [
  {
    id: 'p0',
    slug: 'free',
    name: 'Free',
    price_cents: 0,
    currency: 'usd',
    interval: null,
  },
  {
    id: 'p1',
    slug: 'pro',
    name: 'Pro',
    price_cents: 2900,
    currency: 'usd',
    interval: 'month',
  },
  {
    id: 'p2',
    slug: 'advanced',
    name: 'Advanced',
    price_cents: 9900,
    currency: 'usd',
    interval: 'month',
  },
];

const renderPricing = () =>
  renderWithProviders(Pricing, { path: '/pricing', initialPath: '/pricing' });

beforeEach(() => {
  getPlans.mockResolvedValue(PLANS);
  getSubscription.mockResolvedValue(cleanFreeSub);
  useAuth.mockReturnValue({ user: { id: 'u1' }, isLoading: false });
});

describe('Pricing', () => {
  it('renders plans and prices from the API', async () => {
    renderPricing();
    expect(await screen.findByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('$29')).toBeInTheDocument();
    expect(screen.getByText('$99')).toBeInTheDocument();
    // No Stripe price/product ids ever appear.
    expect(document.body.innerHTML).not.toMatch(/price_[a-z]|stripe_price_id/);
  });

  it('shows a login CTA for logged-out visitors (no checkout call)', async () => {
    useAuth.mockReturnValue({ user: null, isLoading: false });
    renderPricing();
    const cta = await screen.findAllByRole('link', {
      name: /log in to subscribe/i,
    });
    expect(cta.length).toBeGreaterThan(0);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it('a Free user subscribing to Pro sends { plan: "pro" } and redirects to the returned URL', async () => {
    createCheckoutSession.mockResolvedValue({
      url: 'https://stripe.test/cs_1',
    });
    renderPricing();

    await userEvent.click(
      await screen.findByRole('button', { name: /subscribe to pro/i }),
    );

    await waitFor(() =>
      expect(createCheckoutSession).toHaveBeenCalledWith('pro'),
    );
    expect(redirectToCheckout).toHaveBeenCalledWith('https://stripe.test/cs_1');
  });

  it('subscribing to Advanced sends { plan: "advanced" }', async () => {
    createCheckoutSession.mockResolvedValue({
      url: 'https://stripe.test/cs_2',
    });
    renderPricing();
    await userEvent.click(
      await screen.findByRole('button', { name: /subscribe to advanced/i }),
    );
    await waitFor(() =>
      expect(createCheckoutSession).toHaveBeenCalledWith('advanced'),
    );
  });

  it('shows a safe message when the backend reports checkout_in_progress', async () => {
    const err = new Error('in progress');
    err.code = 'checkout_in_progress';
    createCheckoutSession.mockRejectedValue(err);
    renderPricing();

    await userEvent.click(
      await screen.findByRole('button', { name: /subscribe to pro/i }),
    );
    expect(
      await screen.findByText(/checkout is already in progress/i),
    ).toBeInTheDocument();
    expect(redirectToCheckout).not.toHaveBeenCalled();
  });

  it('offers Manage billing (not checkout) to an already-subscribed user', async () => {
    getSubscription.mockResolvedValue({
      paid_access: true,
      status: 'active',
      plan: { slug: 'pro', name: 'Pro' },
      can_start_checkout: false,
      can_manage_billing: true,
    });
    createPortalSession.mockResolvedValue({
      url: 'https://billing.stripe.test/p1',
    });
    renderPricing();
    await screen.findByText('Pro');

    expect(
      screen.queryByRole('button', { name: /subscribe to/i }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole('button', { name: /manage billing/i }),
    );
    await waitFor(() => expect(createPortalSession).toHaveBeenCalled());
    expect(redirectToPortal).toHaveBeenCalledWith(
      'https://billing.stripe.test/p1',
    );
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it('a Stripe-backed non-granting user gets Manage billing, never checkout', async () => {
    getSubscription.mockResolvedValue({
      paid_access: false,
      status: 'past_due',
      plan: { slug: 'pro', name: 'Pro' },
      can_start_checkout: false,
      can_manage_billing: true,
    });
    renderPricing();
    await screen.findByText('Pro');
    expect(
      screen.queryByRole('button', { name: /subscribe to/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /manage billing/i }),
    ).toBeInTheDocument();
  });

  it('allows re-subscription (checkout) for a Free user with billing history', async () => {
    getSubscription.mockResolvedValue({
      paid_access: false,
      status: 'active',
      plan: { slug: 'free', name: 'Free' },
      can_start_checkout: true,
      can_manage_billing: true, // has a Stripe customer from prior billing
    });
    createCheckoutSession.mockResolvedValue({
      url: 'https://stripe.test/cs_re',
    });
    renderPricing();

    await userEvent.click(
      await screen.findByRole('button', { name: /subscribe to pro/i }),
    );
    await waitFor(() =>
      expect(createCheckoutSession).toHaveBeenCalledWith('pro'),
    );
  });

  it('never renders Stripe identifiers', async () => {
    getSubscription.mockResolvedValue({
      paid_access: true,
      status: 'active',
      plan: { slug: 'pro', name: 'Pro' },
      can_start_checkout: false,
      can_manage_billing: true,
    });
    renderPricing();
    await screen.findByText('Pro');
    expect(document.body.innerHTML).not.toMatch(/cus_|sub_|price_[a-z]/);
  });
});
