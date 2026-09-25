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

const Stub = () => <div>stub</div>;

const render = () =>
  renderWithProviders(Manage, {
    path: '/billing',
    initialPath: '/billing',
    extraRoutes: [{ path: '/pricing', component: Stub }],
  });

describe('Billing / Manage', () => {
  it('shows an active subscription with its plan and an Active status', async () => {
    getSubscription.mockResolvedValue({
      status: 'active',
      paid_access: true,
      plan: { slug: 'pro', name: 'Pro' },
      can_manage_billing: true,
      can_start_checkout: false,
      current_period_end: '2026-10-21T00:00:00Z',
    });
    render();

    expect(await screen.findByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(
      screen.getByText(/your subscription is active/i),
    ).toBeInTheDocument();
    // The "credentials stay valid" reassurance is present.
    expect(screen.getByText(/stays valid and verifiable/i)).toBeInTheDocument();
  });

  it('opens the hosted portal when Manage billing is clicked', async () => {
    getSubscription.mockResolvedValue({
      status: 'active',
      paid_access: true,
      plan: { slug: 'pro', name: 'Pro' },
      can_manage_billing: true,
      can_start_checkout: false,
    });
    createPortalSession.mockResolvedValue({
      url: 'https://stripe.test/portal_1',
    });
    render();

    await userEvent.click(
      await screen.findByRole('button', { name: /manage billing/i }),
    );

    await waitFor(() => expect(createPortalSession).toHaveBeenCalled());
    expect(redirectToPortal).toHaveBeenCalledWith(
      'https://stripe.test/portal_1',
    );
  });

  it('offers an Upgrade link to pricing for a Free user', async () => {
    getSubscription.mockResolvedValue({
      status: 'active',
      paid_access: false,
      plan: { slug: 'free', name: 'Free' },
      can_manage_billing: false,
      can_start_checkout: true,
    });
    render();

    const link = await screen.findByRole('link', { name: /upgrade/i });
    expect(link).toHaveAttribute('href', '/pricing');
  });

  it('surfaces a portal error without redirecting', async () => {
    getSubscription.mockResolvedValue({
      status: 'active',
      paid_access: true,
      plan: { slug: 'pro', name: 'Pro' },
      can_manage_billing: true,
      can_start_checkout: false,
    });
    const err = new Error('nope');
    err.code = 'stripe_unavailable';
    createPortalSession.mockRejectedValue(err);
    render();

    await userEvent.click(
      await screen.findByRole('button', { name: /manage billing/i }),
    );

    expect(
      await screen.findByText(/temporarily unavailable/i),
    ).toBeInTheDocument();
    expect(redirectToPortal).not.toHaveBeenCalled();
  });
});
