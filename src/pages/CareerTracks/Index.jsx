import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';

import { getCareerTracks, deleteCareerTrack } from '@api/careerTracks';
import { useDrawer } from '@hooks/useDrawer';
import ContentHeading from '@layouts/partials/ContentHeading';
import PrimaryButton from '@components/PrimaryButton';
import CareerTrackForm from './CareerTrackForm';

const ConfirmDelete = ({ onConfirm, isPending }) => {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Delete career track"
        className="text-gray-400 hover:text-red-500"
      >
        <TrashIcon className="size-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-x-2">
      <span className="text-xs text-gray-500">Delete?</span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isPending}
        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs font-semibold text-gray-500 hover:text-gray-700"
      >
        No
      </button>
    </div>
  );
};

const CareerTracks = () => {
  const { openDrawer } = useDrawer();
  const queryClient = useQueryClient();

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['career_tracks'],
    queryFn: getCareerTracks,
  });

  const { mutate: removeTrack, isPending: deleting } = useMutation({
    mutationFn: deleteCareerTrack,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['career_tracks'] }),
  });

  const handleCreate = useCallback(() => {
    openDrawer(
      <CareerTrackForm />,
      'New Career Track',
      'Create a new learning path for your users.',
      'career-track-form',
    );
  }, [openDrawer]);

  const handleEdit = useCallback(
    (track) => {
      openDrawer(
        <CareerTrackForm careerTrack={track} />,
        'Edit Career Track',
        track.name,
        'career-track-form',
      );
    },
    [openDrawer],
  );

  return (
    <>
      <ContentHeading title="Career Tracks">
        <PrimaryButton title="New Track" onButtonClick={handleCreate} />
      </ContentHeading>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : tracks.length === 0 ? (
        <p className="text-sm text-gray-500">
          No career tracks yet. Create your first one!
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Track
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Slug
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Courses
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Pos
                </th>
                <th className="relative py-3 pl-3 pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tracks.map((track) => (
                <tr key={track.id} className="hover:bg-gray-50">
                  <td className="py-4 pl-6 pr-3">
                    <div className="flex items-center gap-x-3">
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-lg"
                        style={{ backgroundColor: track.color ?? '#6366f1' }}
                      >
                        {track.icon ?? '📚'}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {track.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className="font-mono text-xs text-gray-500">
                      {track.slug}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {track.courses_count ?? 0}
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        track.published
                          ? 'bg-green-50 text-green-700 ring-green-600/20'
                          : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                      }`}
                    >
                      {track.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {track.position}
                  </td>
                  <td className="py-4 pl-3 pr-6">
                    <div className="flex items-center justify-end gap-x-4">
                      <button
                        type="button"
                        onClick={() => handleEdit(track)}
                        aria-label="Edit career track"
                        className="text-gray-400 hover:text-indigo-600"
                      >
                        <PencilSquareIcon className="size-4" />
                      </button>
                      <ConfirmDelete
                        onConfirm={() => removeTrack(track.id)}
                        isPending={deleting}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default CareerTracks;
