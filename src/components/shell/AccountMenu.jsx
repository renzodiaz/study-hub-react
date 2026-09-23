import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Link, useNavigate } from '@tanstack/react-router';

import { useAuth } from '@hooks/useAuth';
import { logout } from '@/api/auth';
import { classNames as cn } from '@utils/helpers';

// The account control (§3.3): a popover with the learner's name, email, a link
// to Account, and Sign out. It is the shell's account affordance; Account is
// also a primary destination. It reads only what the auth context already holds
// (name, email) — no new account/entitlement fetch is made for shell
// decoration (§22), so plan name is intentionally deferred to the Account
// milestone.

const AccountMenu = ({ showName = false }) => {
  // Defensive: the shell must not white-screen if the auth context is missing
  // or momentarily null.
  const { user, setLoggedOut } = useAuth() ?? {};
  const navigate = useNavigate();

  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();
  const avatarUrl =
    user?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'Learner')}&background=0D4A54&color=fff`;

  const handleSignOut = async () => {
    await logout().catch(() => {});
    setLoggedOut?.();
    navigate({ to: '/login' });
  };

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className={cn(
          'flex w-full items-center gap-3 rounded-control p-2 text-left',
          'hover:bg-primary-wash',
        )}
      >
        <img
          alt=""
          src={avatarUrl}
          className="size-8 shrink-0 rounded-pill bg-surface-sunken"
        />
        {showName ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-medium text-ink">
              {fullName || 'Your account'}
            </span>
            <span className="block truncate text-caption text-ink-muted">
              {user?.email}
            </span>
          </span>
        ) : (
          <span className="sr-only">
            {fullName ? `${fullName} — account menu` : 'Account menu'}
          </span>
        )}
      </MenuButton>
      <MenuItems
        anchor="top end"
        className="z-50 w-56 rounded-sheet border border-line bg-surface p-1 shadow-overlay [--anchor-gap:8px] focus:outline-none"
      >
        <div className="px-3 py-2">
          <p className="truncate text-body font-medium text-ink">
            {fullName || 'Your account'}
          </p>
          {user?.email ? (
            <p className="truncate text-caption text-ink-muted">{user.email}</p>
          ) : null}
        </div>
        <div className="my-1 h-px bg-line" />
        <MenuItem>
          <Link
            to="/settings"
            className="block rounded-control px-3 py-2 text-body text-ink data-focus:bg-primary-wash"
          >
            Account
          </Link>
        </MenuItem>
        <MenuItem>
          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full rounded-control px-3 py-2 text-left text-body text-ink data-focus:bg-primary-wash"
          >
            Sign out
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
};

export default AccountMenu;
