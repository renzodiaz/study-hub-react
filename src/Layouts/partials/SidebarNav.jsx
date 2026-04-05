import { Link } from '@tanstack/react-router';
import { classNames } from '../../utils/helpers';

import {
  CalendarIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

import NavLink from '../../components/NavLink';

const SidebarNav = ({ onLinkClick }) => {
  const navigation = [
    { name: 'Dashboard', to: '/', icon: HomeIcon },
    { name: 'Study hub', to: '/study-hub', icon: BookOpenIcon },
    { name: 'Projects', to: '/projects', icon: FolderIcon },
    { name: 'Calendar', to: '/calendar', icon: CalendarIcon },
    {
      name: 'Documents',
      to: '/documents',
      icon: DocumentDuplicateIcon,
    },
    { name: 'Reports', to: '/reports', icon: ChartPieIcon },
  ];

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
