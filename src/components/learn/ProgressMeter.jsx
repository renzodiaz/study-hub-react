// Token-based, accessible progress indicator for the learner surfaces.
// Progress is carried by text ("N of M lessons") AND semantics — never colour
// alone (§5.1). `total === 0` renders the neutral "not started" state rather
// than a misleading full/empty bar.
//
// NOTE: this reflects the progress the API currently supplies, which is
// track-scoped lesson completion. It is deliberately labelled "lessons", never
// "Course progress", until a course-scoped contract exists.
const ProgressMeter = ({
  completed = 0,
  total = 0,
  label,
  showPercent = true,
}) => {
  const known = total > 0;
  const pct = known ? Math.round((completed / total) * 100) : 0;
  const text = label ?? `${completed} of ${total} lessons`;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-body-sm text-ink-muted">
        <span>{text}</span>
        {showPercent && known ? <span>{pct}%</span> : null}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={known ? total : undefined}
        aria-valuenow={known ? completed : undefined}
        aria-label={`Progress: ${text}`}
        className="mt-1.5 h-2 w-full overflow-hidden rounded-pill bg-surface-sunken"
      >
        <div
          className="h-full rounded-pill bg-primary transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressMeter;
