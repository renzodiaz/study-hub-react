// PR-2 placeholder. It must NOT claim paid access is active and must NOT infer
// success from query params or mutate any cache — activation happens only after
// the PR-3 webhook syncs the subscription. PR-3 will add local-state polling here.
export default function Success() {
  return (
    <div className="mx-auto max-w-lg p-8 text-center">
      <h1 className="text-xl font-bold text-gray-900">Payment processing</h1>
      <p className="mt-2 text-sm text-gray-600">
        Your subscription will be activated after your payment is confirmed.
        This can take a few moments.
      </p>
      <a
        href="/"
        className="mt-6 inline-block rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Continue
      </a>
    </div>
  );
}
