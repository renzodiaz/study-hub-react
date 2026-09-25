import { Card } from '@components/ui';

// Informational only. Loading this route must NOT change any billing state and
// makes no API call — Stripe Checkout was simply not completed. Neutral copy:
// nothing was charged, canceled, or changed.
export default function Canceled() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-sunken px-4 py-12">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="text-section font-semibold text-ink">
          Checkout canceled
        </h1>
        <p className="mt-2 text-body-sm text-ink-secondary">
          No charge was made. You can pick a plan again whenever you’re ready.
        </p>
        <a
          href="/pricing"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-control bg-primary px-5 text-body font-semibold text-white hover:bg-primary-hover"
        >
          Back to pricing
        </a>
      </Card>
    </div>
  );
}
