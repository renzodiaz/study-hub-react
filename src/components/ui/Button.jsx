import { useId } from 'react';

import { classNames as cn } from '@utils/helpers';

// Button — the action primitive (§6.2).
//
// Variants: primary | secondary | quiet | destructive | credential.
//   `credential` uses bronze and is reserved for credential / Final
//   Qualification actions; it is never a generic CTA (§2.4).
// Sizes: sm 32 / md 40 / lg 48 (use lg for mobile primary, ≥44px touch target).
//
// The primitive carries no product authorization. A caller passes `disabled`
// and, per §6.1, a `reason` that is rendered visibly and linked with
// aria-describedby. `busy` keeps a meaningful label (past-progressive, e.g.
// "Saving…") beside the spinner — it never collapses to a bare spinner and is
// never replaced by a skeleton (§6.2).

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary:
    'bg-surface text-ink border border-line-strong hover:bg-primary-wash',
  quiet: 'bg-transparent text-primary hover:bg-primary-wash',
  destructive: 'bg-danger text-white hover:opacity-90',
  credential: 'bg-bronze-action text-white hover:opacity-90',
};

const SIZES = {
  sm: 'h-8 px-3 text-body-sm gap-1.5',
  md: 'h-10 px-4 text-body gap-2',
  lg: 'h-12 px-5 text-body-lg gap-2',
};

const Spinner = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    className="size-4 shrink-0 animate-spin"
    fill="none"
  >
    <circle
      cx="8"
      cy="8"
      r="6"
      stroke="currentColor"
      strokeWidth="2"
      className="opacity-25"
    />
    <path
      d="M14 8a6 6 0 0 0-6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  busy = false,
  busyLabel,
  disabled = false,
  reason,
  fullWidth = false,
  iconStart,
  className,
  ...rest
}) => {
  const reasonId = useId();
  const showReason = disabled && reason;
  const isDisabled = disabled || busy;

  return (
    <div className={cn('inline-flex flex-col gap-1', fullWidth && 'w-full')}>
      <button
        type={type}
        disabled={isDisabled}
        aria-busy={busy || undefined}
        aria-describedby={showReason ? reasonId : undefined}
        className={cn(
          'inline-flex items-center justify-center rounded-control font-semibold',
          'transition-[background-color,opacity,color] duration-150',
          'disabled:cursor-not-allowed disabled:opacity-60',
          VARIANTS[variant] ?? VARIANTS.primary,
          SIZES[size] ?? SIZES.md,
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
      >
        {busy ? (
          <>
            <Spinner />
            <span>{busyLabel ?? children}</span>
          </>
        ) : (
          <>
            {iconStart ? (
              <span aria-hidden="true" className="inline-flex shrink-0">
                {iconStart}
              </span>
            ) : null}
            <span>{children}</span>
          </>
        )}
      </button>
      {showReason ? (
        <span id={reasonId} className="text-body-sm text-ink-muted">
          {reason}
        </span>
      ) : null}
    </div>
  );
};

export default Button;
