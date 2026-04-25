import { memo } from 'react';
import { Link } from '@tanstack/react-router';

import {
  PencilSquareIcon,
  RocketLaunchIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid';

const StudyCard = memo(({ item }) => {
  const isInProgress = item.status === 'in_progress';

  return (
    <li className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow-sm">
      <div className="flex flex-1 flex-col p-8">
        <img
          alt=""
          src={item.cover_image}
          className="mx-auto size-32 shrink-0 rounded-full bg-gray-300 outline -outline-offset-1 outline-black/5"
        />
        <h3 className="mt-6 text-sm font-medium text-gray-900">{item.name}</h3>
        <dl className="mt-1 flex grow flex-col justify-between">
          <dt className="sr-only">Description</dt>
          <dd className="text-sm text-gray-500">{item.description}</dd>
          <dt className="sr-only">Status</dt>
          <dd className="mt-3">
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 inset-ring inset-ring-green-600/20">
              {isInProgress
                ? `In Progress ${item.completion_percentage}%`
                : item.status}
            </span>
          </dd>
        </dl>
      </div>
      <div>
        <div className="-mt-px flex divide-x divide-gray-200">
          <a className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 cursor-pointer">
            {isInProgress ? (
              <>
                <XCircleIcon
                  aria-hidden="true"
                  className="size-5 text-red-400"
                />
                Reset test
              </>
            ) : (
              <>
                <RocketLaunchIcon
                  aria-hidden="true"
                  className="size-5 text-green-400"
                />
                Practice test
              </>
            )}
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
