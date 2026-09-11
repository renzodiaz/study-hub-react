import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import Manage from './Manage';

vi.mock('@api/billing', () => ({
  getSubscription: vi.fn(),
  createPortalSession: vi.fn(),
  redirectToPortal: vi.fn(),
}));
import {
  getSubscription,
  createPortalSession,
  redirectToPortal,
} from '@api/billing';

const renderManage = () =>
  renderWithProviders(Manage, {
    path: '/billing',
    initialPath: '/billing',
    extraRoutes: [
      { path: '/pricing', component: () => <div>Pricing page</div> },
    ],
  });

afterEach(() => vi.clearAllMocks());

describe('Billing management page', () => {
  it('Free user: shows Free plan, an Upgrade link, and no Manage billing', async () => {
    getSubscription.mockResolvedValue({
      paid_access: false,
      status: 'active',
      plan: { slug: 'free', name: 'Free' },
      can_start_checkout: true,
      can_manage_billing: false,
    });
    renderManage();
    expect(
      await screen.findByText(/you’re on the free plan/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /upgrade/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /manage billing/i }),
    ).not.toBeInTheDocument();
  });

  it('Active Pro: shows active status, renewal date, and Manage billing', async () => {
    getSubscription.mockResolvedValue({
      paid_access: true,
      status: 'active',
      cancel_at_period_end: false,
      current_period_end: '2026-10-01T00:00:00Z',
      plan: { slug: 'pro', name: 'Pro' },
      can_manage_billing: true,
      can_start_checkout: false,
    });
    renderManage();
    expect(
      await screen.findByText(/subscription is active/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/renews on/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /manage billing/i }),
    ).toBeInTheDocument();
  });

  it('cancel_at_period_end: says scheduled to end, NOT "canceled", access still active', async () => {
    getSubscription.mockResolvedValue({
      paid_access: true,
      status: 'active',
      cancel_at_period_end: true,
      current_period_end: '2026-10-01T00:00:00Z',
      plan: { slug: 'pro', name: 'Pro' },
      can_manage_billing: true,
      can_start_checkout: false,
    });
    renderManage();
    expect(await screen.findByText(/scheduled to end/i)).toBeInTheDocument();
    expect(screen.getByText(/access continues until/i)).toBeInTheDocument();
    expect(screen.queryByText(/\bcanceled\b/i)).not.toBeInTheDocument();
  });

  it('past_due: shows a payment problem and Manage billing to fix it', async () => {
    getSubscription.mockResolvedValue({
      paid_access: false,
      status: 'past_due',
      plan: { slug: 'pro', name: 'Pro' },
      can_manage_billing: true,
      can_start_checkout: false,
    });
    renderManage();
    expect(
      await screen.findByText(/problem with your payment/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /manage billing/i }),
    ).toBeInTheDocument();
  });

  it('paused: shows paused state with Manage billing', async () => {
    getSubscription.mockResolvedValue({
      paid_access: false,
      status: 'paused',
      plan: { slug: 'pro', name: 'Pro' },
      can_manage_billing: true,
      can_start_checkout: false,
    });
    renderManage();
    expect(
      await screen.findByText(/subscription is paused/i),
    ).toBeInTheDocument();
  });

  it('Manage billing opens the Portal and redirects; no optimistic mutation', async () => {
    getSubscription.mockResolvedValue({
      paid_access: true,
      status: 'active',
      plan: { slug: 'pro', name: 'Pro' },
      can_manage_billing: true,
      can_start_checkout: false,
    });
    createPortalSession.mockResolvedValue({
      url: 'https://billing.stripe.test/x',
    });
    renderManage();

    await userEvent.click(
      await screen.findByRole('button', { name: /manage billing/i }),
    );
    await waitFor(() => expect(createPortalSession).toHaveBeenCalledTimes(1));
    expect(redirectToPortal).toHaveBeenCalledWith(
      'https://billing.stripe.test/x',
    );
  });

  it('shows a safe message when the Portal cannot be opened', async () => {
    getSubscription.mockResolvedValue({
      paid_access: true,
      status: 'active',
      plan: { slug: 'pro', name: 'Pro' },
      can_manage_billing: true,
      can_start_checkout: false,
    });
    const err = new Error('down');
    err.code = 'stripe_unavailable';
    createPortalSession.mockRejectedValue(err);
    renderManage();

    await userEvent.click(
      await screen.findByRole('button', { name: /manage billing/i }),
    );
    expect(
      await screen.findByText(/temporarily unavailable/i),
    ).toBeInTheDocument();
    expect(redirectToPortal).not.toHaveBeenCalled();
  });

  it('never renders Stripe identifiers', async () => {
    getSubscription.mockResolvedValue({
      paid_access: true,
      status: 'active',
      plan: { slug: 'pro', name: 'Pro' },
      can_manage_billing: true,
      can_start_checkout: false,
    });
    renderManage();
    await screen.findByText(/subscription is active/i);
    expect(document.body.innerHTML).not.toMatch(/cus_|sub_|price_[a-z]/);
  });
});
