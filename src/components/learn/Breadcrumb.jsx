import { Link } from '@tanstack/react-router';

// A compact, semantic breadcrumb. Each item is either a link ({ label, to,
// params }) or plain current-context text ({ label }). The last item is marked
// aria-current. Intentionally understated (small, gray) so it never competes
// with the lesson heading.
const Breadcrumb = ({ items }) => {
  if (!items?.length) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-gray-500">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex min-w-0 items-center gap-x-1.5">
              {i > 0 && (
                <span aria-hidden="true" className="text-gray-300">
                  /
                </span>
              )}
              {item.to ? (
                <Link
                  to={item.to}
                  params={item.params}
                  className="max-w-[16rem] truncate hover:text-gray-700 hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="max-w-[16rem] truncate text-gray-600"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
