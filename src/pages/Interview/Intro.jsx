import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/20/solid';

import { getCareerInterview, startAttempt } from '@api/assessments';
import Button from '@components/ui/Button';
import Banner from '@components/ui/Banner';
import Card from '@components/ui/Card';
import ConsequenceHeader from '@components/assessment/ConsequenceHeader';
import PreFlightPanel from '@components/assessment/PreFlightPanel';

const TARGET_LEVEL_LABEL = {
  mid_senior: 'Mid-Senior',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};

// Human copy for a server-provided ineligibility reason. The server is the
// authority; this only renders what it decided. No scheduling, no human-review,
// no evaluator implementation is ever implied.
const REASON_MESSAGE = {
  no_active_subscription: 'Your plan does not currently include this attempt.',
  career_not_ready: 'Opens when every course in this career is complete.',
  evaluation_pending:
    'Your qualification has been submitted and is being evaluated.',
  already_passed: 'You have already passed this qualification.',
  cooldown_active: 'A cooldown is active before you can try again.',
  attempts_exhausted: 'You have used all of your attempts.',
};

const formatMinutes = (seconds) =>
  seconds ? `${Math.round(seconds / 60)} min` : '—';

const BackLink = ({ trackId }) => (
  <Link
    to="/learn/$trackId"
    params={{ trackId }}
    className="inline-flex items-center gap-1 text-body-sm text-ink-muted hover:text-ink"
  >
    <ArrowLeftIcon aria-hidden="true" className="size-4" /> Back to career
  </Link>
);

// The bronze credential-significance action used for the Final Qualification.
const BronzeLink = ({ to, params, children, iconStart }) => (
  <Link
    to={to}
    params={params}
    className="inline-flex h-11 items-center gap-2 rounded-control bg-bronze-action px-5 text-body font-semibold text-white hover:opacity-90"
  >
    {iconStart}
    {children}
  </Link>
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
      <p aria-busy="true" className="p-6 text-body text-ink-secondary">
        Loading the Final Qualification…
      </p>
    );
  }

  // interview_not_configured (404) or interview_misconfigured (409) → generic,
  // non-revealing copy. Never expose backend configuration detail.
  if (isError) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <BackLink trackId={trackId} />
        <p className="text-body text-ink-secondary">
          The Final Qualification is temporarily unavailable.
        </p>
      </div>
    );
  }

  const { assessment, attempt, credential } = data;
  const level =
    TARGET_LEVEL_LABEL[assessment.target_level] ?? assessment.target_level;

  const showReason =
    !attempt.can_start &&
    !attempt.can_resume &&
    attempt.reason &&
    attempt.state !== 'passed' &&
    attempt.state !== 'evaluating';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackLink trackId={trackId} />

      <ConsequenceHeader
        variant="final-qualification"
        title={assessment.title}
        meta={`${level} level · one integrative qualification across the whole career`}
      />

      <p className="text-body text-ink-secondary">
        This is the Final Qualification — a single assessment that integrates
        across the entire Frontend {level} career, not another course
        assessment. Passing it, together with your Course Certificates, is what
        earns the Frontend {level} Seniority Badge.
      </p>

      <PreFlightPanel
        stats={[
          { label: 'Questions', value: assessment.questions_count },
          {
            label: 'Time limit',
            value: formatMinutes(assessment.time_limit_seconds),
          },
          { label: 'Attempts', value: assessment.max_attempts },
          { label: 'Remaining', value: attempt.attempts_remaining },
        ]}
        note="Once you start, this is a consequential attempt: the timer runs on the server and leaving does not stop it."
      />

      <Card className="p-4">
        <p className="text-body-sm text-ink-secondary">
          <span className="font-medium text-ink">Recommended setup.</span> For
          the best experience, use a laptop or desktop, a stable internet
          connection, and a place where you can work without interruption. This
          is a recommendation — you can begin on any device you are signed in
          on.
        </p>
      </Card>

      {showReason ? (
        <Banner variant="warning" title="Not available yet">
          {REASON_MESSAGE[attempt.reason] ??
            'You are not eligible to start yet.'}
          {attempt.reason === 'cooldown_active' && attempt.next_eligible_at ? (
            <>
              {' '}
              You can try again after{' '}
              {new Date(attempt.next_eligible_at).toLocaleString()}.
            </>
          ) : null}
        </Banner>
      ) : null}

      <div>
        {credential.state === 'issued' ? (
          <BronzeLink to="/achievements">View credential</BronzeLink>
        ) : attempt.state === 'in_progress' && attempt.can_resume ? (
          <BronzeLink
            to="/assessment-attempts/$attemptId"
            params={{ attemptId: attempt.active_attempt_id }}
            iconStart={<ArrowPathIcon aria-hidden="true" className="size-4" />}
          >
            Resume Final Qualification
          </BronzeLink>
        ) : attempt.state === 'evaluating' ? (
          <p role="status" className="text-body font-medium text-bronze">
            Evaluation in progress.
          </p>
        ) : attempt.state === 'passed' ? (
          <p className="text-body font-medium text-success">
            Final Qualification passed
            {credential.state === 'pending'
              ? ' — your credential is being issued.'
              : '.'}
          </p>
        ) : attempt.can_start ? (
          <Button
            variant="credential"
            size="lg"
            onClick={() => start.mutate()}
            busy={start.isPending}
            busyLabel="Starting…"
          >
            {attempt.state === 'failed'
              ? 'Retry Final Qualification'
              : 'Start Final Qualification'}
          </Button>
        ) : null}

        {start.isError ? (
          <p className="mt-3 text-body-sm text-danger">
            {REASON_MESSAGE[start.error?.code] ?? start.error?.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
