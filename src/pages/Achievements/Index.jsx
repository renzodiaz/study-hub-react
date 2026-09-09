import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckBadgeIcon,
  AcademicCapIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/20/solid';

import { getCertificates, getSeniorityBadges } from '@api/learn';
import ContentHeading from '@layouts/partials/ContentHeading';

const LEVEL_LABELS = {
  beginner: 'Beginner',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};

const TARGET_LEVEL_LABELS = {
  mid_senior: 'Mid-Senior',
};

const isKnowledge = (cert) => cert.credential_kind === 'knowledge';

const publicUrl = (token) => `${window.location.origin}/verify/${token}`;

const linkedInUrl = (cert) => {
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: cert.course_title ?? 'Study Hub Certificate',
    organizationName: 'Study Hub',
    certUrl: publicUrl(cert.public_token),
    certId: cert.public_token,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : '';

const CertificateCard = ({ certificate }) => {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl(certificate.public_token));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <li className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-x-3">
        <AcademicCapIcon className="size-8 text-indigo-600" />
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {certificate.course_title}
          </h3>
          <p className="text-xs text-gray-500">
            Issued {formatDate(certificate.issued_at)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isKnowledge(certificate) ? (
          <>
            <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              Knowledge credential
            </span>
            <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              {TARGET_LEVEL_LABELS[certificate.target_level] ??
                certificate.target_level}{' '}
              standard
            </span>
          </>
        ) : (
          <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
            {LEVEL_LABELS[certificate.level] ?? certificate.level}
          </span>
        )}
        {certificate.revoked && (
          <span className="inline-flex w-fit items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            Revoked
          </span>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <a
          href={publicUrl(certificate.public_token)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
        >
          <ArrowTopRightOnSquareIcon className="size-4" />
          Verify
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <LinkIcon className="size-4" />
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <a
          href={linkedInUrl(certificate)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-x-1.5 rounded-md bg-[#0a66c2] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          Add to LinkedIn
        </a>
      </div>
    </li>
  );
};

const BadgeCard = ({ badge }) => (
  <li className="flex items-center gap-x-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-lg text-xl font-semibold text-white"
      style={{ backgroundColor: badge.career_track_color ?? '#6366f1' }}
    >
      {badge.career_track_icon ?? '🏅'}
    </div>
    <div className="min-w-0">
      <h3 className="truncate text-sm font-semibold text-gray-900">
        {LEVEL_LABELS[badge.level] ?? badge.level} · {badge.career_track_name}
      </h3>
      <p className="text-xs text-gray-500">
        Earned {formatDate(badge.earned_at)}
      </p>
    </div>
  </li>
);

const Achievements = () => {
  const { data: certificates = [], isLoading: certsLoading } = useQuery({
    queryKey: ['learn', 'certificates'],
    queryFn: getCertificates,
  });
  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['learn', 'badges'],
    queryFn: getSeniorityBadges,
  });

  const isLoading = certsLoading || badgesLoading;
  const isEmpty =
    !isLoading && certificates.length === 0 && badges.length === 0;

  return (
    <div className="space-y-10">
      <ContentHeading title="Achievements" />

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading your achievements...</p>
      ) : isEmpty ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <CheckBadgeIcon className="mx-auto size-8 text-gray-400" />
          <p className="mt-3 text-sm text-gray-500">
            No credentials yet — complete a module exam to earn your first one.
          </p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Certificates
            </h2>
            {certificates.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No certificates yet.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {certificates.map((c) => (
                  <CertificateCard key={c.id} certificate={c} />
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Seniority badges
            </h2>
            {badges.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No badges yet.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {badges.map((b) => (
                  <BadgeCard key={b.id} badge={b} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Achievements;
