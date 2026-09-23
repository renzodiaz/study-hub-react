import { Link } from '@tanstack/react-router';

// A compact, semantic breadcrumb (§21). Each item is either a link ({ label,
// to, params }) or plain current-context text ({ label }). The last item is
// marked aria-current. Understated so it never competes with the page heading;
// it is orientation support, not the only orientation mechanism.
const Breadcrumb = ({ items }) => {
  if (!items?.length) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-body-sm text-ink-muted">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex min-w-0 items-center gap-x-1.5">
              {i > 0 && (
                <span aria-hidden="true" className="text-line-strong">
                  /
                </span>
              )}
              {item.to ? (
                <Link
                  to={item.to}
                  params={item.params}
                  className="max-w-[16rem] truncate rounded-chip hover:text-ink hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="max-w-[16rem] truncate text-ink-secondary"
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
