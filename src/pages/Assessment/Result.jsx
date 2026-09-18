import { useQuery } from '@tanstack/react-query';
import {
  CheckBadgeIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/20/solid';

import { getAttemptResult } from '@api/assessments';
import useBoundedPoll from '@hooks/useBoundedPoll';

const isEvaluating = (data) => data?.code === 'evaluation_pending';

const TARGET_LEVEL_LABEL = {
  mid_senior: 'Mid / Senior',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};

// FORMAT only — the number the learner sees is the number the server judged.
const formatScore = (value) => Number(value ?? 0).toFixed(2);

// Knowledge credentials are always the mid_senior band; any other target level
// means this is a career interview → a SeniorityBadge, not a course Certificate.
const isInterviewResult = (data) =>
  data?.target_level && data.target_level !== 'mid_senior';

// Learner-safe result. While the backend reports evaluation_pending (202), shows
// an evaluating state and polls; then renders the authoritative pass/fail.
export default function AssessmentResult({ attemptId, initialData }) {
  const { intervalFn, stopped, reset } = useBoundedPoll({
    isPending: isEvaluating,
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['attempt-result', attemptId],
    queryFn: () => getAttemptResult(attemptId),
    initialData,
    retry: false,
    // Bounded/backoff polling while awaiting evaluation; stops at any terminal
    // outcome AND after the automatic window (see useBoundedPoll).
    refetchInterval: intervalFn,
  });

  const checkAgain = () => {
    reset();
    refetch();
  };

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

  // Async evaluation still in progress (interview). Generic, reassuring copy —
  // never provider/infrastructure detail, never "you failed".
  if (isEvaluating(data)) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-5">
          <ClockIcon className="size-8 text-indigo-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900" role="status">
              Your interview is being evaluated
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {stopped
                ? 'Your interview is still being evaluated. Your submission is safe — no action is needed from you.'
                : 'Your submission is safe. This can take a little while — you can leave this page and come back; the result will appear here.'}
            </p>
            {stopped && (
              <button
                type="button"
                onClick={checkAgain}
                disabled={isFetching}
                className="mt-3 rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
              >
                {isFetching ? 'Checking…' : 'Check again'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const passed = data.passed;
  const interview = isInterviewResult(data);

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

      {/* A pilot attempt never issues a credential — say so explicitly and
          never show credential-issued messaging, regardless of pass/fail. */}
      {data.pilot && (
        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          This was a <span className="font-semibold">pilot</span> assessment. No
          credential is issued for pilot attempts — thank you for helping
          evaluate it.
        </div>
      )}
      {!data.pilot && passed && interview && (
        <div className="mt-6 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-800">
          Interview passed. Your seniority credential is being issued and will
          appear in{' '}
          <a href="/achievements" className="font-semibold underline">
            your achievements
          </a>{' '}
          shortly.
        </div>
      )}
      {!data.pilot && passed && !interview && (
        <div className="mt-6 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-800">
          Your knowledge credential is being issued and will appear in{' '}
          <a href="/achievements" className="font-semibold underline">
            your achievements
          </a>{' '}
          shortly.
        </div>
      )}
      {!passed && interview && (
        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          You did not pass this time. Return to your career track to see whether
          you can try again.
        </div>
      )}

      {typeof data.summary === 'string' && data.summary.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">Summary</h2>
          {/* Untrusted model text — rendered as plain escaped React text. */}
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
            {data.summary}
          </p>
        </div>
      )}

      {Array.isArray(data.dimensions) && data.dimensions.length > 0 && (
        <>
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
        </>
      )}

      {data.submitted_at && (
        <p className="mt-8 text-xs text-gray-400">
          Submitted {new Date(data.submitted_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
