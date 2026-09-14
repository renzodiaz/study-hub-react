import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/solid';

import { getPublicCredential } from '@api/learn';

const LEVEL_LABELS = {
  beginner: 'Beginner',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};
const TARGET_LEVEL_LABELS = { mid_senior: 'Mid-Senior', ...LEVEL_LABELS };

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'long' }) : '';

const formatScore = (v) => (typeof v === 'number' ? v.toFixed(2) : null);

// Distinct, text-first status treatment (never color-only).
const STATUS = {
  valid: {
    label: 'Verified by Study Hub',
    banner: 'bg-indigo-600',
    Icon: CheckBadgeIcon,
  },
  revalidation_required: {
    label: 'Revalidation required',
    banner: 'bg-amber-600',
    Icon: ExclamationTriangleIcon,
  },
  revoked: {
    label: 'Credential revoked',
    banner: 'bg-gray-600',
    Icon: NoSymbolIcon,
  },
};

const Credential = () => {
  const { token } = useParams({ strict: false });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public', 'credential', token],
    queryFn: () => getPublicCredential(token),
    retry: false,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {isLoading ? (
          <p className="text-center text-sm text-gray-500">
            Verifying credential…
          </p>
        ) : isError || !data ? (
          <NotFound />
        ) : data.credential_type === 'seniority_badge' ? (
          <BadgeCard badge={data} />
        ) : (
          <CertificateCard certificate={data} />
        )}
      </div>
    </div>
  );
};

const NotFound = () => (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
    <ExclamationTriangleIcon className="mx-auto size-10 text-amber-500" />
    <h1 className="mt-4 text-lg font-semibold text-amber-800">
      Credential not found
    </h1>
    <p className="mt-1 text-sm text-amber-700">
      This verification link is not valid.
    </p>
  </div>
);

const StatusBanner = ({ status }) => {
  const s = STATUS[status] ?? STATUS.valid;
  const { Icon } = s;
  return (
    <div
      className={`flex items-center gap-x-2 px-8 py-4 text-white ${s.banner}`}
    >
      <Icon className="size-6" />
      <span className="text-sm font-semibold">{s.label}</span>
    </div>
  );
};

const CertificateCard = ({ certificate }) => {
  const isKnowledge = certificate.credential_kind === 'knowledge';
  const status = certificate.status === 'revoked' ? 'revoked' : 'valid';
  const targetLabel =
    TARGET_LEVEL_LABELS[certificate.target_level] ?? certificate.target_level;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <StatusBanner status={status} />
      <div className="px-8 py-10 text-center">
        {status === 'revoked' && (
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
        <p className="mt-4 text-sm text-gray-500">
          {isKnowledge ? 'demonstrated knowledge of' : 'has been certified in'}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-gray-900">
          {certificate.course_title}
        </h2>
        <span className="mt-4 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
          {isKnowledge
            ? `${targetLabel} standard`
            : `${LEVEL_LABELS[certificate.level] ?? certificate.level} level`}
        </span>
        {isKnowledge && formatScore(certificate.overall_score) && (
          <p className="mt-4 text-sm text-gray-600">
            Overall score{' '}
            <span className="font-semibold text-gray-900">
              {formatScore(certificate.overall_score)}
            </span>
          </p>
        )}
        <p className="mt-6 text-xs text-gray-400">
          Issued {formatDate(certificate.issued_at)}
        </p>
      </div>
    </div>
  );
};

const STATUS_EXPLAINER = {
  valid: 'This credential is currently valid.',
  revalidation_required:
    'This credential was genuinely issued, but one of the exact prerequisite credentials used in its qualification now requires revalidation.',
  revoked: 'This credential has been explicitly revoked.',
};

const BadgeCard = ({ badge }) => {
  const status = badge.status ?? 'valid';
  const level =
    TARGET_LEVEL_LABELS[badge.career?.target_level] ??
    badge.career?.target_level;
  const interview = badge.qualification?.interview ?? {};
  const prereqs = badge.qualification?.prerequisite_credentials ?? [];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <StatusBanner status={status} />
      <div className="px-8 py-8">
        <p className="text-center text-sm text-gray-500">
          Seniority credential
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold tracking-tight text-gray-900">
          {badge.holder_name}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          {level} · {badge.career?.name}
        </p>

        <div
          className={[
            'mt-4 rounded-lg px-4 py-3 text-sm',
            status === 'valid'
              ? 'bg-indigo-50 text-indigo-800'
              : status === 'revalidation_required'
                ? 'bg-amber-50 text-amber-800'
                : 'bg-gray-100 text-gray-700',
          ].join(' ')}
        >
          {STATUS_EXPLAINER[status]}
        </div>

        {formatScore(interview.overall_score) && (
          <p className="mt-6 text-sm text-gray-600">
            Interview overall score{' '}
            <span className="font-semibold text-gray-900">
              {formatScore(interview.overall_score)}
            </span>
          </p>
        )}
        {Array.isArray(interview.dimension_scores) &&
          interview.dimension_scores.length > 0 && (
            <dl className="mt-3 space-y-1 text-sm">
              {interview.dimension_scores.map((d) => (
                <div key={d.key} className="flex justify-between">
                  <dt className="text-gray-500">{d.key}</dt>
                  <dd className="font-medium text-gray-900">
                    {formatScore(d.score)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

        {prereqs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Qualification prerequisites (
              {badge.qualification?.required_course_count})
            </h2>
            <ul className="mt-2 space-y-1 text-sm">
              {prereqs.map((p) => (
                <li
                  key={p.certificate_token}
                  className="flex items-center justify-between"
                >
                  <span className="text-gray-700">{p.course_title}</span>
                  <span
                    className={
                      p.status === 'revoked'
                        ? 'text-xs font-medium text-amber-700'
                        : 'text-xs font-medium text-gray-500'
                    }
                  >
                    {p.status === 'revoked' ? 'revoked' : 'valid'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
          <span>Issued {formatDate(badge.badge?.issued_at)}</span>
          {interview.evaluator_type && (
            <span>
              Evaluated by {interview.evaluator_type}
              {interview.model && ` (${interview.model})`}
            </span>
          )}
        </div>
        {interview.evidence_fingerprint && (
          <p className="mt-2 break-all text-[10px] text-gray-300">
            Evidence: {interview.evidence_fingerprint}
          </p>
        )}
      </div>
    </div>
  );
};

export default Credential;
