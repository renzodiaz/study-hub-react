import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BeakerIcon, ArrowRightIcon } from '@heroicons/react/20/solid';

import { getPilotAssessments } from '@api/assessments';
import { Card, Chip, Banner, Spinner } from '@components/ui';

const TARGET_LEVEL_LABEL = {
  mid_senior: 'Mid / Senior',
};

// The learner's own active controlled-pilot assessments. This is the dedicated
// entry point for reaching a pilot (draft) assessment whose track is not yet
// published, so it cannot be found through the normal catalog. The list is
// server-derived from the learner's active grants; it carries no grading data
// and passing a pilot never issues a credential.
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-tint text-primary">
          <BeakerIcon aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h1 className="text-title-app font-semibold tracking-tight text-ink">
            Pilot assessments
          </h1>
          <p className="mt-1 text-body-sm text-ink-secondary">
            Assessments you have been invited to pilot. These are for evaluating
            the assessment — completing one does not issue a credential.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 flex items-center gap-3 text-body text-ink-muted">
          <Spinner /> Loading pilots…
        </div>
      ) : isError ? (
        <Banner variant="danger" className="mt-8">
          {error?.message ?? 'Failed to load pilot assessments.'}
        </Banner>
      ) : pilots.length === 0 ? (
        <Card variant="sunken" className="mt-8 p-8 text-center">
          <p className="text-body text-ink-secondary">
            You have no pilot assessments right now.
          </p>
          <p className="mt-1 text-body-sm text-ink-muted">
            When you’re invited to pilot an assessment, it will appear here.
          </p>
        </Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {pilots.map((pilot) => (
            <Card as="li" key={pilot.assessment_id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-card font-semibold text-ink">
                    {pilot.title}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-ink-muted">
                    {pilot.course_title && <span>{pilot.course_title}</span>}
                    <Chip>
                      {TARGET_LEVEL_LABEL[pilot.target_level] ??
                        pilot.target_level}
                    </Chip>
                  </div>
                </div>
                {pilot.track_id && pilot.course_id ? (
                  <Link
                    to="/learn/$trackId/$courseId/assessment"
                    params={{
                      trackId: pilot.track_id,
                      courseId: pilot.course_id,
                    }}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-control bg-primary px-4 text-body font-semibold text-white hover:bg-primary-hover"
                  >
                    Open{' '}
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                  </Link>
                ) : (
                  <span className="shrink-0 text-body-sm text-ink-muted">
                    Unavailable
                  </span>
                )}
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
