import { useEffect, useRef } from 'react';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { ChevronDoubleLeftIcon } from '@heroicons/react/20/solid';

import { DrawerProvider } from '@contexts/DrawerProvider';
import Drawer from '@layouts/partials/Drawer';
import { useSidebarCollapsed } from '@hooks/useSidebarCollapsed';
import { classNames as cn } from '@utils/helpers';
import { DESTINATIONS, activeDestinationKey } from './destinations';
import NavItem from './NavItem';
import AccountMenu from './AccountMenu';

// AppShell — the learner application shell (§3). It owns only global shell
// concerns: primary-navigation placement, responsive navigation mode, the
// current-destination indication, the account control, the collapse preference,
// shell landmarks and the content region. It owns no product state (enrollment,
// entitlement, progression, credentials, billing) and fetches nothing.
//
// Responsive states (§3.2):
//   < 768  (Compact/Wide): bottom tab bar + a minimal top app bar
//   768–1023 (Tablet):     72px icon rail (forced, regardless of preference)
//   ≥ 1024 (Laptop/Desktop): 248px expanded sidebar, collapsible to the rail
//
// The collapse preference only affects ≥1024; tablet is always a rail and
// mobile is always the bottom bar, so a saved preference never redefines the
// smaller layouts.

const Brand = ({ collapsed }) => (
  <Link
    to="/"
    aria-label="Study Hub"
    className="flex h-14 shrink-0 items-center px-4 font-semibold text-ink"
  >
    {collapsed ? (
      <span aria-hidden="true">SH</span>
    ) : (
      <>
        <span aria-hidden="true" className="lg:hidden">
          SH
        </span>
        <span aria-hidden="true" className="hidden lg:inline">
          Study Hub
        </span>
      </>
    )}
  </Link>
);

const AppShell = () => {
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeKey = activeDestinationKey(pathname);

  // Route-change focus (§5.2, §24): after a client-side navigation, move focus
  // to the main content region so keyboard and screen-reader users land at the
  // top of the new page. Skipped on first mount (no navigation happened) and
  // keyed to pathname only, so in-page state changes don't steal focus. No
  // timeout is used.
  const mainRef = useRef(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [pathname]);

  const railOrExpanded = collapsed ? 'md:w-[72px]' : 'md:w-[72px] lg:w-[248px]';
  const contentPad = collapsed ? 'md:pl-[72px]' : 'md:pl-[72px] lg:pl-[248px]';

  return (
    <DrawerProvider>
      <a
        href="#main-content"
        className="sr-only rounded-control bg-primary px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to main content
      </a>

      {/* Desktop / tablet sidebar (rail on tablet, expandable on ≥1024). */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface md:flex',
          railOrExpanded,
        )}
      >
        <Brand collapsed={collapsed} />
        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-2">
          <ul className="flex flex-col gap-1">
            {DESTINATIONS.map((dest) => (
              <li key={dest.key}>
                <NavItem
                  destination={dest}
                  variant="sidebar"
                  active={activeKey === dest.key}
                  collapsed={collapsed}
                />
              </li>
            ))}
          </ul>
        </nav>
        <div className="shrink-0 border-t border-line p-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="mb-1 hidden w-full items-center gap-3 rounded-control p-2 text-body font-medium text-ink-secondary hover:bg-primary-wash hover:text-ink lg:flex"
          >
            <ChevronDoubleLeftIcon
              aria-hidden="true"
              className={cn('size-5 shrink-0', collapsed && 'rotate-180')}
            />
            <span className={collapsed ? 'sr-only' : ''}>Collapse</span>
          </button>
          <AccountMenu showName={!collapsed} />
        </div>
      </aside>

      {/* Main column */}
      <div className={cn('flex min-h-screen flex-col', contentPad)}>
        {/* Mobile top app bar (§3.2) */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface px-4 md:hidden">
          <Brand collapsed={false} />
          <AccountMenu />
        </header>

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="flex-1 focus:outline-none"
        >
          {/* Content is left-aligned against the sidebar (not centred in the
              remaining space): on wide screens centring dropped a large dead gap
              between the fixed nav and the content — visible as nav | gap |
              outline | content on the lesson view. Reading width stays capped at
              max 1200 with the 32px desktop gutter (§ layout). */}
          <div className="max-w-[1200px] px-4 py-8 pb-24 md:px-6 md:pb-8 lg:px-8">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom tab bar (§3.2). Hidden ≥768 (display:none), so only one
            Primary nav is ever in the accessibility tree at a time. */}
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface md:hidden"
        >
          {DESTINATIONS.map((dest) => (
            <NavItem
              key={dest.key}
              destination={dest}
              variant="mobile"
              active={activeKey === dest.key}
            />
          ))}
        </nav>
      </div>

      <Drawer />
    </DrawerProvider>
  );
};

export default AppShell;
