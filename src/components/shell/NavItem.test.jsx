import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import { DESTINATIONS } from './destinations';
import NavItem from './NavItem';

const home = DESTINATIONS[0]; // Home → "/"
const learning = DESTINATIONS[1]; // My Learning → "/my-learning"

describe('NavItem', () => {
  it('keeps its accessible name in collapsed/rail mode (icon-only visually)', async () => {
    const Harness = () => (
      <NavItem destination={home} variant="sidebar" active collapsed />
    );
    renderWithProviders(Harness, { path: '/', initialPath: '/' });
    // The label is visually hidden (sr-only) but remains the accessible name,
    // and a title provides a tooltip — navigation is never icon-only to AT.
    const link = await screen.findByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('title', 'Home');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('renders a visible label in the mobile variant and no aria-current when inactive', async () => {
    // My Learning destination while the location is "/" → genuinely inactive.
    const Harness = () => <NavItem destination={learning} variant="mobile" />;
    renderWithProviders(Harness, {
      path: '/',
      initialPath: '/',
      extraRoutes: [{ path: '/my-learning', component: () => null }],
    });
    const link = await screen.findByRole('link', { name: 'My Learning' });
    expect(link).not.toHaveAttribute('aria-current');
  });
});
