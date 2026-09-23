import { useParams, useLocation, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';

import { getTrack, getTrackModules, getEnrollments, enroll } from '@api/learn';
import { getCareerInterview } from '@api/assessments';
import useBoundedPoll from '@hooks/useBoundedPoll';
import Card from '@components/ui/Card';
import Chip from '@components/ui/Chip';
import Button from '@components/ui/Button';
import StatusPill from '@components/ui/StatusPill';
import ProgressMeter from '@components/learn/ProgressMeter';
import CourseStage from '@components/learn/CourseStage';
import EmptyState from '@components/learn/EmptyState';

const credentialPending = (data) => data?.credential?.state === 'pending';

const LEVEL_LABELS = {
  beginner: 'Beginner',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};

const INTERVIEW_REASON = {
  career_not_ready: 'Opens when every course in this career is complete.',
  no_active_subscription: 'Your plan does not currently include this attempt.',
  cooldown_active: 'A cooldown is active before you can try again.',
  attempts_exhausted: 'You have used all of your attempts.',
};

// The Final Qualification is the career-level credential step and is the one
// place bronze (proof) is used on this page. All state is server-authoritative
// (getCareerInterview); the client never reconstructs readiness or retry rules.
// "Final Qualification" is the learner-facing name for the existing interview
// domain object — presentation only.
const FinalQualificationCard = ({ trackId }) => {
  const { intervalFn, stopped, reset } = useBoundedPoll({
    isPending: credentialPending,
    fast: 5000,
  });

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['career-interview', trackId],
    queryFn: () => getCareerInterview(trackId),
    retry: false,
    refetchInterval: intervalFn,
  });

  if (isLoading || isError || !data) return null;

  const { assessment, attempt, credential } = data;
  const level =
    LEVEL_LABELS[assessment.target_level] ?? assessment.target_level;

  let statusLine;
  let cta;
  if (credential.state === 'issued') {
    statusLine = 'Credential issued.';
    cta = { to: '/achievements', label: 'View credential' };
  } else if (attempt.state === 'passed') {
    statusLine = stopped
      ? 'Passed. Your credential is still being issued.'
      : 'Passed — your credential is being issued…';
  } else if (attempt.state === 'evaluating') {
    statusLine = 'Your attempt is being evaluated.';
  } else if (attempt.state === 'in_progress' && attempt.can_resume) {
    statusLine = 'You have an attempt in progress.';
    cta = {
      to: '/assessment-attempts/$attemptId',
      params: { attemptId: attempt.active_attempt_id },
      label: 'Resume Final Qualification',
    };
  } else if (attempt.can_start) {
    statusLine = 'You are ready for the Final Qualification.';
    cta = {
      to: '/learn/$trackId/interview',
      params: { trackId: String(trackId) },
      label:
        attempt.state === 'failed'
          ? 'Retry Final Qualification'
          : 'Start Final Qualification',
    };
  } else {
    statusLine = INTERVIEW_REASON[attempt.reason] ?? 'Not yet available.';
  }

  return (
    <Card variant="accented" accent="bronze" className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-eyebrow font-semibold uppercase tracking-wide text-bronze">
            Final Qualification · {level}
          </p>
          <p className="mt-1 text-body text-ink-secondary" role="status">
            {statusLine}
          </p>
        </div>
        {cta ? (
          <Link
            to={cta.to}
            params={cta.params}
            className="inline-flex h-10 items-center gap-2 rounded-control bg-bronze-action px-4 text-body font-semibold text-white hover:opacity-90"
          >
            {cta.label}
          </Link>
        ) : null}
        {stopped && credentialPending(data) ? (
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              refetch();
            }}
            busy={isFetching}
            busyLabel="Checking…"
          >
            Check again
          </Button>
        ) : null}
      </div>
    </Card>
  );
};

const TrackDetail = () => {
  const { trackId } = useParams({ strict: false });
  const queryClient = useQueryClient();

  const pathname = useLocation({ select: (location) => location.pathname });
  const fromMyLearning = pathname.startsWith('/my-learning');
  const backTo = fromMyLearning ? '/my-learning' : '/learn';
  const backLabel = fromMyLearning ? 'My Learning' : 'Explore';

  const {
    data: track,
    isLoading: trackLoading,
    isError: trackError,
  } = useQuery({
    queryKey: ['learn', 'track', trackId],
    queryFn: () => getTrack(trackId),
    retry: false,
  });

  const {
    data: modules = [],
    isLoading: modulesLoading,
    isError: modulesError,
  } = useQuery({
    queryKey: ['learn', 'track', trackId, 'modules'],
    queryFn: () => getTrackModules(trackId),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['learn', 'enrollments'],
    queryFn: getEnrollments,
  });
  const enrollment = enrollments.find((e) => e.career_track?.id === trackId);

  const { mutate: enrollMutate, isPending: enrolling } = useMutation({
    mutationFn: () => enroll(trackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learn', 'enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['learn', 'track', trackId] });
    },
  });

  return (
    <div className="space-y-8">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1 text-body-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        {backLabel}
      </Link>

      {trackLoading ? (
        <p aria-busy="true" className="text-body text-ink-secondary">
          Loading…
        </p>
      ) : trackError ? (
        <EmptyState
          title="This career isn't available"
          description="This career isn't available to your account."
        />
      ) : track ? (
        <>
          <header className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 max-w-2xl">
                <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
                  Career
                </p>
                <h1 className="mt-1 text-title-app font-semibold text-ink">
                  {track.name}
                </h1>
                {track.description ? (
                  <p className="mt-2 text-body text-ink-secondary">
                    {track.description}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0">
                {enrollment ? (
                  <StatusPill status="info">Enrolled</StatusPill>
                ) : (
                  <Button
                    onClick={() => enrollMutate()}
                    busy={enrolling}
                    busyLabel="Enrolling…"
                  >
                    Enrol in this career
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {track.target_level ? (
                <Chip>
                  Target seniority ·{' '}
                  {LEVEL_LABELS[track.target_level] ?? track.target_level}
                </Chip>
              ) : null}
              {typeof track.courses_count === 'number' ? (
                <Chip>
                  {track.courses_count}{' '}
                  {track.courses_count === 1 ? 'course' : 'courses'}
                </Chip>
              ) : null}
              <Chip>Sequential</Chip>
            </div>

            {enrollment ? (
              <div className="max-w-md">
                <ProgressMeter
                  completed={enrollment.progress?.completed ?? 0}
                  total={enrollment.progress?.total ?? 0}
                />
              </div>
            ) : null}
          </header>

          <section className="space-y-3">
            <h2 className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
              The path to the credential
            </h2>
            {modulesLoading ? (
              <p aria-busy="true" className="text-body text-ink-secondary">
                Loading courses…
              </p>
            ) : modulesError ? (
              <p className="text-body text-ink-secondary">
                Courses aren&apos;t available to your account.
              </p>
            ) : modules.length === 0 ? (
              <p className="text-body text-ink-secondary">
                No courses in this career yet.
              </p>
            ) : (
              <Card className="overflow-hidden">
                <ul className="divide-y divide-line">
                  {modules.map((module, index) => (
                    <CourseStage
                      key={module.id}
                      number={index + 1}
                      title={module.title}
                      level={module.level}
                      description={module.description}
                      status={module.progression?.status ?? 'available'}
                      unlockRequirement={module.progression?.unlock_requirement}
                      estimatedHours={module.estimated_hours}
                      trackId={trackId}
                      courseId={module.id}
                    />
                  ))}
                </ul>
              </Card>
            )}
          </section>

          <FinalQualificationCard trackId={trackId} />
        </>
      ) : null}
    </div>
  );
};

export default TrackDetail;
