import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { getEnrollments, getPreviewTracks } from '@api/learn';
import ContentHeading from '@layouts/partials/ContentHeading';

// A controlled-access ("Preview") career the learner has been granted access to
// while it is not yet publicly released. Discovery only — links into the normal
// TrackDetail experience; deliberately makes no claim about the credential/exam.
const PreviewCard = ({ track }) => (
  <Link
    to="/learn/$trackId"
    params={{ trackId: String(track.id) }}
    className="group flex flex-col rounded-lg border border-indigo-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
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
    <span className="mt-4 inline-flex w-fit items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
      Preview — not yet publicly released
    </span>
  </Link>
);

const EnrollmentCard = ({ enrollment, isPreview = false }) => {
  const track = enrollment.career_track;
  const { percent = 0, completed = 0, total = 0 } = enrollment.progress ?? {};

  return (
    <Link
      to="/my-learning/$trackId"
      params={{ trackId: String(track.id) }}
      className={`group flex flex-col rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md ${isPreview ? 'border-indigo-200 hover:border-indigo-300' : 'border-gray-200 hover:border-indigo-300'}`}
    >
      <div className="flex items-center gap-x-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-lg font-semibold text-white"
          style={{ backgroundColor: track.color ?? '#6366f1' }}
        >
          {track.icon ?? '📚'}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600">
            {track.name}
          </h3>
          {isPreview && (
            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              Preview — not yet publicly released
            </span>
          )}
        </div>
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

  const { data: previewTracks = [] } = useQuery({
    queryKey: ['learn', 'preview-tracks'],
    queryFn: getPreviewTracks,
  });

  // A CareerTrack can be both Preview-granted AND enrolled; those are distinct
  // domain records but ONE learning program, so it must appear once. Dedupe by
  // stable CareerTrack id (sqid) — never by title. Enrolled tracks are the
  // learner's primary state, so they render as the enrolled/progress card; a
  // still-Preview enrolled track keeps a subtle Preview indicator. Preview grants
  // with no enrollment yet stay under "Preview access".
  const enrolledTrackIds = new Set(
    enrollments.map((e) => e.career_track?.id).filter(Boolean),
  );
  const previewTrackIds = new Set(previewTracks.map((t) => t.id));
  const previewOnlyTracks = previewTracks.filter(
    (t) => !enrolledTrackIds.has(t.id),
  );

  return (
    <>
      <ContentHeading title="My learning" />

      {previewOnlyTracks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Preview access
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Careers you can preview before they&apos;re publicly released.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {previewOnlyTracks.map((track) => (
              <PreviewCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      )}

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
            <EnrollmentCard
              key={enrollment.id}
              enrollment={enrollment}
              isPreview={previewTrackIds.has(enrollment.career_track?.id)}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default MyLearning;
