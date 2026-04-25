import { useState } from 'react';
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
import { Bars3Icon, ChevronUpIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';

import LectureItem from './LectureItem';

const SectionItem = ({ section }) => {
  const [lectures, setLectures] = useState(section.lectures);

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

  const handleLectureDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setLectures((prev) => {
      const oldIndex = prev.findIndex((l) => l.id === active.id);
      const newIndex = prev.findIndex((l) => l.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
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
                  Section {section.order}: {section.title}
                </span>
                <ChevronUpIcon
                  className={`size-5 text-gray-400 transition-transform duration-200 ${
                    open ? 'rotate-0' : 'rotate-180'
                  }`}
                />
              </DisclosureButton>
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
                    {lectures.map((lecture) => (
                      <LectureItem key={lecture.id} lecture={lecture} />
                    ))}
                  </SortableContext>
                </DndContext>
                <button className="mt-2 flex items-center gap-x-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                  <PlusIcon className="size-4" />
                  Add Lecture
                </button>
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>
    </div>
  );
};

export default SectionItem;
