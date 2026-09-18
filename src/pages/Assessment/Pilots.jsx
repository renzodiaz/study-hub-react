import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BeakerIcon, ArrowRightIcon } from '@heroicons/react/20/solid';

import { getPilotAssessments } from '@api/assessments';

const TARGET_LEVEL_LABEL = {
  mid_senior: 'Mid / Senior',
};

// The learner's own active controlled-pilot assessments. This is the dedicated
// entry point for reaching a pilot (draft) assessment whose track is not yet
// published, so it cannot be found through the normal catalog. The list is
// server-derived from the learner's active grants; it carries no grading data.
export default function Pilots() {
  const {
    data: pilots = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['pilot-assessments'],
    queryFn: getPilotAssessments,
  });

  if (isLoading) {
    return <p className="p-6 text-sm text-gray-500">Loading pilots…</p>;
  }
  if (isError) {
    return (
      <p className="p-6 text-sm text-red-600">
        {error?.message ?? 'Failed to load pilot assessments.'}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center gap-3">
        <BeakerIcon className="size-8 text-indigo-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pilot assessments</h1>
          <p className="text-sm text-gray-500">
            Assessments you have been invited to pilot. These are for evaluating
            the assessment — completing one does not issue a credential.
          </p>
        </div>
      </div>

      {pilots.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">
          You have no pilot assessments right now.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {pilots.map((pilot) => (
            <li
              key={pilot.assessment_id}
              className="rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    {pilot.title}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {pilot.course_title ? `${pilot.course_title} · ` : ''}
                    {TARGET_LEVEL_LABEL[pilot.target_level] ??
                      pilot.target_level}
                  </p>
                </div>
                {pilot.track_id && pilot.course_id ? (
                  <Link
                    to="/learn/$trackId/$courseId/assessment"
                    params={{
                      trackId: pilot.track_id,
                      courseId: pilot.course_id,
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Open <ArrowRightIcon className="size-4" />
                  </Link>
                ) : (
                  <span className="text-xs text-gray-400">Unavailable</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
