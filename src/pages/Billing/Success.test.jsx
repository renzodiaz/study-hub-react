import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Success from './Success';

vi.mock('@api/billing', () => ({ getSubscription: vi.fn() }));
import { getSubscription } from '@api/billing';

const render = () =>
  renderWithProviders(Success, {
    path: '/billing/success',
    initialPath: '/billing/success',
  });

describe('Billing / Success', () => {
  it('confirms activation only when the server reports paid access', async () => {
    getSubscription.mockResolvedValue({ paid_access: true, status: 'active' });
    render();
    expect(await screen.findByText(/you’re all set/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue/i })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('directs to Manage billing on a terminal payment problem', async () => {
    getSubscription.mockResolvedValue({
      paid_access: false,
      status: 'past_due',
    });
    render();
    expect(
      await screen.findByText(/problem with your payment/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /manage billing/i }),
    ).toHaveAttribute('href', '/billing');
  });

  it('shows a processing state while activation is pending (never claims success)', async () => {
    getSubscription.mockResolvedValue({ paid_access: false, status: 'active' });
    render();
    expect(await screen.findByText(/payment processing/i)).toBeInTheDocument();
    expect(screen.queryByText(/you’re all set/i)).not.toBeInTheDocument();
  });
});
