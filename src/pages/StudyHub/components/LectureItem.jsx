import { useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon, TrashIcon } from '@heroicons/react/20/solid';
import {
  DocumentTextIcon,
  VideoCameraIcon,
  QuestionMarkCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import { useDrawer } from '@hooks/useDrawer';
import LessonForm from './LessonForm';

const TYPE_ICONS = {
  video: VideoCameraIcon,
  article: DocumentTextIcon,
  quiz_gate: QuestionMarkCircleIcon,
};

const TYPE_LABELS = {
  video: 'Video',
  article: 'Article',
  quiz_gate: 'Quiz Gate',
};

const LectureItem = ({ lecture, index, courseId, onDelete }) => {
  const { openDrawer } = useDrawer();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lecture.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const TypeIcon = TYPE_ICONS[lecture.lesson_type] ?? DocumentTextIcon;

  const handleEditContent = useCallback(() => {
    openDrawer(
      <LessonForm lessonId={lecture.id} courseId={courseId} />,
      'Edit Lesson',
      `${TYPE_LABELS[lecture.lesson_type] ?? lecture.lesson_type} · ${lecture.title}`,
      'lesson-form',
    );
  }, [openDrawer, lecture.id, lecture.lesson_type, lecture.title, courseId]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-x-3 border border-gray-200 bg-white px-4 py-3"
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder lecture"
        className="cursor-grab text-gray-400 hover:text-gray-600 shrink-0"
      >
        <Bars3Icon className="size-5" aria-hidden="true" />
      </button>
      <TypeIcon className="size-5 text-gray-400 shrink-0" />
      <span className="flex-1 text-sm text-gray-700">
        Lecture {index + 1}: {lecture.title}
      </span>
      <span className="shrink-0 text-xs text-gray-400">
        {TYPE_LABELS[lecture.lesson_type] ?? lecture.lesson_type}
      </span>
      <button
        type="button"
        onClick={handleEditContent}
        className="flex items-center gap-x-1 rounded border border-gray-900 px-3 py-1 text-xs font-semibold text-gray-900 hover:bg-gray-50 shrink-0"
      >
        <PlusIcon className="size-3" />
        Content
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete lecture"
        className="shrink-0 text-gray-400 hover:text-red-500"
      >
        <TrashIcon className="size-4" />
      </button>
    </div>
  );
};

export default LectureItem;
