import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Canceled from './Canceled';
import Success from './Success';

vi.mock('@api/billing', () => ({
  getPlans: vi.fn(),
  getSubscription: vi.fn(),
  createCheckoutSession: vi.fn(),
  redirectToCheckout: vi.fn(),
}));
import {
  createCheckoutSession,
  getSubscription,
  redirectToCheckout,
} from '@api/billing';

const freeSub = {
  paid_access: false,
  status: 'active',
  plan: { slug: 'free' },
};
const paidSub = { paid_access: true, status: 'active', plan: { slug: 'pro' } };

describe('Checkout return pages', () => {
  afterEach(() => vi.clearAllMocks());

  it('canceled page renders without any billing mutation/API call', async () => {
    renderWithProviders(Canceled, {
      path: '/billing/canceled',
      initialPath: '/billing/canceled',
    });
    expect(await screen.findByText(/checkout canceled/i)).toBeInTheDocument();
    expect(screen.getByText(/no charge was made/i)).toBeInTheDocument();
    expect(createCheckoutSession).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
  });

  it('success page shows "processing" while access is not yet granted', async () => {
    getSubscription.mockResolvedValue(freeSub);
    renderWithProviders(Success, {
      path: '/billing/success',
      initialPath: '/billing/success',
    });

    expect(await screen.findByText(/payment processing/i)).toBeInTheDocument();
    // It polls the LOCAL subscription endpoint — never mutates or hits Stripe.
    await waitFor(() => expect(getSubscription).toHaveBeenCalled());
    expect(
      screen.queryByText(/subscription is active/i),
    ).not.toBeInTheDocument();
    expect(createCheckoutSession).not.toHaveBeenCalled();
    expect(redirectToCheckout).not.toHaveBeenCalled();
  });

  it('success page shows activation once local paid_access flips true', async () => {
    getSubscription.mockResolvedValue(paidSub);
    renderWithProviders(Success, {
      path: '/billing/success',
      initialPath: '/billing/success',
    });

    expect(
      await screen.findByText(/subscription is active/i),
    ).toBeInTheDocument();
    expect(createCheckoutSession).not.toHaveBeenCalled();
    expect(redirectToCheckout).not.toHaveBeenCalled();
  });
});
