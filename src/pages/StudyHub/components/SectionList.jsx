import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PlusIcon } from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';

import {
  getCourseModules,
  createModule,
  updateModule,
  deleteModule,
} from '@api/courseModules';
import SectionItem from './SectionItem';

const SectionList = ({ courseId }) => {
  const queryClient = useQueryClient();
  const queryKey = ['course_modules', courseId];

  const { data: sections = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getCourseModules(courseId),
    enabled: !!courseId,
  });

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const { mutate: persistPosition } = useMutation({
    mutationFn: ({ id, position }) => updateModule(id, { position }),
  });

  const { mutate: addSection, isPending: addingSection } = useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setShowAdd(false);
      setNewTitle('');
    },
  });

  const { mutate: removeSection } = useMutation({
    mutationFn: deleteModule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove([...sections], oldIndex, newIndex);
    queryClient.setQueryData(queryKey, reordered);
    reordered.forEach((s, i) => persistPosition({ id: s.id, position: i }));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addSection({
      course_id: courseId,
      title: newTitle.trim(),
      position: sections.length,
    });
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {sections.map((section, index) => (
            <SectionItem
              key={section.id}
              section={section}
              index={index}
              courseId={courseId}
              onDelete={() => removeSection(section.id)}
            />
          ))}

          {showAdd ? (
            <form
              onSubmit={handleAddSubmit}
              className="flex items-center gap-x-2"
            >
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Section title…"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={addingSection || !newTitle.trim()}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                <CheckIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setNewTitle('');
                }}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                <XMarkIcon className="size-4" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-x-2 rounded-md border-2 border-gray-900 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              <PlusIcon className="size-4" />
              Add Section
            </button>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SectionList;
