import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from '@heroicons/react/20/solid';

import Card from '@components/ui/Card';
import ProgressMeter from './ProgressMeter';

// The Home continuation panel — the single most important element on the
// dashboard (§6.3). It routes the learner back into their real current learning
// state. Progress is the track-scoped lesson progress the API supplies; it does
// not name a specific next lesson or a course position, because that data is not
// yet available (reported as a Career/Course backend gap). Resume links to the
// existing career page, which is unchanged in this milestone.
const ContinueCard = ({ enrollment }) => {
  const track = enrollment.career_track;
  const { percent = 0, completed = 0, total = 0 } = enrollment.progress ?? {};
  const trackId = String(track.id);

  return (
    <Card variant="accented" accent="primary" className="p-6">
      <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
        Continue where you left off
      </p>
      <h2 className="mt-2 text-section font-semibold text-ink">{track.name}</h2>

      <div className="mt-4 max-w-md">
        <ProgressMeter completed={completed} total={total} />
      </div>

      <div className="mt-6">
        <Link
          to="/my-learning/$trackId"
          params={{ trackId }}
          className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-4 text-body font-semibold text-white hover:bg-primary-hover"
        >
          Resume
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {percent >= 100 ? (
        <p className="mt-3 text-body-sm text-ink-muted">
          You&apos;ve completed every lesson in this career.
        </p>
      ) : null}
    </Card>
  );
};

export default ContinueCard;
