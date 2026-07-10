import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRightIcon, BookOpenIcon } from '@heroicons/react/20/solid';

import { getEnrollments } from '@api/learn';
import { useAuth } from '@hooks/useAuth';

const StatTile = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
      {value}
    </dd>
  </div>
);

const ContinueLearning = ({ enrollment }) => {
  const track = enrollment.career_track;
  const { percent = 0, completed = 0, total = 0 } = enrollment.progress ?? {};

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Continue learning
      </h2>
      <div className="mt-4 flex items-center gap-x-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-lg text-xl font-semibold text-white"
          style={{ backgroundColor: track.color ?? '#6366f1' }}
        >
          {track.icon ?? '📚'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900">
            {track.name}
          </h3>
          <div className="mt-2 flex items-center gap-x-3">
            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-600"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-gray-500">
              {completed}/{total}
            </span>
          </div>
        </div>
        <Link
          to="/my-learning/$trackId"
          params={{ trackId: String(track.id) }}
          className="inline-flex shrink-0 items-center gap-x-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Resume
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
    <BookOpenIcon className="mx-auto size-8 text-gray-400" />
    <p className="mt-3 text-sm text-gray-500">
      You haven&apos;t started learning yet.
    </p>
    <Link
      to="/learn"
      className="mt-4 inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
    >
      Explore careers
      <ArrowRightIcon className="size-4" />
    </Link>
  </div>
);

const Home = () => {
  const { user } = useAuth();
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['learn', 'enrollments'],
    queryFn: getEnrollments,
  });

  const totalCompleted = enrollments.reduce(
    (sum, e) => sum + (e.progress?.completed ?? 0),
    0,
  );
  const totalLessons = enrollments.reduce(
    (sum, e) => sum + (e.progress?.total ?? 0),
    0,
  );
  const overallPercent =
    totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  // Pick the enrollment closest to completion but not yet finished.
  const resumable = enrollments
    .filter((e) => (e.progress?.percent ?? 0) < 100)
    .sort((a, b) => (b.progress?.percent ?? 0) - (a.progress?.percent ?? 0))[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s where you left off.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading your dashboard...</p>
      ) : enrollments.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatTile label="Enrolled careers" value={enrollments.length} />
            <StatTile label="Lessons completed" value={totalCompleted} />
            <StatTile label="Overall progress" value={`${overallPercent}%`} />
          </dl>

          {resumable ? (
            <ContinueLearning enrollment={resumable} />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
              You&apos;ve completed every enrolled career. 🎉{' '}
              <Link
                to="/learn"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Explore more
              </Link>
            </div>
          )}

          <div>
            <Link
              to="/my-learning"
              className="inline-flex items-center gap-x-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              View all my learning
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
