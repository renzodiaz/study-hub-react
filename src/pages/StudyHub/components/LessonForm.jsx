import { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getLesson, updateLesson } from '@api/lessons';
import { useDrawer } from '@hooks/useDrawer';
import InputText from '@components/InputText';
import Toggle from '@components/Toggle';

const TYPE_LABELS = {
  video: 'Video',
  article: 'Article',
  quiz_gate: 'Quiz Gate',
};

const LessonFormFields = ({ lesson, onSave, isPending }) => {
  const { setIsPending } = useDrawer();

  useEffect(() => {
    setIsPending(isPending);
  }, [isPending, setIsPending]);

  const form = useForm({
    defaultValues: {
      title: lesson.title ?? '',
      video_url: lesson.video_url ?? '',
      content: lesson.content ?? '',
      duration_seconds: lesson.duration_seconds ?? '',
      published: lesson.published ?? false,
      free_preview: lesson.free_preview ?? false,
    },
    onSubmit: ({ value }) => {
      onSave({
        title: value.title,
        video_url: value.video_url || null,
        content: value.content || null,
        duration_seconds:
          value.duration_seconds !== '' ? Number(value.duration_seconds) : null,
        published: value.published,
        free_preview: value.free_preview,
      });
    },
  });

  return (
    <div className="space-y-6 pt-6 pb-5">
      <form
        id="lesson-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        {/* Type badge */}
        <div className="flex items-center gap-x-2 pb-4">
          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-700/10">
            {TYPE_LABELS[lesson.lesson_type] ?? lesson.lesson_type}
          </span>
        </div>

        {/* Title */}
        <form.Field
          name="title"
          validators={{
            onChange: ({ value }) => (!value ? 'Title is required' : undefined),
          }}
          children={(field) => <InputText field={field} label="Title:" />}
        />

        {/* Toggles */}
        <div className="mt-4 divide-y divide-gray-100">
          <form.Field
            name="published"
            children={(field) => (
              <Toggle
                label="Published"
                value={field.state.value}
                onChange={field.handleChange}
              />
            )}
          />
          <form.Field
            name="free_preview"
            children={(field) => (
              <Toggle
                label="Free Preview"
                value={field.state.value}
                onChange={field.handleChange}
              />
            )}
          />
        </div>

        {/* Type-specific content */}
        {lesson.lesson_type === 'video' && (
          <div className="mt-4 space-y-4">
            <form.Field
              name="video_url"
              children={(field) => (
                <InputText
                  field={field}
                  label="Video URL:"
                  autoComplete="off"
                />
              )}
            />
            <form.Field
              name="duration_seconds"
              children={(field) => (
                <InputText
                  field={field}
                  label="Duration (seconds):"
                  type="number"
                />
              )}
            />
          </div>
        )}

        {lesson.lesson_type === 'article' && (
          <div className="mt-4">
            <form.Field
              name="content"
              children={(field) => (
                <InputText
                  field={field}
                  label="Content:"
                  as="textarea"
                  rows={16}
                />
              )}
            />
            <p className="mt-1 text-xs text-gray-400">Markdown supported</p>
          </div>
        )}

        {lesson.lesson_type === 'quiz_gate' && (
          <div className="mt-4 rounded-md bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              Quiz questions for this lesson are managed in the Quiz Builder
              (coming in a future release).
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

const LessonForm = ({ lessonId, courseId }) => {
  const queryClient = useQueryClient();
  const { closeDrawer } = useDrawer();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => updateLesson(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['course_modules', courseId] });
      closeDrawer();
    },
  });

  if (isLoading || !lesson) {
    return <p className="pt-6 text-sm text-gray-500">Loading...</p>;
  }

  return (
    <LessonFormFields
      key={lesson.id}
      lesson={lesson}
      onSave={mutate}
      isPending={isPending}
    />
  );
};

export default LessonForm;
