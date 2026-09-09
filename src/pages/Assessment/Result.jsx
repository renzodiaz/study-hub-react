import { useQuery } from '@tanstack/react-query';
import { CheckBadgeIcon, XCircleIcon } from '@heroicons/react/20/solid';

import { getAttemptResult } from '@api/assessments';

const TARGET_LEVEL_LABEL = {
  mid_senior: 'Mid / Senior',
};

// Credential scores are shown at exactly the authoritative precision (2 dp) — the
// number the learner sees is the number the server judged. This only FORMATS the
// backend value; it never recalculates or re-rounds to a decision-relevant
// precision. Pass/fail comes from the backend `passed` flag, never from here.
const formatScore = (value) => Number(value ?? 0).toFixed(2);

// Learner-safe result view. Shows the pass decision and AGGREGATE dimension
// scores only — never per-item correctness or answer keys (a credential result
// is not a practice-quiz answer sheet). Accepts optional seed data (from the
// submit response) to avoid a refetch flash; falls back to fetching on restore.
export default function AssessmentResult({ attemptId, initialData }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['attempt-result', attemptId],
    queryFn: () => getAttemptResult(attemptId),
    initialData,
    retry: false,
  });

  if (isLoading) {
    return <p className="p-6 text-sm text-gray-500">Loading result…</p>;
  }
  if (isError) {
    return (
      <p className="p-6 text-sm text-red-600">
        {error?.message ?? 'Failed to load the result.'}
      </p>
    );
  }

  const passed = data.passed;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div
        className={[
          'flex items-center gap-3 rounded-xl p-5',
          passed ? 'bg-green-50' : 'bg-gray-50',
        ].join(' ')}
      >
        {passed ? (
          <CheckBadgeIcon className="size-10 text-green-600" />
        ) : (
          <XCircleIcon className="size-10 text-gray-400" />
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {passed ? 'Passed' : 'Not passed'}
          </h1>
          <p className="text-sm text-gray-500">
            {data.assessment_title} ·{' '}
            {TARGET_LEVEL_LABEL[data.target_level] ?? data.target_level}
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-bold text-gray-900">
            {formatScore(data.overall_score)}
          </div>
          <div className="text-xs text-gray-500">overall score</div>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-gray-900">
        Dimension breakdown
      </h2>
      <ul className="mt-3 space-y-3">
        {data.dimensions.map((dimension) => (
          <li key={dimension.key}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{dimension.label}</span>
              <span className="font-medium text-gray-900">
                {formatScore(dimension.score)}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-gray-100">
              <div
                className={
                  passed
                    ? 'h-2 rounded-full bg-green-500'
                    : 'h-2 rounded-full bg-indigo-400'
                }
                style={{
                  width: `${Math.max(0, Math.min(100, dimension.score))}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>

      {data.submitted_at && (
        <p className="mt-8 text-xs text-gray-400">
          Submitted {new Date(data.submitted_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
