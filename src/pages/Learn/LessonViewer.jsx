import { useParams, useRouter } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/20/solid';
import { lazy, Suspense } from 'react';

import { getLesson, completeLesson, getModuleSections } from '@api/learn';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Disclosure from '@components/ui/Disclosure';
import EmptyState from '@components/learn/EmptyState';
import LessonContextHeader from '@components/learn/LessonContextHeader';
import LessonOutline from '@components/learn/LessonOutline';
import LessonNav from '@components/learn/LessonNav';
import { courseLessonDisplay } from '@components/learn/lessonProgress';

// Markdown + syntax-highlighting deps are heavy and only needed on a lesson
// page, so the renderer is code-split out of the initial app bundle.
const LessonContent = lazy(() => import('@components/LessonContent'));

const QUIZ_TYPES = ['quiz_gate', 'mcq'];

const LessonBody = ({ lesson }) => {
  if (lesson.lesson_type === 'video') {
    return (
      <div className="overflow-hidden rounded-card bg-ink">
        <video
          controls
          src={lesson.video_url}
          className="aspect-video w-full"
        />
      </div>
    );
  }

  if (QUIZ_TYPES.includes(lesson.lesson_type)) {
    return (
      <Card className="p-6 text-body text-ink-secondary">
        This is a quiz lesson. Answering and grading arrive in a later phase.
      </Card>
    );
  }

  return (
    <Suspense
      fallback={<p className="text-body-sm text-ink-muted">Loading lesson…</p>}
    >
      <LessonContent markdown={lesson.content} />
    </Suspense>
  );
};

const LessonViewer = () => {
  const { lessonId } = useParams({ strict: false });
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: lesson,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['learn', 'lesson', lessonId],
    queryFn: () => getLesson(lessonId),
    retry: false,
  });

  const context = lesson?.context;
  const trackId = context?.career?.id;
  const courseId = context?.course?.id;

  // The course outline for the orientation sidebar. Only fetched once we know
  // the accessible career + course from the lesson context; states come from
  // the same server-derived display as the course page.
  const { data: sections = [] } = useQuery({
    queryKey: ['learn', 'module', trackId, courseId, 'sections'],
    queryFn: () => getModuleSections(trackId, courseId),
    enabled: Boolean(trackId && courseId),
  });

  const { mutate: markComplete, isPending } = useMutation({
    mutationFn: () => completeLesson(lessonId),
    // Refetch this lesson (so `completed` flips) and everything else that shows
    // progress — the curriculum, enrollments, dashboard, outline. Next only
    // becomes accessible if the server/refetch authorizes it; nothing is
    // optimistically unlocked here.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learn'] }),
  });

  if (isLoading) {
    return (
      <p aria-busy="true" className="text-body text-ink-secondary">
        Loading lesson…
      </p>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="inline-flex items-center gap-1 text-body-sm font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Back
        </button>
        <EmptyState
          title="This lesson isn't available"
          description="This lesson isn't available to your account."
        />
      </div>
    );
  }

  const isQuiz = QUIZ_TYPES.includes(lesson.lesson_type);
  const courseOverviewTo =
    trackId && courseId
      ? { to: '/learn/$trackId/$courseId', params: { trackId, courseId } }
      : null;
  const goBack = () => router.history.back();

  const outlineNumber =
    courseLessonDisplay(sections).find((d) => String(d.id) === String(lessonId))
      ?.number ?? undefined;

  const outline =
    sections.length > 0 ? (
      <LessonOutline sections={sections} activeLessonId={lessonId} />
    ) : null;

  return (
    <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
      {/* Desktop / tablet outline column */}
      {outline ? (
        <aside className="hidden lg:block">
          <div className="sticky top-6">{outline}</div>
        </aside>
      ) : (
        <div className="hidden lg:block" />
      )}

      <div className="min-w-0 space-y-6">
        <LessonContextHeader context={context} lessonNumber={outlineNumber} />

        {/* Compact outline (below lg) so orientation is never dropped on small
            screens — the same course structure, in a Disclosure. */}
        {outline ? (
          <div className="lg:hidden">
            <Disclosure summary="Course outline" variant="section">
              {outline}
            </Disclosure>
          </div>
        ) : null}

        <div className="space-y-6 border-t border-line pt-6">
          <h1 className="font-serif text-title font-semibold text-ink">
            {lesson.title}
          </h1>
          <LessonBody lesson={lesson} />
        </div>

        {!isQuiz ? (
          <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
            {lesson.completed ? (
              <span className="inline-flex items-center gap-1.5 text-body font-medium text-success">
                <CheckCircleIcon aria-hidden="true" className="size-5" />
                Completed
              </span>
            ) : (
              <Button
                onClick={() => markComplete()}
                busy={isPending}
                busyLabel="Saving…"
              >
                Mark as complete
              </Button>
            )}
            <p className="text-body-sm text-ink-muted">
              Completion records your place. Credentials come from assessments,
              not from lessons read.
            </p>
          </div>
        ) : null}

        <LessonNav
          context={context}
          prevId={lesson.prev_lesson_id}
          nextId={lesson.next_lesson_id}
          courseOverviewTo={courseOverviewTo}
          onBack={goBack}
        />
      </div>
    </div>
  );
};

export default LessonViewer;
