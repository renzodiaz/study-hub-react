// Informational only. Loading this route must NOT change any billing state and
// makes no API call — Stripe Checkout was simply not completed.
export default function Canceled() {
  return (
    <div className="mx-auto max-w-lg p-8 text-center">
      <h1 className="text-xl font-bold text-gray-900">Checkout canceled</h1>
      <p className="mt-2 text-sm text-gray-600">
        No charge was made. You can pick a plan again whenever you’re ready.
      </p>
      <a
        href="/pricing"
        className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Back to pricing
      </a>
    </div>
  );
}
