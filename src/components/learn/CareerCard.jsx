import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from '@heroicons/react/20/solid';

import Card from '@components/ui/Card';
import Chip from '@components/ui/Chip';
import StatusPill from '@components/ui/StatusPill';

// A published-career discovery card for Explore. It renders only server-provided
// facts (title, description, courses_count, target_level) and never hard-codes
// course/section/lesson counts, invents outcomes, or infers entitlement. The
// `enrolled` flag is a truthful presentation cue derived from the learner's
// enrollments — not an authorization decision.
const CareerCard = ({ track, enrolled = false }) => {
  const trackId = String(track.id);
  const courseCount = track.courses_count;

  return (
    <Card className="flex flex-col p-6 transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-card font-semibold text-ink">
          <Link
            to="/learn/$trackId"
            params={{ trackId }}
            className="rounded-chip hover:text-primary"
          >
            {track.name}
          </Link>
        </h3>
        {enrolled ? <StatusPill status="info">Enrolled</StatusPill> : null}
      </div>

      {track.description ? (
        <p className="mt-3 line-clamp-3 grow text-body text-ink-secondary">
          {track.description}
        </p>
      ) : (
        <div className="grow" />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {track.target_level ? (
          <Chip>Target seniority · {track.target_level}</Chip>
        ) : null}
        {typeof courseCount === 'number' ? (
          <Chip>
            {courseCount} {courseCount === 1 ? 'course' : 'courses'}
          </Chip>
        ) : null}
      </div>

      <div className="mt-6">
        <Link
          to="/learn/$trackId"
          params={{ trackId }}
          className="inline-flex items-center gap-1 text-body font-medium text-primary hover:text-primary-hover"
        >
          {enrolled ? 'Continue' : 'View career'}
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </Card>
  );
};

export default CareerCard;
