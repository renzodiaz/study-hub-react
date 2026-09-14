import { useParams, useLocation, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from '@heroicons/react/20/solid';

import { getTrack, getTrackModules, getEnrollments, enroll } from '@api/learn';
import { getCareerInterview } from '@api/assessments';
import useBoundedPoll from '@hooks/useBoundedPoll';
import { classNames } from '@utils/helpers';

const credentialPending = (data) => data?.credential?.state === 'pending';

const INTERVIEW_LEVEL_LABELS = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};

const INTERVIEW_REASON = {
  career_not_ready: 'Complete every course in this track to unlock it.',
  no_active_subscription: 'A paid subscription is required to start it.',
  cooldown_active: 'A cooldown is active before you can try again.',
  attempts_exhausted: 'You have used all of your interview attempts.',
};

// Server-authoritative final-interview step. Renders qualification/attempt/
// credential state as reported; never reconstructs readiness or retry rules.
const FinalInterviewCard = ({ trackId }) => {
  const { intervalFn, stopped, reset } = useBoundedPoll({
    isPending: credentialPending,
    fast: 5000,
  });

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['career-interview', trackId],
    queryFn: () => getCareerInterview(trackId),
    retry: false,
    // Bounded/backoff polling only while a passed interview's credential is
    // still being issued; stops after the automatic window (see useBoundedPoll).
    refetchInterval: intervalFn,
  });

  if (isLoading || isError || !data) return null; // no interview configured / unavailable

  const { assessment, attempt, credential } = data;
  const level =
    INTERVIEW_LEVEL_LABELS[assessment.target_level] ?? assessment.target_level;

  let statusLine;
  let cta;
  if (credential.state === 'issued') {
    statusLine = 'Credential issued.';
    cta = { to: '/achievements', label: 'View credential' };
  } else if (attempt.state === 'passed') {
    statusLine = stopped
      ? 'Your interview is passed. Your credential is still being issued.'
      : 'Interview passed — your credential is being issued…';
  } else if (attempt.state === 'evaluating') {
    statusLine = 'Your interview is being evaluated.';
  } else if (attempt.state === 'in_progress' && attempt.can_resume) {
    statusLine = 'You have an interview in progress.';
    cta = {
      to: '/assessment-attempts/$attemptId',
      params: { attemptId: attempt.active_attempt_id },
      label: 'Resume final interview',
    };
  } else if (attempt.can_start) {
    statusLine = 'You are ready for the final interview.';
    cta = {
      to: '/learn/$trackId/interview',
      params: { trackId: String(trackId) },
      label:
        attempt.state === 'failed'
          ? 'Retry final interview'
          : 'Start final interview',
    };
  } else {
    statusLine = INTERVIEW_REASON[attempt.reason] ?? 'Not yet available.';
  }

  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
            Final interview · {level}
          </h2>
          <p className="mt-1 text-sm text-gray-700" role="status">
            {statusLine}
          </p>
        </div>
        {cta && (
          <Link
            to={cta.to}
            params={cta.params}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            {cta.label}
          </Link>
        )}
        {stopped && credentialPending(data) && (
          <button
            type="button"
            onClick={() => {
              reset();
              refetch();
            }}
            disabled={isFetching}
            className="inline-flex items-center rounded-md border border-indigo-300 px-3.5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            {isFetching ? 'Checking…' : 'Check again'}
          </button>
        )}
      </div>
    </div>
  );
};

const LEVEL_LABELS = {
  beginner: 'Beginner',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};

// The backend owns progression; the UI only renders the status it reports.
// Missing progression (older payload) is treated as available so nothing breaks.
const courseStatus = (module) => module.progression?.status ?? 'available';

const StatusBadge = ({ status }) => {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-x-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
        <CheckCircleIcon className="size-3.5" />
        Completed
      </span>
    );
  }
  if (status === 'locked') {
    return (
      <span className="inline-flex items-center gap-x-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        <LockClosedIcon className="size-3.5" />
        Locked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
      Available
    </span>
  );
};

// Copy for a locked course: name the prerequisite, or prompt enrollment when the
// course is only locked because the learner hasn't enrolled (no prerequisite).
const lockReason = (module) => {
  const req = module.progression?.unlock_requirement;
  return req ? `Complete ${req.name} to unlock` : 'Enroll to unlock';
};

const ModuleRow = ({ module, index, trackId }) => {
  const status = courseStatus(module);
  const locked = status === 'locked';

  const body = (
    <>
      <div
        className={classNames(
          'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
          locked ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-600',
        )}
      >
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3
            className={classNames(
              'text-sm font-semibold',
              locked ? 'text-gray-400' : 'text-gray-900',
            )}
          >
            {module.title}
          </h3>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            {LEVEL_LABELS[module.level] ?? module.level}
          </span>
          <StatusBadge status={status} />
          {module.estimated_hours != null && (
            <span className="inline-flex items-center gap-x-1 text-xs text-gray-500">
              <ClockIcon className="size-3.5" />
              {module.estimated_hours}h
            </span>
          )}
        </div>
        {locked ? (
          <p className="mt-1 text-sm font-medium text-gray-500">
            {lockReason(module)}
          </p>
        ) : (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
            {module.description}
          </p>
        )}
      </div>
    </>
  );

  // Locked courses stay visible on the roadmap but are NOT navigable and offer
  // no entry action (the backend also denies direct access).
  if (locked) {
    return (
      <li
        aria-disabled="true"
        className="flex cursor-not-allowed items-start gap-x-4 py-5"
      >
        {body}
      </li>
    );
  }

  return (
    <li>
      <Link
        to="/learn/$trackId/$courseId"
        params={{ trackId: String(trackId), courseId: String(module.id) }}
        className="flex items-start gap-x-4 py-5 hover:bg-gray-50"
      >
        {body}
      </Link>
    </li>
  );
};

const TrackDetail = () => {
  const { trackId } = useParams({ strict: false });

  // The page is shared by /learn/:id and /my-learning/:id — point "back" at
  // whichever section the learner came from.
  const pathname = useLocation({ select: (location) => location.pathname });
  const fromMyLearning = pathname.startsWith('/my-learning');
  const backTo = fromMyLearning ? '/my-learning' : '/learn';
  const backLabel = fromMyLearning ? 'My learning' : 'All careers';

  const { data: track, isLoading: trackLoading } = useQuery({
    queryKey: ['learn', 'track', trackId],
    queryFn: () => getTrack(trackId),
  });

  const {
    data: modules = [],
    isLoading: modulesLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['learn', 'track', trackId, 'modules'],
    queryFn: () => getTrackModules(trackId),
  });

  const queryClient = useQueryClient();

  const { data: enrollments = [] } = useQuery({
    queryKey: ['learn', 'enrollments'],
    queryFn: getEnrollments,
  });

  const enrollment = enrollments.find((e) => e.career_track?.id === trackId);

  const { mutate: enrollMutate, isPending: enrolling } = useMutation({
    mutationFn: () => enroll(trackId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['learn', 'enrollments'] }),
  });

  return (
    <div className="space-y-8">
      <Link
        to={backTo}
        className="inline-flex items-center gap-x-1 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="size-4" />
        {backLabel}
      </Link>

      {trackLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        track && (
          <div className="flex items-start justify-between gap-x-4">
            <div className="flex items-start gap-x-4">
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-xl text-2xl font-semibold text-white"
                style={{ backgroundColor: track.color ?? '#6366f1' }}
              >
                {track.icon ?? '📚'}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {track.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-500">
                  {track.description}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {enrollment ? (
                <span className="inline-flex items-center gap-x-1.5 rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                  <CheckCircleIcon className="size-5" />
                  Enrolled · {enrollment.progress?.percent ?? 0}%
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => enrollMutate()}
                  disabled={enrolling}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {enrolling ? 'Enrolling…' : 'Enroll'}
                </button>
              )}
            </div>
          </div>
        )
      )}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Modules
        </h2>
        {modulesLoading ? (
          <p className="mt-4 text-sm text-gray-500">Loading modules...</p>
        ) : isError ? (
          <p className="mt-4 text-sm text-red-600">{error.message}</p>
        ) : modules.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No modules in this career yet.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white px-6 shadow-sm">
            {modules.map((module, index) => (
              <ModuleRow
                key={module.id}
                module={module}
                index={index}
                trackId={trackId}
              />
            ))}
          </ul>
        )}
      </div>

      <FinalInterviewCard trackId={trackId} />
    </div>
  );
};

export default TrackDetail;
