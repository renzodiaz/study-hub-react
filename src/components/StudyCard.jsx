import { memo } from 'react';
import { Link } from '@tanstack/react-router';

import { PencilSquareIcon, EyeIcon } from '@heroicons/react/20/solid';

const LEVEL_LABELS = {
  beginner: 'Beginner',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};

const StudyCard = memo(({ item }) => {
  return (
    <li className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow-sm">
      <div className="flex flex-1 flex-col p-8">
        <img
          alt=""
          src={
            item.thumbnail_url ||
            'https://placehold.co/128x128/e5e7eb/9ca3af?text=Course'
          }
          className="mx-auto size-32 shrink-0 rounded-full bg-gray-300 outline -outline-offset-1 outline-black/5 object-cover"
        />
        <h3 className="mt-6 text-sm font-medium text-gray-900">{item.title}</h3>
        <dl className="mt-1 flex grow flex-col justify-between">
          <dt className="sr-only">Description</dt>
          <dd className="text-sm text-gray-500 line-clamp-2">
            {item.description}
          </dd>
          <dt className="sr-only">Status</dt>
          <dd className="mt-3 flex items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
              {LEVEL_LABELS[item.level] ?? item.level}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                item.published
                  ? 'bg-green-50 text-green-700 ring-green-600/20'
                  : 'bg-gray-50 text-gray-600 ring-gray-500/20'
              }`}
            >
              {item.published ? 'Published' : 'Draft'}
            </span>
          </dd>
        </dl>
      </div>
      <div>
        <div className="-mt-px flex divide-x divide-gray-200">
          <a className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 cursor-pointer">
            <EyeIcon aria-hidden="true" className="size-5 text-gray-400" />
            Preview
          </a>
          <Link
            to="/study-hub/$id"
            params={{ id: String(item.id) }}
            className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
          >
            <PencilSquareIcon
              aria-hidden="true"
              className="size-5 text-indigo-400"
            />
            Edit
          </Link>
        </div>
      </div>
    </li>
  );
});

export default StudyCard;
