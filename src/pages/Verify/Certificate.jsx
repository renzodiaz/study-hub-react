import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';

import { getPublicCertificate } from '@api/learn';

const LEVEL_LABELS = {
  beginner: 'Beginner',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'long' }) : '';

const Certificate = () => {
  const { token } = useParams({ strict: false });

  const {
    data: certificate,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['public', 'certificate', token],
    queryFn: () => getPublicCertificate(token),
    retry: false,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {isLoading ? (
          <p className="text-center text-sm text-gray-500">
            Verifying credential...
          </p>
        ) : isError || !certificate ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
            <ExclamationTriangleIcon className="mx-auto size-10 text-amber-500" />
            <h1 className="mt-4 text-lg font-semibold text-amber-800">
              Certificate not found
            </h1>
            <p className="mt-1 text-sm text-amber-700">
              This verification link is invalid or has been revoked.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-x-2 bg-indigo-600 px-8 py-4 text-white">
              <CheckBadgeIcon className="size-6" />
              <span className="text-sm font-semibold">
                Verified by Study Hub
              </span>
            </div>
            <div className="px-8 py-10 text-center">
              <p className="text-sm text-gray-500">This certifies that</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                {certificate.holder_name}
              </h1>
              <p className="mt-4 text-sm text-gray-500">
                has been certified in
              </p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                {certificate.course_title}
              </h2>
              <span className="mt-4 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                {LEVEL_LABELS[certificate.level] ?? certificate.level} level
              </span>
              <p className="mt-6 text-xs text-gray-400">
                Issued {formatDate(certificate.issued_at)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificate;
