import { useQuery } from '@tanstack/react-query';

import { getTracks, getEnrollments } from '@api/learn';
import CareerCard from '@components/learn/CareerCard';
import EmptyState from '@components/learn/EmptyState';

// Explore — published careers only. Publication is a server-authoritative rule:
// getTracks() hits the public career_tracks endpoint, which returns published
// careers. Preview-granted (unpublished) careers deliberately never appear here
// — they live in My Learning. No client filtering weakens the server rule, and
// no career count is hard-coded.

const CatalogSkeleton = () => (
  <ul
    aria-busy="true"
    className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
  >
    {[0, 1, 2].map((i) => (
      <li key={i} className="h-56 rounded-card border border-line bg-surface" />
    ))}
    <li className="sr-only">Loading careers…</li>
  </ul>
);

const Catalog = () => {
  const {
    data: tracks = [],
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['learn', 'tracks'], queryFn: getTracks });

  // Cross-reference the learner's enrollments purely to mark cards "Enrolled"
  // (presentation only — not an authorization decision).
  const { data: enrollments = [] } = useQuery({
    queryKey: ['learn', 'enrollments'],
    queryFn: getEnrollments,
  });
  const enrolledIds = new Set(
    enrollments.map((e) => e.career_track?.id).filter(Boolean),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-title-app font-semibold text-ink">
          Explore careers
        </h1>
        <p className="mt-2 max-w-prose text-body text-ink-secondary">
          A career is a structured path to one verifiable credential. You work
          through its courses in order, pass an assessment at the end of each,
          and finish with a qualification.
        </p>
      </header>

      {isLoading ? (
        <CatalogSkeleton />
      ) : isError ? (
        <p className="text-body text-ink-secondary">
          We couldn&apos;t load careers just now. Please try again.
          <span className="sr-only">{error?.message}</span>
        </p>
      ) : tracks.length === 0 ? (
        <EmptyState
          title="No careers published yet"
          description="Careers appear here once they are published. A career you have been given Preview access to shows in My Learning instead."
        />
      ) : (
        <>
          <p className="text-body-sm text-ink-muted">
            {tracks.length} {tracks.length === 1 ? 'career' : 'careers'}
          </p>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => (
              <li key={track.id}>
                <CareerCard
                  track={track}
                  enrolled={enrolledIds.has(track.id)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="border-t border-line pt-4 text-body-sm text-ink-muted">
        Explore lists published careers only. A career you have been given
        Preview access to appears in My Learning instead, because it is not
        publicly released.
      </p>
    </div>
  );
};

export default Catalog;
