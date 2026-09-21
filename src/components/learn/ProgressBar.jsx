// An accessible, understated progress indicator. Communicates progress with
// text ("N of M lessons") AND semantics — never color alone.
const ProgressBar = ({ completed = 0, total = 0, label }) => {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const text = label ?? `${completed} of ${total} lessons`;

  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{text}</p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-label={`Course progress: ${text}`}
        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
