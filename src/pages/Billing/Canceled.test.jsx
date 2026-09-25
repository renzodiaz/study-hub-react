import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Canceled from './Canceled';

describe('Billing / Canceled', () => {
  it('states no charge was made and links back to pricing (no API call)', async () => {
    renderWithProviders(Canceled, {
      path: '/billing/canceled',
      initialPath: '/billing/canceled',
    });

    expect(await screen.findByText(/checkout canceled/i)).toBeInTheDocument();
    expect(screen.getByText(/no charge was made/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /back to pricing/i }),
    ).toHaveAttribute('href', '/pricing');
    // Neutral: never implies payment failed or the subscription changed.
    expect(
      screen.queryByText(/failed|canceled your subscription/i),
    ).not.toBeInTheDocument();
  });
});
