import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { getEnrollments } from '@api/learn';
import ContentHeading from '@layouts/partials/ContentHeading';

const EnrollmentCard = ({ enrollment }) => {
  const track = enrollment.career_track;
  const { percent = 0, completed = 0, total = 0 } = enrollment.progress ?? {};

  return (
    <Link
      to="/my-learning/$trackId"
      params={{ trackId: String(track.id) }}
      className="group flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-center gap-x-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-lg font-semibold text-white"
          style={{ backgroundColor: track.color ?? '#6366f1' }}
        >
          {track.icon ?? '📚'}
        </div>
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600">
          {track.name}
        </h3>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500">
          <span>
            {completed} / {total} lessons
          </span>
          <span>{percent}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </Link>
  );
};

const MyLearning = () => {
  const {
    data: enrollments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['learn', 'enrollments'],
    queryFn: getEnrollments,
  });

  return (
    <>
      <ContentHeading title="My learning" />

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading your learning...</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{error.message}</p>
      ) : enrollments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            You haven&apos;t enrolled in any careers yet.
          </p>
          <Link
            to="/learn"
            className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Explore careers →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </>
  );
};

export default MyLearning;
