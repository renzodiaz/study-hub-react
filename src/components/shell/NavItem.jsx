import { Link } from '@tanstack/react-router';

import { classNames as cn } from '@utils/helpers';

// NavItem — a single primary-navigation destination rendered from one
// destination config (destinations.js) into the shell's presentations. It holds
// no authorization: it renders a link, its active state and its accessible name.
//
// variant "sidebar": icon + label; in rail mode (collapsed, or tablet width)
//   the label is visually hidden but stays in the accessible name, and a title
//   provides a hover tooltip — navigation is never icon-only to assistive tech.
// variant "mobile": stacked icon + small label for the bottom tab bar.
//
// `active` is derived once, in AppShell, from the router location (the single
// source of truth), and drives aria-current="page".

const NavItem = ({
  destination,
  variant = 'sidebar',
  active = false,
  collapsed = false,
}) => {
  const { label, to, icon: Icon } = destination;
  const ariaCurrent = active ? 'page' : undefined;

  if (variant === 'mobile') {
    return (
      <Link
        to={to}
        aria-current={ariaCurrent}
        className={cn(
          'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-1 py-2',
          'text-caption font-medium',
          active ? 'text-primary' : 'text-ink-muted hover:text-ink',
        )}
      >
        <Icon aria-hidden="true" className="size-6 shrink-0" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      title={label}
      aria-current={ariaCurrent}
      className={cn(
        'group flex items-center gap-3 rounded-control p-2 text-body font-medium',
        active
          ? 'bg-primary-tint text-primary'
          : 'text-ink-secondary hover:bg-primary-wash hover:text-ink',
        collapsed ? 'justify-center' : 'md:justify-center lg:justify-start',
      )}
    >
      <Icon aria-hidden="true" className="size-6 shrink-0" />
      <span className={collapsed ? 'sr-only' : 'sr-only lg:not-sr-only'}>
        {label}
      </span>
    </Link>
  );
};

export default NavItem;
