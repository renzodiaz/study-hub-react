import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from '@heroicons/react/20/solid';

import { getEnrollments, getPreviewTracks } from '@api/learn';
import Card from '@components/ui/Card';
import Chip from '@components/ui/Chip';
import StatusPill from '@components/ui/StatusPill';
import ProgressMeter from '@components/learn/ProgressMeter';
import EmptyState from '@components/learn/EmptyState';

// A controlled-access ("Preview") career the learner has been granted access to
// while it is not yet publicly released (CareerTrackTestAccess — an
// authorization state, distinct from Enrollment). Discovery only: it links into
// the normal career page and makes no claim about the credential/exam. Preview
// is not Free, not public, not published, not Pilot, and not credential
// evidence.
const PreviewCard = ({ track }) => (
  <Card className="flex flex-col p-6">
    <div className="flex items-start justify-between gap-3">
      <h3 className="text-card font-semibold text-ink">
        <Link
          to="/learn/$trackId"
          params={{ trackId: String(track.id) }}
          className="rounded-chip hover:text-primary"
        >
          {track.name}
        </Link>
      </h3>
      <Chip variant="dashed">Preview</Chip>
    </div>
    <p className="mt-3 grow text-body-sm text-ink-muted">
      Preview — not yet publicly released.
    </p>
    <div className="mt-6">
      <Link
        to="/learn/$trackId"
        params={{ trackId: String(track.id) }}
        className="inline-flex items-center gap-1 text-body font-medium text-primary hover:text-primary-hover"
      >
        View career
        <ArrowRightIcon aria-hidden="true" className="size-4" />
      </Link>
    </div>
  </Card>
);

// An enrolled career. A still-Preview enrolled track keeps a subtle dashed
// Preview chip (Case B), but is shown once, as the enrolled/progress card.
// Progress is the track-scoped lesson progress the API supplies — never
// relabelled as Course progress.
const EnrollmentCard = ({ enrollment, isPreview = false }) => {
  const track = enrollment.career_track;
  const { completed = 0, total = 0 } = enrollment.progress ?? {};

  return (
    <Card className="flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-card font-semibold text-ink">
          <Link
            to="/my-learning/$trackId"
            params={{ trackId: String(track.id) }}
            className="rounded-chip hover:text-primary"
          >
            {track.name}
          </Link>
        </h3>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <StatusPill status="info">Enrolled</StatusPill>
          {isPreview ? <Chip variant="dashed">Preview</Chip> : null}
        </div>
      </div>

      <div className="mt-4 grow">
        <ProgressMeter completed={completed} total={total} />
      </div>

      <div className="mt-6">
        <Link
          to="/my-learning/$trackId"
          params={{ trackId: String(track.id) }}
          className="inline-flex items-center gap-1 text-body font-medium text-primary hover:text-primary-hover"
        >
          Continue
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </Card>
  );
};

const Section = ({ title, description, children }) => (
  <section>
    <h2 className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
      {title}
    </h2>
    {description ? (
      <p className="mt-1 text-body-sm text-ink-muted">{description}</p>
    ) : null}
    <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  </section>
);

const MyLearning = () => {
  const {
    data: enrollments = [],
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['learn', 'enrollments'], queryFn: getEnrollments });

  const { data: previewTracks = [] } = useQuery({
    queryKey: ['learn', 'preview-tracks'],
    queryFn: getPreviewTracks,
  });

  // A CareerTrack can be both Preview-granted AND enrolled; those are distinct
  // domain records but ONE learning program, so it must appear once. Dedupe by
  // stable CareerTrack id (sqid) — never by title. Enrolled tracks are the
  // learner's primary state, so they render as the enrolled/progress card; a
  // still-Preview enrolled track keeps a subtle Preview indicator. Preview
  // grants with no enrollment yet stay under "Preview access".
  const enrolledTrackIds = new Set(
    enrollments.map((e) => e.career_track?.id).filter(Boolean),
  );
  const previewTrackIds = new Set(previewTracks.map((t) => t.id));
  const previewOnlyTracks = previewTracks.filter(
    (t) => !enrolledTrackIds.has(t.id),
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-title-app font-semibold text-ink">My Learning</h1>
        <p className="mt-2 text-body text-ink-secondary">
          Everything you have access to — enrolled or granted.
        </p>
      </header>

      {isLoading ? (
        <p aria-busy="true" className="text-body text-ink-secondary">
          Loading your learning…
        </p>
      ) : isError ? (
        <p className="text-body text-ink-secondary">
          We couldn&apos;t load your learning just now. Please try again.
          <span className="sr-only">{error?.message}</span>
        </p>
      ) : enrollments.length === 0 && previewOnlyTracks.length === 0 ? (
        <EmptyState
          title="You're not on a career yet"
          description="Enrol in a career to start an ordered path of courses toward a credential."
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
      ) : (
        <div className="space-y-8">
          {enrollments.length > 0 ? (
            <Section title="In progress">
              {enrollments.map((enrollment) => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  isPreview={previewTrackIds.has(enrollment.career_track?.id)}
                />
              ))}
            </Section>
          ) : null}

          {previewOnlyTracks.length > 0 ? (
            <Section
              title="Preview access — not yet enrolled"
              description="Careers you can preview before they're publicly released."
            >
              {previewOnlyTracks.map((track) => (
                <PreviewCard key={track.id} track={track} />
              ))}
            </Section>
          ) : null}
        </div>
      )}

      <p className="border-t border-line pt-4 text-body-sm text-ink-muted">
        A career you can preview appears once. If you also enrol in it, the
        enrolled card is the only one shown and keeps a small Preview mark — the
        experience is the ordinary one, not a separate mode.
      </p>
    </div>
  );
};

export default MyLearning;
