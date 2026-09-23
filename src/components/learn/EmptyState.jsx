import Card from '@components/ui/Card';

// A calm empty state (§11.1): says what will appear here and offers the one
// action that creates it. No apology, no illustration of emptiness, no
// marketing filler. `action` is a single element (a Link/Button) or omitted.
const EmptyState = ({ icon: Icon, title, description, action }) => (
  <Card className="flex flex-col items-center px-6 py-12 text-center">
    {Icon ? (
      <Icon aria-hidden="true" className="size-8 text-ink-muted" />
    ) : null}
    <h2 className="mt-3 text-card font-semibold text-ink">{title}</h2>
    {description ? (
      <p className="mt-1 max-w-md text-body text-ink-secondary">
        {description}
      </p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </Card>
);

export default EmptyState;
