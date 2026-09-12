import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ClockIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  LockClosedIcon,
} from '@heroicons/react/20/solid';

import { getCourseAssessment, startAttempt } from '@api/assessments';

const TARGET_LEVEL_LABEL = {
  mid_senior: 'Mid / Senior',
};

// Human copy for a server-provided ineligibility reason. The server remains the
// authority; this only renders what it decided.
const REASON_MESSAGE = {
  assessment_unavailable: 'This assessment is not currently available.',
  no_active_subscription:
    'An active paid subscription is required to take this credential assessment.',
  not_enrolled:
    'Enroll in a career track that includes this module to unlock the assessment.',
  // Generic fallback — React never invents which course is the prerequisite. If
  // the API supplies an unlock_requirement for this context, its name is used
  // instead (see reasonMessage below).
  course_locked: 'Complete the prerequisite course to unlock this assessment.',
  attempts_exhausted: 'You have used all of your attempts for this assessment.',
  cooldown_active: 'A cooldown is active before you can try again.',
};

const formatMinutes = (seconds) =>
  seconds ? `${Math.round(seconds / 60)} min` : '—';

const Stat = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 px-4 py-3">
    <dt className="text-xs font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-lg font-semibold text-gray-900">{value}</dd>
  </div>
);

export default function AssessmentIntro() {
  const { trackId, courseId } = useParams({ strict: false });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: assessment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['course-assessment', courseId],
    queryFn: () => getCourseAssessment(courseId),
  });

  const start = useMutation({
    mutationFn: () => startAttempt(assessment.id),
    onSuccess: (attempt) => {
      queryClient.invalidateQueries({
        queryKey: ['course-assessment', courseId],
      });
      navigate({
        to: '/assessment-attempts/$attemptId',
        params: { attemptId: attempt.id },
      });
    },
  });

  if (isLoading) {
    return <p className="p-6 text-sm text-gray-500">Loading assessment…</p>;
  }
  if (isError) {
    return (
      <p className="p-6 text-sm text-red-600">
        {error?.message ?? 'Failed to load assessment.'}
      </p>
    );
  }

  // can_resume: a live attempt to return to (even if entitlement lapsed after
  // starting). can_start: eligible to begin a NEW attempt. Distinct on purpose.
  const resumable = Boolean(
    assessment.can_resume && assessment.active_attempt_id,
  );
  const canStart = assessment.can_start;
  const nextEligible = assessment.next_eligible_at
    ? new Date(assessment.next_eligible_at).toLocaleString()
    : null;

  // Ineligibility copy. For a progression lock, prefer the API-provided
  // prerequisite course name when present; otherwise a generic fallback. React
  // never derives the prerequisite from course positions.
  const lockedName = assessment.unlock_requirement?.name;
  const reasonMessage =
    assessment.reason === 'course_locked' && lockedName
      ? `Complete ${lockedName} to unlock this assessment.`
      : (REASON_MESSAGE[assessment.reason] ??
        'You are not eligible to start yet.');

  const goToAttempt = () =>
    navigate({
      to: '/assessment-attempts/$attemptId',
      params: { attemptId: assessment.active_attempt_id },
    });

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link
        to="/learn/$trackId/$courseId"
        params={{ trackId, courseId }}
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="size-4" /> Back to module
      </Link>

      <div className="flex items-center gap-3">
        <AcademicCapIcon className="size-8 text-indigo-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {assessment.title}
          </h1>
          <p className="text-sm text-gray-500">
            Credential standard:{' '}
            {TARGET_LEVEL_LABEL[assessment.target_level] ??
              assessment.target_level}
          </p>
        </div>
      </div>

      {assessment.available ? (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Time limit"
              value={formatMinutes(assessment.time_limit_seconds)}
            />
            <Stat label="Attempts" value={assessment.max_attempts} />
            <Stat label="Remaining" value={assessment.attempts_remaining} />
            <Stat label="Version" value={`v${assessment.version_no}`} />
          </dl>

          {!canStart && assessment.reason && (
            <div className="mt-6 flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              <LockClosedIcon className="mt-0.5 size-4 shrink-0" />
              <span>
                {reasonMessage}
                {assessment.reason === 'cooldown_active' && nextEligible && (
                  <> You can try again after {nextEligible}.</>
                )}
              </span>
            </div>
          )}

          <div className="mt-6">
            {resumable ? (
              <button
                type="button"
                onClick={goToAttempt}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                <ArrowPathIcon className="size-4" /> Resume attempt
              </button>
            ) : (
              <button
                type="button"
                disabled={!canStart || start.isPending}
                onClick={() => start.mutate()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {start.isPending ? 'Starting…' : 'Start assessment'}
              </button>
            )}
            {start.isError && (
              <p className="mt-3 text-sm text-red-600">
                {REASON_MESSAGE[start.error?.code] ?? start.error?.message}
              </p>
            )}
          </div>

          <p className="mt-6 flex items-center gap-1 text-xs text-gray-400">
            <ClockIcon className="size-3.5" />
            Once started, the timer runs on the server and cannot be paused.
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm text-gray-500">
          {REASON_MESSAGE.assessment_unavailable}
        </p>
      )}
    </div>
  );
}
