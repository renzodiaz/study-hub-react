import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon } from '@heroicons/react/20/solid';
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';

const LectureItem = ({ lecture }) => {
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
      <DocumentTextIcon className="size-5 text-gray-400 shrink-0" />
      <span className="flex-1 text-sm text-gray-700">
        Lecture {lecture.order}: {lecture.title}
      </span>
      <button className="flex items-center gap-x-1 rounded border border-gray-900 px-3 py-1 text-xs font-semibold text-gray-900 hover:bg-gray-50">
        <PlusIcon className="size-3" />
        Content
      </button>
    </div>
  );
};

export default LectureItem;
