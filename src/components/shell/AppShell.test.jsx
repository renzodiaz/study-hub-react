import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import AppShell from './AppShell';

const DEST_PATHS = [
  '/',
  '/my-learning',
  '/learn',
  '/achievements',
  '/settings',
];

// Render AppShell as the layout for `active`, registering the other primary
// destinations so the nav <Link>s resolve against a real router.
const renderShellAt = (active = '/', extra = []) =>
  renderWithProviders(AppShell, {
    path: active,
    initialPath: active,
    extraRoutes: [...DEST_PATHS.filter((p) => p !== active), ...extra].map(
      (p) => ({ path: p, component: () => null }),
    ),
  });

const primaryNavs = () =>
  screen.getAllByRole('navigation', { name: 'Primary' });

// The router paints asynchronously; await a stable shell element first.
const awaitShell = () =>
  screen.findByRole('link', { name: /skip to main content/i });

describe('AppShell — primary navigation', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it('renders exactly the five approved destinations, in order, in the sidebar', async () => {
    renderShellAt('/');
    await awaitShell();
    const sidebar = primaryNavs()[0];
    const names = within(sidebar)
      .getAllByRole('link')
      .map((a) => a.textContent.trim());
    expect(names).toEqual([
      'Home',
      'My Learning',
      'Explore',
      'Credentials',
      'Account',
    ]);
  });

  it('exposes Account and never Billing/Pilots/legacy items as primary destinations', async () => {
    renderShellAt('/');
    await awaitShell();
    expect(
      screen.getAllByRole('link', { name: 'Account' }).length,
    ).toBeGreaterThan(0);
    for (const banned of [
      'Billing',
      'Pilots',
      'Calendar',
      'Documents',
      'Projects',
      'Reports',
      'Dashboard',
      'Achievements',
    ]) {
      expect(
        screen.queryByRole('link', { name: banned }),
      ).not.toBeInTheDocument();
    }
  });

  it('marks the active destination with aria-current from the router location', async () => {
    renderShellAt('/my-learning');
    await awaitShell();
    const sidebar = primaryNavs()[0];
    const current = within(sidebar)
      .getAllByRole('link')
      .filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('My Learning');
  });

  it('maps a nested course route (/learn/t/c) to Explore', async () => {
    renderWithProviders(AppShell, {
      path: '/learn/$trackId/$courseId',
      initialPath: '/learn/t1/c1',
      extraRoutes: DEST_PATHS.map((p) => ({ path: p, component: () => null })),
    });
    await awaitShell();
    const sidebar = primaryNavs()[0];
    const current = within(sidebar)
      .getAllByRole('link')
      .find((a) => a.getAttribute('aria-current') === 'page');
    expect(current).toHaveTextContent('Explore');
  });

  it('renders a mobile bottom navigation with the same destinations', async () => {
    renderShellAt('/');
    await awaitShell();
    // Two Primary navs exist (sidebar + bottom bar); only one is displayed per
    // breakpoint via CSS, so only one is in the a11y tree at runtime.
    const navs = primaryNavs();
    expect(navs).toHaveLength(2);
    const mobile = navs[1];
    expect(
      within(mobile)
        .getAllByRole('link')
        .map((a) => a.textContent.trim()),
    ).toEqual(['Home', 'My Learning', 'Explore', 'Credentials', 'Account']);
  });

  it('provides a skip link to the main content region', async () => {
    renderShellAt('/');
    const skip = await awaitShell();
    expect(skip).toHaveAttribute('href', '#main-content');
    expect(document.getElementById('main-content')).toBeInTheDocument();
  });

  // Regression: the content region is left-aligned against the sidebar (not
  // centred in the remaining space), so wide screens don't show a dead gap
  // between the fixed nav and the content. Reading width stays capped at 1200.
  it('left-aligns the content region against the sidebar at a capped reading width', async () => {
    renderShellAt('/');
    await awaitShell();
    const wrapper = document.getElementById('main-content').firstElementChild;
    expect(wrapper).toHaveClass('max-w-[1200px]');
    expect(wrapper).not.toHaveClass('mx-auto');
  });
});

describe('AppShell — collapse preference', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it('persists the collapse preference and reflects it on the toggle', async () => {
    renderShellAt('/');
    await awaitShell();
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(toggle);

    expect(localStorage.getItem('studyhub.shell.sidebar-collapsed')).toBe(
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('reads an existing collapsed preference on mount', async () => {
    localStorage.setItem('studyhub.shell.sidebar-collapsed', 'true');
    renderShellAt('/');
    await awaitShell();
    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
