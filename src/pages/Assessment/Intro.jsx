import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/20/solid';

import {
  getCourseAssessment,
  startAttempt,
  startPilotAttempt,
} from '@api/assessments';
import Button from '@components/ui/Button';
import Banner from '@components/ui/Banner';
import ConsequenceHeader from '@components/assessment/ConsequenceHeader';
import PreFlightPanel from '@components/assessment/PreFlightPanel';

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
  course_locked: 'Complete the prerequisite course to unlock this assessment.',
  attempts_exhausted: 'You have used all of your attempts for this assessment.',
  cooldown_active: 'A cooldown is active before you can try again.',
};

const formatMinutes = (seconds) =>
  seconds ? `${Math.round(seconds / 60)} min` : '—';

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

  // Pilot mode is server-declared; it uses the explicit pilot start endpoint —
  // never a fallback from a failed normal start — and sends no version/checksum.
  const isPilot = Boolean(assessment?.pilot);

  const start = useMutation({
    mutationFn: () =>
      isPilot ? startPilotAttempt(assessment.id) : startAttempt(assessment.id),
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
    return (
      <p aria-busy="true" className="p-6 text-body text-ink-secondary">
        Loading assessment…
      </p>
    );
  }
  if (isError) {
    return (
      <p className="p-6 text-body text-ink-secondary">
        {error?.message ?? 'Failed to load assessment.'}
      </p>
    );
  }

  const resumable = Boolean(
    assessment.can_resume && assessment.active_attempt_id,
  );
  const canStart = assessment.can_start;
  const nextEligible = assessment.next_eligible_at
    ? new Date(assessment.next_eligible_at).toLocaleString()
    : null;

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
    <div className="mx-auto max-w-2xl space-y-6">
      {isPilot ? (
        <Link
          to="/pilots"
          className="inline-flex items-center gap-1 text-body-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" /> Back to pilots
        </Link>
      ) : (
        <Link
          to="/learn/$trackId/$courseId"
          params={{ trackId, courseId }}
          className="inline-flex items-center gap-1 text-body-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" /> Back to course
        </Link>
      )}

      <ConsequenceHeader
        variant="course-assessment"
        title={assessment.title}
        meta={`Credential standard: ${TARGET_LEVEL_LABEL[assessment.target_level] ?? assessment.target_level}`}
      />

      {isPilot ? (
        <Banner variant="info" title="This is a pilot assessment">
          Completing it evaluates the assessment itself and does not issue a
          credential.
        </Banner>
      ) : null}

      {assessment.available ? (
        <>
          <PreFlightPanel
            stats={[
              {
                label: 'Time limit',
                value: formatMinutes(assessment.time_limit_seconds),
              },
              { label: 'Attempts', value: assessment.max_attempts },
              { label: 'Remaining', value: assessment.attempts_remaining },
              { label: 'Version', value: `v${assessment.version_no}` },
            ]}
            note="Once you start, the timer runs on the server and cannot be paused. Leaving does not stop the clock."
          />

          {!canStart && assessment.reason ? (
            <Banner variant="warning" title="Not available yet">
              {reasonMessage}
              {assessment.reason === 'cooldown_active' && nextEligible ? (
                <> You can try again after {nextEligible}.</>
              ) : null}
            </Banner>
          ) : null}

          <div>
            {resumable ? (
              <Button
                onClick={goToAttempt}
                iconStart={<ArrowPathIcon className="size-4" />}
              >
                Resume attempt
              </Button>
            ) : (
              <Button
                onClick={() => start.mutate()}
                disabled={!canStart}
                busy={start.isPending}
                busyLabel="Starting…"
              >
                {isPilot ? 'Start pilot assessment' : 'Start assessment'}
              </Button>
            )}
            {start.isError ? (
              <p className="mt-3 text-body-sm text-danger">
                {REASON_MESSAGE[start.error?.code] ?? start.error?.message}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <p className="text-body text-ink-secondary">
          {REASON_MESSAGE.assessment_unavailable}
        </p>
      )}
    </div>
  );
}
