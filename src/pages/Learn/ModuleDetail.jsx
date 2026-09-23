import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { AcademicCapIcon, ArrowRightIcon } from '@heroicons/react/20/solid';

import {
  getModule,
  getModuleSections,
  getTrack,
  getTrackModules,
} from '@api/learn';
import Card from '@components/ui/Card';
import Breadcrumb from '@components/learn/Breadcrumb';
import ProgressMeter from '@components/learn/ProgressMeter';
import SectionGroup from '@components/learn/SectionGroup';
import EmptyState from '@components/learn/EmptyState';
import {
  courseLessonDisplay,
  courseLessonProgress,
} from '@components/learn/lessonProgress';

const ModuleDetail = () => {
  const { trackId, courseId } = useParams({ strict: false });

  const {
    data: module,
    isLoading: moduleLoading,
    isError: moduleError,
  } = useQuery({
    queryKey: ['learn', 'module', trackId, courseId],
    queryFn: () => getModule(trackId, courseId),
    retry: false,
  });

  const {
    data: sections = [],
    isLoading: sectionsLoading,
    isError: sectionsError,
  } = useQuery({
    queryKey: ['learn', 'module', trackId, courseId, 'sections'],
    queryFn: () => getModuleSections(trackId, courseId),
  });

  // Breadcrumb career label + "Course N of M" — both from already-cached queries.
  const { data: track } = useQuery({
    queryKey: ['learn', 'track', trackId],
    queryFn: () => getTrack(trackId),
    retry: false,
  });
  const { data: modules = [] } = useQuery({
    queryKey: ['learn', 'track', trackId, 'modules'],
    queryFn: () => getTrackModules(trackId),
  });

  const courseIndex = modules.findIndex((m) => m.id === courseId);
  const courseNumber = courseIndex >= 0 ? courseIndex + 1 : null;
  const courseTotal = modules.length || null;

  const display = courseLessonDisplay(sections);
  const displayById = new Map(display.map((d) => [d.id, d]));
  const progress = courseLessonProgress(sections);

  const breadcrumbItems = [];
  if (track) {
    breadcrumbItems.push({
      label: track.name,
      to: '/learn/$trackId',
      params: { trackId },
    });
  }
  if (module) breadcrumbItems.push({ label: module.title });

  return (
    <div className="space-y-8">
      {moduleLoading ? (
        <p aria-busy="true" className="text-body text-ink-secondary">
          Loading…
        </p>
      ) : moduleError ? (
        // The backend hides an inaccessible course (404/403) without disclosing
        // whether the cause is progression, entitlement or publication, so the
        // copy stays neutral and never leaks existence. Server-authoritative
        // "complete X to unlock" messaging lives on the career roadmap.
        <EmptyState
          title="This course isn't available"
          description="This course isn't available to your account."
        />
      ) : module ? (
        <>
          <header className="space-y-3">
            <Breadcrumb items={breadcrumbItems} />
            {courseNumber && courseTotal ? (
              <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
                Course {courseNumber} of {courseTotal}
              </p>
            ) : null}
            <h1 className="text-title-app font-semibold text-ink">
              {module.title}
            </h1>
            {module.description ? (
              <p className="max-w-prose text-body text-ink-secondary">
                {module.description}
              </p>
            ) : null}
            {progress.total > 0 ? (
              <div className="max-w-md">
                <ProgressMeter
                  completed={progress.completed}
                  total={progress.total}
                />
              </div>
            ) : null}
          </header>

          {sectionsLoading ? (
            <p aria-busy="true" className="text-body text-ink-secondary">
              Loading curriculum…
            </p>
          ) : sectionsError ? (
            <p className="text-body text-ink-secondary">
              The curriculum isn&apos;t available right now.
            </p>
          ) : sections.length === 0 ? (
            <p className="text-body text-ink-secondary">
              No lessons in this course yet.
            </p>
          ) : (
            <div className="space-y-6">
              {sections.map((section) => (
                <SectionGroup
                  key={section.id}
                  section={section}
                  displayById={displayById}
                />
              ))}
            </div>
          )}

          {/* Course assessment entry — navigation to the existing intro, which
              is the authority on eligibility. No enabled/earned state is
              asserted here, and completion is never treated as eligibility. */}
          <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-start gap-3">
              <AcademicCapIcon
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-ink-muted"
              />
              <div>
                <h2 className="text-card font-semibold text-ink">
                  Course assessment
                </h2>
                <p className="mt-1 text-body-sm text-ink-secondary">
                  A graded assessment. Passing it issues this course&apos;s
                  Course Certificate.
                </p>
              </div>
            </div>
            <Link
              to="/learn/$trackId/$courseId/assessment"
              params={{ trackId, courseId }}
              className="inline-flex items-center gap-1 text-body font-medium text-primary hover:text-primary-hover"
            >
              Go to course assessment
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default ModuleDetail;
