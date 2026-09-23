import { classNames as cn } from '@utils/helpers';

// ProgressStrip (§6.4, §27): shows answered/current status across the attempt
// with a text count as the accessible equivalent. The backend exposes no
// navigation-mode contract, and the current server behaviour permits reviewing
// any item in the attempt (saves are accepted for any item), so the markers are
// navigable — this preserves the existing authorised behaviour rather than
// inventing a new restriction. Each marker keeps its "Question N[, answered]"
// accessible name and aria-current.
const ProgressStrip = ({ count, answeredFlags = [], current, onSelect }) => {
  const answered = answeredFlags.filter(Boolean).length;

  return (
    <div>
      <p className="text-body-sm text-ink-muted">
        {answered} of {count} answered
      </p>
      <nav aria-label="Questions" className="mt-2 flex flex-wrap gap-2">
        {Array.from({ length: count }).map((_, i) => {
          const isAnswered = Boolean(answeredFlags[i]);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              aria-current={i === current ? 'true' : undefined}
              aria-label={`Question ${i + 1}${isAnswered ? ', answered' : ''}`}
              className={cn(
                'size-9 rounded-control border text-body-sm font-medium',
                i === current
                  ? 'border-primary ring-2 ring-primary-tint-line'
                  : 'border-line',
                isAnswered
                  ? 'bg-primary text-white'
                  : 'bg-surface text-ink-secondary hover:bg-primary-wash',
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ProgressStrip;
