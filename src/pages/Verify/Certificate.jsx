import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
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

// The assessment STANDARD a knowledge credential was measured against. This is a
// knowledge standard, NOT a seniority title — copy must never imply the holder
// is a verified Senior Engineer overall.
const TARGET_LEVEL_LABELS = {
  mid_senior: 'Mid-Senior',
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

  const isKnowledge = certificate?.credential_kind === 'knowledge';
  const isRevoked = certificate?.status === 'revoked';
  const targetLabel =
    TARGET_LEVEL_LABELS[certificate?.target_level] ?? certificate?.target_level;

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
              This verification link is not valid.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div
              className={[
                'flex items-center gap-x-2 px-8 py-4 text-white',
                isRevoked ? 'bg-gray-600' : 'bg-indigo-600',
              ].join(' ')}
            >
              {isRevoked ? (
                <NoSymbolIcon className="size-6" />
              ) : (
                <CheckBadgeIcon className="size-6" />
              )}
              <span className="text-sm font-semibold">
                {isRevoked ? 'Credential revoked' : 'Verified by Study Hub'}
              </span>
            </div>

            <div className="px-8 py-10 text-center">
              {isRevoked && (
                <div className="mb-6 rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                  This credential is no longer valid.
                </div>
              )}

              <p className="text-sm text-gray-500">
                {isKnowledge ? 'Verified Knowledge' : 'This certifies that'}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                {certificate.holder_name}
              </h1>

              {isKnowledge ? (
                <>
                  <p className="mt-4 text-sm text-gray-500">
                    demonstrated knowledge of
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-gray-900">
                    {certificate.course_title}
                  </h2>
                  <span className="mt-4 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                    {targetLabel} standard
                  </span>
                  {typeof certificate.overall_score === 'number' && (
                    <p className="mt-4 text-sm text-gray-600">
                      Overall score{' '}
                      <span className="font-semibold text-gray-900">
                        {certificate.overall_score.toFixed(2)}
                      </span>
                    </p>
                  )}
                  {Array.isArray(certificate.dimensions) &&
                    certificate.dimensions.length > 0 && (
                      <dl className="mt-4 space-y-1 text-left text-sm">
                        {certificate.dimensions.map((d) => (
                          <div key={d.key} className="flex justify-between">
                            <dt className="text-gray-500">{d.label}</dt>
                            <dd className="font-medium text-gray-900">
                              {Number(d.score).toFixed(2)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                </>
              ) : (
                <>
                  <p className="mt-4 text-sm text-gray-500">
                    has been certified in
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-gray-900">
                    {certificate.course_title}
                  </h2>
                  <span className="mt-4 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                    {LEVEL_LABELS[certificate.level] ?? certificate.level} level
                  </span>
                </>
              )}

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
