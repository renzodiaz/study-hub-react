import { classNames as cn } from '@utils/helpers';

// Link — the navigation primitive (§6.2). Always a real anchor; a link is never
// swapped for a button (or a button for a link) for styling convenience.
//
// Variants:
//   inline      — petrol, underlined, sits inside prose
//   standalone  — petrol, medium weight, stands on its own line
//   breadcrumb  — muted, for the career › course › section trail
//
// Router integration (TanStack <Link>) is a shell/page concern; this primitive
// styles a plain anchor. Callers keep link text meaningful out of context
// ("Learn more about the standard", never "click here") per §5.5.

const VARIANTS = {
  inline: 'text-primary underline underline-offset-2 hover:text-primary-hover',
  standalone:
    'font-medium text-primary hover:text-primary-hover hover:underline underline-offset-2',
  breadcrumb: 'text-ink-muted hover:text-ink',
};

const Link = ({ children, variant = 'inline', className, ...rest }) => (
  <a
    className={cn(
      'rounded-chip transition-colors duration-150',
      VARIANTS[variant] ?? VARIANTS.inline,
      className,
    )}
    {...rest}
  >
    {children}
  </a>
);

export default Link;
