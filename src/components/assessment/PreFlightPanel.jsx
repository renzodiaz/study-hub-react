import Card from '@components/ui/Card';

// PreFlightPanel (§6.4, §13): states the conditions BEFORE anything is consumed.
// Viewing it consumes nothing — it renders only learner-safe policy values the
// server supplied (time limit, attempts, remaining, version). It carries no
// device recommendation or qualification language (that is Final-Qualification
// specific and out of scope here).
const Stat = ({ label, value }) => (
  <div className="rounded-control border border-line px-4 py-3">
    <dt className="text-caption font-medium uppercase tracking-wide text-ink-muted">
      {label}
    </dt>
    <dd className="mt-1 text-card font-semibold text-ink">{value}</dd>
  </div>
);

const PreFlightPanel = ({ stats = [], note }) => (
  <Card className="p-5">
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <Stat key={s.label} label={s.label} value={s.value} />
      ))}
    </dl>
    {note ? <p className="mt-4 text-body-sm text-ink-muted">{note}</p> : null}
  </Card>
);

export default PreFlightPanel;
