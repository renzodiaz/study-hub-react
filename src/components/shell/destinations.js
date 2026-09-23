import {
  HomeIcon,
  BookOpenIcon,
  Squares2X2Icon,
  CheckBadgeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

// The single source of truth for the five approved learner primary destinations
// (§3.1, fixed order at every width). This is presentation metadata only — it
// must never contain paid-plan, Preview, assessment or credential-eligibility
// checks (those are server-authoritative and out of the shell entirely).
//
// Route mapping keeps the existing canonical routes (the handoff's route names
// are suggestions, not a mandate to rename working routes):
//   Home         → "/"              (Dashboard)
//   My Learning  → "/my-learning"   (MyLearning; the lesson reader lives here)
//   Explore      → "/learn"         (Catalog + career/course browsing)
//   Credentials  → "/achievements"  (relabelled; "/credentials" reserved)
//   Account      → "/settings"      (Billing lives inside Account, not in nav)
//
// `activePaths` are the path prefixes that light a destination as current; the
// most specific (longest) prefix wins so nested routes map to the right parent.
export const DESTINATIONS = [
  { key: 'home', label: 'Home', to: '/', icon: HomeIcon, exact: true },
  {
    key: 'learning',
    label: 'My Learning',
    to: '/my-learning',
    icon: BookOpenIcon,
    activePaths: ['/my-learning', '/lessons'],
  },
  {
    key: 'explore',
    label: 'Explore',
    to: '/learn',
    icon: Squares2X2Icon,
    activePaths: ['/learn'],
  },
  {
    key: 'credentials',
    label: 'Credentials',
    to: '/achievements',
    icon: CheckBadgeIcon,
    activePaths: ['/achievements', '/credentials'],
  },
  {
    key: 'account',
    label: 'Account',
    to: '/settings',
    icon: UserCircleIcon,
    activePaths: ['/settings', '/billing'],
  },
];

const matchesPrefix = (pathname, prefix) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

// Pure, deterministic mapping from the current router pathname to the active
// destination key. Home matches "/" exactly; every other destination matches by
// its longest activePath prefix, so /learn/x/y → Explore and /my-learning/x →
// My Learning without either capturing the other. Returns null when nothing
// maps (e.g. a chromeless runner route, which renders outside the shell).
export const activeDestinationKey = (pathname) => {
  if (pathname === '/') return 'home';

  let bestKey = null;
  let bestLen = 0;
  for (const dest of DESTINATIONS) {
    if (dest.exact) continue;
    for (const prefix of dest.activePaths ?? []) {
      if (matchesPrefix(pathname, prefix) && prefix.length > bestLen) {
        bestKey = dest.key;
        bestLen = prefix.length;
      }
    }
  }
  return bestKey;
};
