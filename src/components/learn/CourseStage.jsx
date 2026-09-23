import { Link } from '@tanstack/react-router';
import {
  CheckCircleIcon,
  LockClosedIcon,
  ClockIcon,
  ArrowRightIcon,
} from '@heroicons/react/20/solid';

import StatusPill from '@components/ui/StatusPill';
import Chip from '@components/ui/Chip';
import { classNames as cn } from '@utils/helpers';

// One course stage on the Career "path to the credential". State comes from the
// server's per-course progression (available / locked / completed) — the client
// never recomputes it from position or certificates. A locked stage is
// non-interactive and names its prerequisite (server-supplied unlock_requirement),
// or prompts enrolment when it is locked only because the learner has not
// enrolled.

const LEVEL_LABELS = {
  beginner: 'Beginner',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};

const StatusMark = ({ status }) => {
  if (status === 'completed') {
    return <StatusPill status="success">Completed</StatusPill>;
  }
  if (status === 'locked') {
    return <StatusPill status="neutral">Locked</StatusPill>;
  }
  return <StatusPill status="info">Available</StatusPill>;
};

const CourseStage = ({
  number,
  title,
  level,
  description,
  status = 'available',
  unlockRequirement,
  estimatedHours,
  trackId,
  courseId,
}) => {
  const locked = status === 'locked';
  const done = status === 'completed';

  const numberCircle = (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-pill text-body-sm font-semibold',
        locked
          ? 'bg-surface-sunken text-ink-disabled'
          : done
            ? 'bg-success-tint text-success'
            : 'bg-primary-tint text-primary',
      )}
    >
      {done ? (
        <CheckCircleIcon aria-hidden="true" className="size-5" />
      ) : locked ? (
        <LockClosedIcon aria-hidden="true" className="size-4" />
      ) : (
        number
      )}
    </div>
  );

  const body = (
    <>
      {numberCircle}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3
            className={cn(
              'text-card font-semibold',
              locked ? 'text-ink-disabled' : 'text-ink',
            )}
          >
            {title}
          </h3>
          {level ? <Chip>{LEVEL_LABELS[level] ?? level}</Chip> : null}
          <StatusMark status={status} />
          {estimatedHours != null ? (
            <span className="inline-flex items-center gap-1 text-body-sm text-ink-muted">
              <ClockIcon aria-hidden="true" className="size-3.5" />
              {estimatedHours}h
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            'mt-1 text-body-sm',
            locked ? 'text-ink-muted' : 'text-ink-secondary',
          )}
        >
          {locked
            ? unlockRequirement
              ? `Complete ${unlockRequirement.name} to unlock`
              : 'Enrol to unlock'
            : description}
        </p>
      </div>
      {!locked ? (
        <ArrowRightIcon
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-ink-muted"
        />
      ) : null}
    </>
  );

  if (locked) {
    return (
      <li
        aria-disabled="true"
        className="flex cursor-not-allowed items-start gap-4 p-4"
      >
        {body}
      </li>
    );
  }

  return (
    <li>
      <Link
        to="/learn/$trackId/$courseId"
        params={{ trackId: String(trackId), courseId: String(courseId) }}
        className="flex items-start gap-4 p-4 hover:bg-primary-wash"
      >
        {body}
      </Link>
    </li>
  );
};

export default CourseStage;
