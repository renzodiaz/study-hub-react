import { useParams, useRouter, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
} from '@heroicons/react/20/solid';

import { getModule, getModuleSections } from '@api/learn';

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

const LessonRow = ({ lesson }) => {
  const Icon = LESSON_ICON[lesson.lesson_type] ?? DocumentTextIcon;
  const duration = formatDuration(lesson.duration_seconds);

  return (
    <Link
      to="/lessons/$lessonId"
      params={{ lessonId: String(lesson.id) }}
      className="flex items-center gap-x-3 px-4 py-3 hover:bg-gray-50"
    >
      <Icon className="size-5 shrink-0 text-gray-400" />
      <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
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
    </Link>
  );
};

const ModuleDetail = () => {
  const { trackId, courseId } = useParams({ strict: false });
  const router = useRouter();

  const { data: module, isLoading: moduleLoading } = useQuery({
    queryKey: ['learn', 'module', trackId, courseId],
    queryFn: () => getModule(trackId, courseId),
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
      ) : (
        module && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {module.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              {module.description}
            </p>
          </div>
        )
      )}

      {sectionsLoading ? (
        <p className="text-sm text-gray-500">Loading curriculum...</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{error.message}</p>
      ) : sections.length === 0 ? (
        <p className="text-sm text-gray-500">No lessons in this module yet.</p>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
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
                {(section.lessons ?? []).map((lesson) => (
                  <LessonRow key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModuleDetail;
