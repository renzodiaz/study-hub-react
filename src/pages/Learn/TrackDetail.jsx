import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/20/solid';

import { getTrack, getTrackModules } from '@api/learn';

const LEVEL_LABELS = {
  beginner: 'Beginner',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};

const ModuleRow = ({ module, index }) => (
  <li className="flex items-start gap-x-4 py-5">
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
      {index + 1}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold text-gray-900">{module.title}</h3>
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
          {LEVEL_LABELS[module.level] ?? module.level}
        </span>
        {module.estimated_hours != null && (
          <span className="inline-flex items-center gap-x-1 text-xs text-gray-500">
            <ClockIcon className="size-3.5" />
            {module.estimated_hours}h
          </span>
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
        {module.description}
      </p>
    </div>
  </li>
);

const TrackDetail = () => {
  const { trackId } = useParams({ strict: false });

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

  return (
    <div className="space-y-8">
      <Link
        to="/learn"
        className="inline-flex items-center gap-x-1 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="size-4" />
        All careers
      </Link>

      {trackLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        track && (
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
              <ModuleRow key={module.id} module={module} index={index} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TrackDetail;
