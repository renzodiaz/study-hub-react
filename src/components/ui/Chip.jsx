import { classNames as cn } from '@utils/helpers';

// Chip — metadata / category / context, kept distinct from StatusPill (§6.2).
// A chip is not a status: it does not derive a semantic colour and never stands
// in for "Valid" / "Revoked" / "Passed". Those are StatusPill's job.
//
// Variants:
//   plain  — a neutral metadata tag ("5 courses", "Mid-Senior")
//   dashed — a qualified state such as Preview (the dashed border is the signal)
//   count  — a compact numeric tag on a sunken fill

const VARIANTS = {
  plain: 'border border-line bg-surface text-ink-secondary',
  dashed:
    'border border-dashed border-line-strong bg-surface text-ink-secondary',
  count:
    'border border-transparent bg-surface-sunken text-ink-muted tabular-nums',
};

const Chip = ({ children, variant = 'plain', iconStart, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-chip px-2 py-0.5',
      'text-caption font-medium',
      VARIANTS[variant] ?? VARIANTS.plain,
      className,
    )}
  >
    {iconStart ? (
      <span aria-hidden="true" className="inline-flex shrink-0">
        {iconStart}
      </span>
    ) : null}
    <span>{children}</span>
  </span>
);

export default Chip;
