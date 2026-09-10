import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Canceled from './Canceled';
import Success from './Success';

// These routes are informational; they must not touch billing state or call the
// billing API. The modules don't import it, so importing the mock and asserting
// no calls documents that contract.
vi.mock('@api/billing', () => ({
  getPlans: vi.fn(),
  getSubscription: vi.fn(),
  createCheckoutSession: vi.fn(),
  redirectToCheckout: vi.fn(),
}));
import { createCheckoutSession, getSubscription } from '@api/billing';

describe('Checkout return pages', () => {
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

  it('success page does NOT claim active access and does not activate anything', async () => {
    renderWithProviders(Success, {
      path: '/billing/success',
      initialPath: '/billing/success',
    });
    expect(await screen.findByText(/payment processing/i)).toBeInTheDocument();
    // Never asserts the subscription is active/paid.
    expect(
      screen.queryByText(/subscription is active/i),
    ).not.toBeInTheDocument();
    expect(createCheckoutSession).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
  });
});
