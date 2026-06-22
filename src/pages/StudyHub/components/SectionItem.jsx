import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSortable } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import {
  Bars3Icon,
  ChevronUpIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';

import { createLesson, updateLesson, deleteLesson } from '@api/lessons';
import LectureItem from './LectureItem';

const LESSON_TYPES = [
  { value: 'article', label: 'Article' },
  { value: 'video', label: 'Video' },
  { value: 'quiz_gate', label: 'Quiz Gate' },
];

const SectionItem = ({ section, index, courseId, onDelete }) => {
  const queryClient = useQueryClient();
  const queryKey = ['course_modules', courseId];
  const lectures = section.lessons ?? [];

  const [showAddLecture, setShowAddLecture] = useState(false);
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureType, setNewLectureType] = useState('article');

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { mutate: persistLecturePosition } = useMutation({
    mutationFn: ({ id, position }) => updateLesson(id, { position }),
  });

  const { mutate: addLecture, isPending: addingLecture } = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setShowAddLecture(false);
      setNewLectureTitle('');
      setNewLectureType('article');
    },
  });

  const { mutate: removeLecture } = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleLectureDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = lectures.findIndex((l) => l.id === active.id);
    const newIndex = lectures.findIndex((l) => l.id === over.id);
    const reordered = arrayMove([...lectures], oldIndex, newIndex);
    queryClient.setQueryData(queryKey, (old) =>
      (old ?? []).map((mod) =>
        mod.id === section.id ? { ...mod, lessons: reordered } : mod,
      ),
    );
    reordered.forEach((l, i) =>
      persistLecturePosition({ id: l.id, position: i }),
    );
  };

  const handleAddLectureSubmit = (e) => {
    e.preventDefault();
    if (!newLectureTitle.trim()) return;
    addLecture({
      course_module_id: section.id,
      title: newLectureTitle.trim(),
      lesson_type: newLectureType,
      position: lectures.length,
    });
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Disclosure defaultOpen>
        {({ open }) => (
          <div className="border border-gray-200 bg-gray-50">
            <div className="flex items-center px-4">
              <button
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder section"
                className="cursor-grab text-gray-400 hover:text-gray-600 shrink-0 mr-3"
              >
                <Bars3Icon className="size-5" aria-hidden="true" />
              </button>
              <DisclosureButton className="flex flex-1 items-center gap-x-3 py-3 text-left">
                <span className="flex-1 text-sm font-semibold text-gray-900">
                  Section {index + 1}: {section.title}
                </span>
                <ChevronUpIcon
                  className={`size-5 text-gray-400 transition-transform duration-200 ${
                    open ? 'rotate-0' : 'rotate-180'
                  }`}
                />
              </DisclosureButton>
              <button
                type="button"
                onClick={onDelete}
                aria-label="Delete section"
                className="ml-3 shrink-0 text-gray-400 hover:text-red-500"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>

            <DisclosurePanel>
              <div className="space-y-1 px-4 pb-3">
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleLectureDragEnd}
                >
                  <SortableContext
                    items={lectures.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {lectures.map((lecture, lIndex) => (
                      <LectureItem
                        key={lecture.id}
                        lecture={lecture}
                        index={lIndex}
                        courseId={courseId}
                        onDelete={() => removeLecture(lecture.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {showAddLecture ? (
                  <form
                    onSubmit={handleAddLectureSubmit}
                    className="mt-2 flex items-center gap-x-2"
                  >
                    <input
                      autoFocus
                      value={newLectureTitle}
                      onChange={(e) => setNewLectureTitle(e.target.value)}
                      placeholder="Lecture title…"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <select
                      value={newLectureType}
                      onChange={(e) => setNewLectureType(e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                    >
                      {LESSON_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={addingLecture || !newLectureTitle.trim()}
                      className="inline-flex items-center rounded-md bg-indigo-600 px-2 py-1.5 text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      <CheckIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddLecture(false);
                        setNewLectureTitle('');
                      }}
                      className="inline-flex items-center rounded-md border border-gray-300 px-2 py-1.5 text-gray-700 hover:bg-gray-50"
                    >
                      <XMarkIcon className="size-4" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddLecture(true)}
                    className="mt-2 flex items-center gap-x-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    <PlusIcon className="size-4" />
                    Add Lecture
                  </button>
                )}
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>
    </div>
  );
};

export default SectionItem;
