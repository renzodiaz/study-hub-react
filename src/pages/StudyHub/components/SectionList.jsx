import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PlusIcon } from '@heroicons/react/24/outline';

import SectionItem from './SectionItem';

const mockSections = [
  {
    id: 1,
    order: 1,
    title: 'Introduction & Getting Started',
    lectures: [
      { id: 1, order: 1, title: 'Welcome To The Course!' },
      { id: 2, order: 2, title: 'Course Structure, How To Take It?' },
    ],
  },
  {
    id: 2,
    order: 2,
    title: 'Core Concepts',
    lectures: [
      { id: 3, order: 1, title: 'Understanding the Basics' },
      { id: 4, order: 2, title: 'Hands-on Practice' },
    ],
  },
];

const SectionList = () => {
  const [sections, setSections] = useState(mockSections);

  const handleSectionDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleSectionDragEnd}
    >
      <SortableContext
        items={sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {sections.map((section) => (
            <SectionItem key={section.id} section={section} />
          ))}
          <button className="flex items-center gap-x-2 rounded-md border-2 border-gray-900 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
            <PlusIcon className="size-4" />
            Add Section
          </button>
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SectionList;
