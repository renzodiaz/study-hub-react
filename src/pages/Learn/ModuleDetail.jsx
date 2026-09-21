import { useParams, useRouter, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  LockClosedIcon,
  AcademicCapIcon,
} from '@heroicons/react/20/solid';

import { getModule, getModuleSections } from '@api/learn';
import { classNames } from '@utils/helpers';

const LESSON_ICON = {
  video: PlayCircleIcon,
  article: DocumentTextIcon,
  narrative: DocumentTextIcon,
  mcq: QuestionMarkCircleIcon,
  quiz_gate: QuestionMarkCircleIcon,
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
};

// Per-section gate: a lesson is unlocked if it's a free preview or every prior
// lesson in the section is completed (mirrors the server's LessonPolicy gate).
const lessonStates = (lessons = []) => {
  let priorAllComplete = true;
  return lessons.map((lesson) => {
    const accessible = lesson.free_preview || priorAllComplete;
    const state = lesson.completed ? 'done' : accessible ? 'open' : 'locked';
    priorAllComplete = priorAllComplete && lesson.completed;
    return state;
  });
};

const LessonRow = ({ lesson, state }) => {
  const Icon = LESSON_ICON[lesson.lesson_type] ?? DocumentTextIcon;
  const duration = formatDuration(lesson.duration_seconds);
  const locked = state === 'locked';

  const inner = (
    <>
      {state === 'done' ? (
        <CheckCircleIcon className="size-5 shrink-0 text-green-600" />
      ) : locked ? (
        <LockClosedIcon className="size-5 shrink-0 text-gray-300" />
      ) : (
        <Icon className="size-5 shrink-0 text-gray-400" />
      )}
      <span
        className={classNames(
          'min-w-0 flex-1 truncate text-sm',
          locked ? 'text-gray-400' : 'text-gray-900',
        )}
      >
        {lesson.title}
      </span>
      {lesson.free_preview && (
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          Preview
        </span>
      )}
      {duration && (
        <span className="inline-flex items-center gap-x-1 text-xs text-gray-500">
          <ClockIcon className="size-3.5" />
          {duration}
        </span>
      )}
    </>
  );

  if (locked) {
    return (
      <div className="flex cursor-not-allowed items-center gap-x-3 px-4 py-3">
        {inner}
      </div>
    );
  }

  return (
    <Link
      to="/lessons/$lessonId"
      params={{ lessonId: String(lesson.id) }}
      className="flex items-center gap-x-3 px-4 py-3 hover:bg-gray-50"
    >
      {inner}
    </Link>
  );
};

const ModuleDetail = () => {
  const { trackId, courseId } = useParams({ strict: false });
  const router = useRouter();

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
    isError,
    error,
  } = useQuery({
    queryKey: ['learn', 'module', trackId, courseId, 'sections'],
    queryFn: () => getModuleSections(trackId, courseId),
  });

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="inline-flex items-center gap-x-1 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="size-4" />
        Back to career
      </button>

      {moduleLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : moduleError ? (
        // The backend intentionally hides an inaccessible course (404/403) and
        // does not disclose the exact reason (progression vs entitlement vs
        // unpublished), so we show neutral copy rather than inventing a
        // prerequisite. Server-authoritative "complete X to unlock" messaging
        // lives on the roadmap (TrackDetail), which carries explicit progression
        // state; this is the bare direct-URL path.
        <div className="flex items-start gap-x-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <LockClosedIcon className="mt-0.5 size-5 shrink-0 text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              This course isn&apos;t available
            </p>
            <p className="mt-1 text-sm text-gray-500">
              This course isn&apos;t available to your account.
            </p>
          </div>
        </div>
      ) : (
        module && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {module.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              {module.description}
            </p>
            <Link
              to="/learn/$trackId/$courseId/assessment"
              params={{ trackId, courseId }}
              className="mt-4 inline-flex items-center gap-x-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <AcademicCapIcon className="size-4" />
              Credential assessment
            </Link>
          </div>
        )
      )}

      {moduleError ? null : sectionsLoading ? (
        <p className="text-sm text-gray-500">Loading curriculum...</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{error.message}</p>
      ) : sections.length === 0 ? (
        <p className="text-sm text-gray-500">No lessons in this module yet.</p>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => {
            const lessons = section.lessons ?? [];
            const states = lessonStates(lessons);
            return (
              <div
                key={section.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-100 px-4 py-3">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {section.title}
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {lessons.map((lesson, i) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      state={states[i]}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModuleDetail;
