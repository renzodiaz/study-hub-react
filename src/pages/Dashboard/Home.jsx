import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRightIcon, BookOpenIcon } from '@heroicons/react/20/solid';

import { getEnrollments } from '@api/learn';
import StatusPill from '@components/ui/StatusPill';
import ContinueCard from '@components/learn/ContinueCard';
import EmptyState from '@components/learn/EmptyState';

// Home — the learner's concise continuation/orientation surface (§6). It is
// deliberately calm: current career, one clear next action, current progress.
// It is not an analytics dashboard, feed or gamified screen.
//
// Attention band (§7): the design shows an at-most-one attention item ranked
// access → money → opportunity. None of those states is derivable from the data
// the frontend currently holds (no billing/security/opportunity signal is
// exposed to Home), so no band is rendered. The page works without it, and no
// marketing filler occupies the space. Wiring it awaits the relevant server
// contracts.

const HomeSkeleton = () => (
  <div aria-busy="true" className="space-y-6">
    <div className="h-8 w-64 rounded-chip bg-surface-sunken" />
    <div className="h-40 rounded-card border border-line bg-surface" />
    <span className="sr-only">Loading your home…</span>
  </div>
);

const Home = () => {
  const {
    data: enrollments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['learn', 'enrollments'],
    queryFn: getEnrollments,
  });

  if (isLoading) return <HomeSkeleton />;

  if (isError) {
    return (
      <div>
        <h1 className="text-title-app font-semibold text-ink">Home</h1>
        <p className="mt-4 text-body text-ink-secondary">
          We couldn&apos;t load your learning just now. Please try again.
        </p>
        <p className="sr-only">{error?.message}</p>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-title-app font-semibold text-ink">Home</h1>
        <EmptyState
          icon={BookOpenIcon}
          title="You're not on a career yet"
          description="A career gives you an ordered path of courses and one credential at the end. Explore the careers you can take."
          action={
            <Link
              to="/learn"
              className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-4 text-body font-semibold text-white hover:bg-primary-hover"
            >
              Explore careers
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
          }
        />
      </div>
    );
  }

  // The career to continue: the in-progress enrollment closest to completion,
  // else the first enrollment. Server data decides what is accessible; nothing
  // is unlocked or computed here.
  const inProgress = enrollments
    .filter((e) => (e.progress?.percent ?? 0) < 100)
    .sort((a, b) => (b.progress?.percent ?? 0) - (a.progress?.percent ?? 0));
  const active = inProgress[0] ?? enrollments[0];
  const track = active.career_track;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
          Active career
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-title-app font-semibold text-ink">
            {track.name}
          </h1>
          <StatusPill status="info">Enrolled</StatusPill>
        </div>
        <Link
          to="/my-learning/$trackId"
          params={{ trackId: String(track.id) }}
          className="mt-2 inline-flex items-center gap-1 text-body font-medium text-primary hover:text-primary-hover"
        >
          View career path
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </header>

      <ContinueCard enrollment={active} />

      <Link
        to="/my-learning"
        className="inline-flex items-center gap-1 text-body font-medium text-primary hover:text-primary-hover"
      >
        View all my learning
        <ArrowRightIcon aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
};

export default Home;
