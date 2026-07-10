import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from '@heroicons/react/20/solid';

import { getTracks } from '@api/learn';
import ContentHeading from '@layouts/partials/ContentHeading';

const TrackCard = ({ track }) => (
  <Link
    to="/learn/$trackId"
    params={{ trackId: String(track.id) }}
    className="group col-span-1 flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
  >
    <div className="flex items-center gap-x-4">
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-lg text-xl font-semibold text-white"
        style={{ backgroundColor: track.color ?? '#6366f1' }}
      >
        {track.icon ?? '📚'}
      </div>
      <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600">
        {track.name}
      </h3>
    </div>

    <p className="mt-4 line-clamp-3 grow text-sm text-gray-500">
      {track.description}
    </p>

    <div className="mt-6 flex items-center justify-between">
      <span className="text-xs font-medium text-gray-500">
        {track.courses_count ?? 0}{' '}
        {track.courses_count === 1 ? 'module' : 'modules'}
      </span>
      <span className="inline-flex items-center gap-x-1 text-sm font-semibold text-indigo-600">
        Explore
        <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
      </span>
    </div>
  </Link>
);

const Catalog = () => {
  const {
    data: tracks = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['learn', 'tracks'],
    queryFn: getTracks,
  });

  return (
    <>
      <ContentHeading title="Explore careers" />

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading careers...</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{error.message}</p>
      ) : tracks.length === 0 ? (
        <p className="text-sm text-gray-500">No careers available yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </ul>
      )}
    </>
  );
};

export default Catalog;
