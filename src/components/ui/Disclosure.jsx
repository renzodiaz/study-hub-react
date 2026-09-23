import { ChevronRightIcon } from '@heroicons/react/20/solid';

import { classNames as cn } from '@utils/helpers';

// Disclosure — native <details>/<summary> (§6.2, §5.2). It works without
// JavaScript and keeps native keyboard and screen-reader semantics, which is
// why the competency-standard areas use it. No JS is added to reproduce
// behaviour the platform already provides.
//
// Variants:
//   details — a light inline disclosure inside prose
//   section — a bordered, card-like disclosure block
//
// The chevron reflects open state via the `open:` variant (an instant marker,
// not an animation), so it stays correct under prefers-reduced-motion.

const Disclosure = ({
  summary,
  children,
  defaultOpen = false,
  variant = 'details',
  className,
}) => {
  const isSection = variant === 'section';

  return (
    <details
      open={defaultOpen}
      className={cn(
        'group',
        isSection && 'rounded-card border border-line bg-surface',
        className,
      )}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-2',
          'font-medium text-ink [&::-webkit-details-marker]:hidden',
          isSection ? 'p-4 text-card' : 'py-2 text-body',
        )}
      >
        <span>{summary}</span>
        <ChevronRightIcon
          aria-hidden="true"
          className="size-5 shrink-0 text-ink-muted group-open:rotate-90"
        />
      </summary>
      <div
        className={cn(
          'text-body text-ink-secondary',
          isSection ? 'px-4 pb-4' : 'pt-1',
        )}
      >
        {children}
      </div>
    </details>
  );
};

export default Disclosure;
