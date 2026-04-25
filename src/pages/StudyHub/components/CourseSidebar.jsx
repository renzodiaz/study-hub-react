import { CheckCircleIcon } from '@heroicons/react/20/solid';

const steps = [
  {
    group: 'Plan your course',
    items: ['Intended learners', 'Course structure', 'Setup & test video'],
  },
  {
    group: 'Create your content',
    items: [
      'Film & edit',
      'Curriculum',
      'Captions (optional)',
      'Accessibility (optional)',
    ],
  },
  {
    group: 'Publish your course',
    items: ['Course landing page', 'Pricing', 'Promotions', 'Course messages'],
  },
];

const CourseSidebar = () => {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col justify-between py-6">
      <nav className="px-4 space-y-6">
        {steps.map((section) => (
          <div key={section.group}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {section.group}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-x-2 text-sm text-gray-700 py-1 cursor-pointer hover:text-indigo-600"
                >
                  <CheckCircleIcon className="size-4 text-gray-300 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="px-4">
        <button className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          Submit for Review
        </button>
      </div>
    </aside>
  );
};

export default CourseSidebar;
