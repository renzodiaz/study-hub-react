import { Link } from '@tanstack/react-router';
import { classNames } from '@utils/helpers';

import {
  AcademicCapIcon,
  BeakerIcon,
  CalendarIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  BookOpenIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

import NavLink from '@components/NavLink';
import { useAuth } from '@hooks/useAuth';

const NAVIGATION = [
  { name: 'Dashboard', to: '/', icon: HomeIcon },
  { name: 'Explore', to: '/learn', icon: AcademicCapIcon },
  { name: 'My learning', to: '/my-learning', icon: BookOpenIcon },
  { name: 'Achievements', to: '/achievements', icon: TrophyIcon },
  { name: 'Pilots', to: '/pilots', icon: BeakerIcon },
  { name: 'Billing', to: '/billing', icon: CreditCardIcon },
  {
    name: 'Career Tracks',
    to: '/career-tracks',
    icon: AcademicCapIcon,
    adminOnly: true,
  },
  { name: 'Study hub', to: '/study-hub', icon: BookOpenIcon, adminOnly: true },
  { name: 'Projects', to: '/projects', icon: FolderIcon },
  { name: 'Calendar', to: '/calendar', icon: CalendarIcon },
  { name: 'Documents', to: '/documents', icon: DocumentDuplicateIcon },
  { name: 'Reports', to: '/reports', icon: ChartPieIcon },
];

const SidebarNav = ({ onLinkClick }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigation = NAVIGATION.filter((item) => !item.adminOnly || isAdmin);

  return (
    <ul role="list" className="flex flex-1 flex-col gap-y-7">
      <li>
        <ul role="list" className="-mx-2 space-y-1">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} onClick={onLinkClick} />
          ))}
        </ul>
      </li>
      <li className="mt-auto">
        <Link
          to="/settings"
          onClick={onLinkClick}
          className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
          activeProps={{
            className: 'bg-gray-50 text-indigo-600',
          }}
        >
          {({ isActive }) => (
            <>
              <Cog6ToothIcon
                aria-hidden="true"
                className={classNames(
                  isActive
                    ? 'text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                  'size-6 shrink-0',
                )}
              />
              Settings
            </>
          )}
        </Link>
      </li>
    </ul>
  );
};

export default SidebarNav;
