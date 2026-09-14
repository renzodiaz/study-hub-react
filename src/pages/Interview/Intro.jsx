import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ClockIcon,
  BriefcaseIcon,
  ArrowPathIcon,
  LockClosedIcon,
  CheckBadgeIcon,
} from '@heroicons/react/20/solid';

import { getCareerInterview } from '@api/assessments';
import { startAttempt } from '@api/assessments';

const TARGET_LEVEL_LABEL = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};

// Human copy for a server-provided ineligibility reason. The server is the
// authority; this only renders what it decided.
const REASON_MESSAGE = {
  no_active_subscription:
    'An active paid subscription is required to take the final interview.',
  career_not_ready:
    'Complete every course in this track to unlock the final interview.',
  evaluation_pending:
    'Your interview has been submitted and is being evaluated.',
  already_passed: 'You have already passed this interview.',
  cooldown_active: 'A cooldown is active before you can try again.',
  attempts_exhausted: 'You have used all of your interview attempts.',
};

const formatMinutes = (seconds) =>
  seconds ? `${Math.round(seconds / 60)} min` : '—';

const Stat = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 px-4 py-3">
    <dt className="text-xs font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-lg font-semibold text-gray-900">{value}</dd>
  </div>
);

export default function InterviewIntro() {
  const { trackId } = useParams({ strict: false });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['career-interview', trackId],
    queryFn: () => getCareerInterview(trackId),
    retry: false,
  });

  const start = useMutation({
    mutationFn: () => startAttempt(data.assessment.id),
    onSuccess: (attempt) => {
      queryClient.invalidateQueries({
        queryKey: ['career-interview', trackId],
      });
      navigate({
        to: '/assessment-attempts/$attemptId',
        params: { attemptId: attempt.id },
      });
    },
  });

  if (isLoading) {
    return (
      <p className="p-6 text-sm text-gray-500">Loading final interview…</p>
    );
  }

  // interview_not_configured (404) or interview_misconfigured (409) → generic,
  // non-revealing copy. Never expose backend configuration detail.
  if (isError) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <BackLink trackId={trackId} />
        <p className="mt-6 text-sm text-gray-500">
          The final interview is temporarily unavailable.
        </p>
      </div>
    );
  }

  const { assessment, attempt, credential } = data;
  const level =
    TARGET_LEVEL_LABEL[assessment.target_level] ?? assessment.target_level;

  const goToAttempt = (id) =>
    navigate({
      to: '/assessment-attempts/$attemptId',
      params: { attemptId: id },
    });

  return (
    <div className="mx-auto max-w-2xl p-6">
      <BackLink trackId={trackId} />

      <div className="mt-4 flex items-center gap-3">
        <BriefcaseIcon className="size-8 text-indigo-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {assessment.title}
          </h1>
          <p className="text-sm text-gray-500">
            Final interview · {level} level
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Questions" value={assessment.questions_count} />
        <Stat
          label="Time limit"
          value={formatMinutes(assessment.time_limit_seconds)}
        />
        <Stat label="Attempts" value={assessment.max_attempts} />
        <Stat label="Remaining" value={attempt.attempts_remaining} />
      </dl>

      <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
        This is the final career interview. Questions are free-text; you can
        edit your answers until you submit. After submission, your interview is
        evaluated and the result appears in your track.
      </div>

      <div className="mt-6">
        {credential.state === 'issued' ? (
          <Link
            to="/achievements"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <CheckBadgeIcon className="size-4" /> View credential
          </Link>
        ) : attempt.state === 'in_progress' && attempt.can_resume ? (
          <button
            type="button"
            onClick={() => goToAttempt(attempt.active_attempt_id)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <ArrowPathIcon className="size-4" /> Resume final interview
          </button>
        ) : attempt.state === 'evaluating' ? (
          <span
            role="status"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-5 py-2.5 text-sm font-semibold text-indigo-700"
          >
            <ClockIcon className="size-4" /> Evaluation in progress
          </span>
        ) : attempt.state === 'passed' ? (
          <p className="text-sm font-medium text-green-700">
            Interview passed
            {credential.state === 'pending' && ' — issuing your credential…'}
          </p>
        ) : attempt.can_start ? (
          // Only offered when the backend says a new attempt may start.
          <button
            type="button"
            disabled={start.isPending}
            onClick={() => start.mutate()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {start.isPending
              ? 'Starting…'
              : attempt.state === 'failed'
                ? 'Retry final interview'
                : 'Start final interview'}
          </button>
        ) : null}
      </div>

      {!attempt.can_start &&
        !attempt.can_resume &&
        attempt.reason &&
        attempt.state !== 'passed' &&
        attempt.state !== 'evaluating' && (
          <div className="mt-6 flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            <LockClosedIcon className="mt-0.5 size-4 shrink-0" />
            <span>
              {REASON_MESSAGE[attempt.reason] ??
                'You are not eligible to start the interview yet.'}
              {attempt.reason === 'cooldown_active' &&
                attempt.next_eligible_at && (
                  <>
                    {' '}
                    You can try again after{' '}
                    {new Date(attempt.next_eligible_at).toLocaleString()}.
                  </>
                )}
              {attempt.reason === 'no_active_subscription' && (
                <>
                  {' '}
                  <Link to="/pricing" className="font-semibold underline">
                    View plans
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

      {start.isError && (
        <p className="mt-3 text-sm text-red-600">
          {REASON_MESSAGE[start.error?.code] ?? start.error?.message}
        </p>
      )}
    </div>
  );
}

const BackLink = ({ trackId }) => (
  <Link
    to="/learn/$trackId"
    params={{ trackId }}
    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
  >
    <ArrowLeftIcon className="size-4" /> Back to track
  </Link>
);
