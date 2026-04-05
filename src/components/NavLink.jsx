import { Link } from '@tanstack/react-router';
import { classNames } from '../utils/helpers';

const NavLink = ({ item, onClick }) => {
  return (
    <li>
      <Link
        to={item.to}
        onClick={onClick}
        // TanStack Router injects data-status="active" on the active link
        className="text-gray-700 hover:bg-gray-50 hover:text-indigo-600 group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
        activeProps={{
          className: 'bg-gray-50 text-indigo-600',
        }}
      >
        {({ isActive }) => (
          <>
            <item.icon
              aria-hidden="true"
              className={classNames(
                isActive
                  ? 'text-indigo-600'
                  : 'text-gray-400 group-hover:text-indigo-600',
                'size-6 shrink-0',
              )}
            />
            {item.name}
          </>
        )}
      </Link>
    </li>
  );
};

export default NavLink;
