import { useParams, useRouter, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from '@heroicons/react/20/solid';

import { lazy, Suspense } from 'react';

import { getLesson, completeLesson } from '@api/learn';

// Markdown + syntax-highlighting deps are heavy and only needed on a lesson
// page, so the renderer is code-split out of the initial app bundle.
const LessonContent = lazy(() => import('@components/LessonContent'));

const QUIZ_TYPES = ['quiz_gate', 'mcq'];

const LessonBody = ({ lesson }) => {
  if (lesson.lesson_type === 'video') {
    return (
      <div className="overflow-hidden rounded-lg bg-black">
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
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
        This is a quiz lesson. Answering and grading arrive in a later phase.
      </div>
    );
  }

  // article / narrative — Markdown with safe code highlighting (lazy-loaded).
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <Suspense
        fallback={<p className="text-sm text-gray-400">Loading lesson…</p>}
      >
        <LessonContent markdown={lesson.content} />
      </Suspense>
    </div>
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

  const { mutate: markComplete, isPending } = useMutation({
    mutationFn: () => completeLesson(lessonId),
    // Refetch this lesson (so `completed` flips) and everything else that
    // shows progress — the curriculum, enrollments, dashboard.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learn'] }),
  });

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading lesson...</p>;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="inline-flex items-center gap-x-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </button>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <LockClosedIcon className="mx-auto size-8 text-amber-500" />
          <p className="mt-3 text-sm font-medium text-amber-800">
            This lesson is locked
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Complete the previous lessons, enroll in the career, or upgrade your
            plan to unlock it.
          </p>
        </div>
      </div>
    );
  }

  const isQuiz = QUIZ_TYPES.includes(lesson.lesson_type);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="inline-flex items-center gap-x-1 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="size-4" />
        Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        {lesson.title}
      </h1>

      <LessonBody lesson={lesson} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {lesson.prev_lesson_id && (
            <Link
              to="/lessons/$lessonId"
              params={{ lessonId: String(lesson.prev_lesson_id) }}
              aria-label="Previous lesson"
              className="inline-flex items-center gap-x-1.5 rounded-md px-3.5 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <ArrowLeftIcon className="size-4" />
              Previous lesson
            </Link>
          )}
        </div>

        <div className="flex items-center gap-x-3">
          {!isQuiz &&
            (lesson.completed ? (
              <span className="inline-flex items-center gap-x-1.5 rounded-md bg-green-50 px-3.5 py-2 text-sm font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                <CheckCircleIcon className="size-5" />
                Completed
              </span>
            ) : (
              <button
                type="button"
                onClick={() => markComplete()}
                disabled={isPending}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {isPending ? 'Saving…' : 'Mark as complete'}
              </button>
            ))}

          {lesson.next_lesson_id && (
            <Link
              to="/lessons/$lessonId"
              params={{ lessonId: String(lesson.next_lesson_id) }}
              aria-label="Next lesson"
              className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
            >
              Next lesson
              <ArrowRightIcon className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
